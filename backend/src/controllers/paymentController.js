/**
 * Starts Stripe checkout sessions and applies payment side effects after confirmation.
 */
import Stripe from "stripe";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { stripe } from "../config/stripe.js";
import { Auction } from "../models/Auction.js";
import { Listing } from "../models/Listing.js";
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import { createNotification } from "../services/notificationService.js";
import { syncAuctionForListing } from "../services/auctionLifecycleService.js";
import { publishLiveEvent } from "../services/liveUpdateService.js";
import {
  calculateCommissionBreakdown,
  getOrderFinancials,
  PLATFORM_COMMISSION_RATE,
} from "../services/commissionService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateUniqueCode } from "../utils/codeGenerator.js";
import { assertNumber } from "../utils/validation.js";
import { formatCurrency } from "../utils/formatters.js";

const FEATURED_LISTING_AMOUNT = 1;

// Stripe checkout currently supports winner payments and seller-paid featured
// listing upgrades. The metadata type tells us which post-payment workflow to run.
async function applyCompletedSessionEffects(session) {
  // Stripe metadata is the router for post-payment business logic because the
  // same webhook/confirmation endpoint handles multiple payment scenarios.
  const paymentType = session.metadata?.type;

  if (paymentType === "winner-order") {
    return {
      type: paymentType,
      resource: await applyWinnerOrderSessionEffects(session),
    };
  }

  if (paymentType === "featured-listing") {
    return {
      type: paymentType,
      resource: await applyFeaturedListingSessionEffects(session),
    };
  }

  if (paymentType === "buy-now-order") {
    return {
      type: paymentType,
      resource: await applyBuyNowSessionEffects(session),
    };
  }

  throw new ApiError(400, "Stripe session metadata is missing a supported payment type.");
}

// Winner checkout touches buyer, order, seller, and ledger state together, so it
// runs inside a database transaction.
async function applyWinnerOrderSessionEffects(session) {
  // Winner checkout uses stored order data rather than trusting client values.
  const userId = session.metadata?.userId;
  const orderId = session.metadata?.orderId;
  const amount = Number(session.amount_total || 0) / 100;
  const buyerTransactionCode = `TXN-WIN-${session.id}-BUYER`;
  const sellerTransactionCode = `TXN-WIN-${session.id}-SELLER`;

  if (!userId || !orderId) {
    throw new ApiError(400, "Stripe session is missing the winning order details.");
  }

  const dbSession = await mongoose.startSession();
  let order = null;

  try {
    await dbSession.withTransaction(async () => {
      // A completed winner payment should eventually have one buyer-side ledger row
      // and one seller-side ledger row. Their presence acts as an idempotency check.
      const existingTransactions = await Transaction.find({
        code: { $in: [buyerTransactionCode, sellerTransactionCode] },
      }).session(dbSession);

      if (existingTransactions.length === 2) {
        // If both ledger rows already exist we treat the payment as fully applied.
        order = await Order.findById(orderId).session(dbSession);
        return;
      }

      order = await Order.findOne({
        _id: orderId,
        bidder: userId,
      }).session(dbSession);

      if (!order) {
        throw new ApiError(404, "Winning order not found for this bidder.");
      }

      if (order.status !== "Payment pending" && existingTransactions.length === 0) {
        throw new ApiError(400, "This winning order is not awaiting payment anymore.");
      }

      const { commissionAmount, sellerPayoutAmount } = getOrderFinancials(order);

      // Persist Stripe references directly on the order for reconciliation/support.
      order.status = "Paid";
      order.commissionAmount = commissionAmount;
      order.sellerPayoutAmount = sellerPayoutAmount;
      order.escrowAmount = sellerPayoutAmount;
      order.paymentSessionId = session.id;
      order.paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : "";
      order.paidAt = new Date();
      await order.save({ session: dbSession });

      if (!existingTransactions.some((entry) => entry.code === buyerTransactionCode)) {
        await Transaction.create([{
          code: buyerTransactionCode,
          user: order.bidder,
          order: order._id,
          type: "Winning bid payment",
          status: "Completed",
          amount,
          channel: "Stripe",
          metadata: {
            orderId: String(order._id),
            stripeSessionId: session.id,
            grossAmount: amount,
            commissionAmount,
            sellerPayoutAmount,
          },
        }], { session: dbSession });
      }

      if (!existingTransactions.some((entry) => entry.code === sellerTransactionCode)) {
        await Transaction.create([{
          code: sellerTransactionCode,
          user: order.seller,
          order: order._id,
          type: "Auction sale",
          status: "Pending payout",
          amount: sellerPayoutAmount,
          channel: "Stripe",
          metadata: {
            orderId: String(order._id),
            stripeSessionId: session.id,
            grossAmount: amount,
            commissionAmount,
            sellerPayoutAmount,
          },
        }], { session: dbSession });
      }
    });
  } finally {
    await dbSession.endSession();
  }

  if (!order) {
    // Null means the side effects were already applied and no new work was needed.
    return null;
  }

  // Buyer and seller notifications are emitted after the transaction so payment
  // persistence succeeds even if notification infrastructure has issues later.
  await Promise.all([
    createNotification({
      userId: order.bidder,
      title: "Winning order paid",
      body: `Your payment of ${formatCurrency(amount)} was received successfully.`,
      type: "payment",
      href: "/bidder/wins",
      metadata: {
        orderId: order._id,
        stripeSessionId: session.id,
      },
    }),
    createNotification({
      userId: order.seller,
      title: "Winner payment received",
      body: `Payment for order ${order.code} has been received. Your payout after the 5% commission is ${formatCurrency(getOrderFinancials(order).sellerPayoutAmount)}.`,
      type: "order",
      href: "/seller/orders",
      metadata: {
        orderId: order._id,
        stripeSessionId: session.id,
      },
    }),
  ]);

  publishLiveEvent({
    // Realtime dashboards refresh order state off this event.
    event: "order.updated",
    channels: ["market:orders"],
    userIds: [order.bidder, order.seller],
    roles: ["Admin"],
    payload: {
      orderId: order._id,
      orderCode: order.code,
      status: order.status,
      paidAt: order.paidAt,
    },
  });

  return order;
}

// Featured listing upgrades are seller-owned purchases that toggle premium
// marketplace placement for one listing and then refresh any live auction view.
async function applyFeaturedListingSessionEffects(session) {
  // Featured listing payments operate on seller-owned listings only.
  const userId = session.metadata?.userId;
  const listingId = session.metadata?.listingId;
  const amount = Number(session.amount_total || 0) / 100;
  const transactionCode = `TXN-FEATURE-${session.id}`;

  if (!userId || !listingId) {
    throw new ApiError(400, "Stripe session is missing the featured listing details.");
  }

  const dbSession = await mongoose.startSession();
  let listing = null;

  try {
    await dbSession.withTransaction(async () => {
      // A repeated webhook/confirm call must not create duplicate transactions.
      const existingTransaction = await Transaction.findOne({
        code: transactionCode,
      }).session(dbSession);

      listing = await Listing.findOne({
        _id: listingId,
        seller: userId,
      }).session(dbSession);

      if (!listing) {
        throw new ApiError(404, "Listing not found for this seller.");
      }

      if (!listing.premiumHighlight) {
        // Feature placement can be safely re-applied because the flag is idempotent.
        listing.premiumHighlight = true;
        await listing.save({ session: dbSession });
      }

      if (existingTransaction) {
        return;
      }

      await Transaction.create([{
        code: transactionCode,
        user: listing.seller,
        type: "Featured listing purchase",
        status: "Completed",
        amount,
        channel: "Stripe",
        metadata: {
          listingId: String(listing._id),
          listingCode: listing.code,
          stripeSessionId: session.id,
        },
      }], { session: dbSession });
    });
  } finally {
    await dbSession.endSession();
  }

  if (!listing) {
    return null;
  }

  listing = await Listing.findById(listing._id);

  if (!listing) {
    return null;
  }

  const auction = await syncAuctionForListing(listing);

  // Notifications and live events happen after the listing/auction state is durable.
  await createNotification({
    userId: listing.seller,
    title: "Featured placement activated",
    body: `"${listing.title}" now has featured placement in AuctionArc for ${formatCurrency(amount)}.`,
    type: "listing",
    href: "/seller/listings",
    metadata: {
      listingId: listing._id,
      auctionId: auction?._id || null,
      stripeSessionId: session.id,
    },
  });

  publishLiveEvent({
    event: "listing.updated",
    channels: ["market:auctions", "market:watchlist"],
    userIds: [listing.seller],
    roles: ["Admin", "Bidder"],
    payload: {
      listingId: listing._id,
      auctionId: auction?._id || null,
      premiumHighlight: true,
      status: listing.status,
      auctionStatus: auction?.status || null,
    },
  });

  return listing;
}

async function getOrCreateBuyNowOrder({ listing, buyerId, amount, session }) {
  // Buy-now checkout may be retried, so we reuse a matching pending/commercial
  // order instead of creating duplicates for the same buyer/listing/amount.
  const existingOrder = await Order.findOne({
    listing: listing._id,
    bidder: buyerId,
    amount,
    purchaseType: "Buy now",
  }).session(session);

  if (existingOrder) {
    return existingOrder;
  }

  const code = await generateUniqueCode(Order, "ORD-", { digits: 4, min: 5001 });
  const { commissionAmount, sellerPayoutAmount } = calculateCommissionBreakdown(amount);

  // Buy-now orders enter the same fulfilment pipeline as auction-win orders,
  // but are tagged with a different purchase type.
  const createdOrders = await Order.create([{
    code,
    item: listing.title,
    seller: listing.seller,
    bidder: buyerId,
    listing: listing._id,
    purchaseType: "Buy now",
    amount,
    commissionAmount,
    sellerPayoutAmount,
    escrowAmount: sellerPayoutAmount,
    status: "Payment pending",
  }], { session });

  return createdOrders[0];
}

async function applyBuyNowSessionEffects(session) {
  // Buy-now settlement mirrors winner-order settlement, but it also closes the
  // associated auction immediately because the product has been sold outright.
  const userId = session.metadata?.userId;
  const orderId = session.metadata?.orderId;
  const listingId = session.metadata?.listingId;
  const auctionId = session.metadata?.auctionId;
  const amount = Number(session.amount_total || 0) / 100;
  const buyerTransactionCode = `TXN-BUYNOW-${session.id}-BUYER`;
  const sellerTransactionCode = `TXN-BUYNOW-${session.id}-SELLER`;

  if (!userId || !orderId || !listingId) {
    throw new ApiError(400, "Stripe session is missing the buy now order details.");
  }

  const dbSession = await mongoose.startSession();
  let order = null;
  let listing = null;
  let auction = null;

  try {
    await dbSession.withTransaction(async () => {
      // Dual transaction rows provide a simple idempotency marker for repeated
      // webhook deliveries or confirmation retries.
      const existingTransactions = await Transaction.find({
        code: { $in: [buyerTransactionCode, sellerTransactionCode] },
      }).session(dbSession);

      order = await Order.findOne({
        _id: orderId,
        bidder: userId,
        purchaseType: "Buy now",
      }).session(dbSession);

      if (!order) {
        throw new ApiError(404, "Buy now order not found for this bidder.");
      }

      listing = await Listing.findById(listingId).session(dbSession);

      if (!listing) {
        throw new ApiError(404, "Listing not found for this buy now order.");
      }

      // Auction context is optional in metadata because some future buy-now
      // flows may originate from listing-first views rather than auction cards.
      auction = auctionId ? await Auction.findById(auctionId).session(dbSession) : null;

      if (existingTransactions.length !== 2) {
        if (order.status !== "Payment pending") {
          throw new ApiError(400, "This buy now order is not awaiting payment anymore.");
        }

        const { commissionAmount, sellerPayoutAmount } = getOrderFinancials(order);

        order.status = "Paid";
        order.commissionAmount = commissionAmount;
        order.sellerPayoutAmount = sellerPayoutAmount;
        order.escrowAmount = sellerPayoutAmount;
        order.paymentSessionId = session.id;
        order.paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : "";
        order.paidAt = new Date();
        await order.save({ session: dbSession });

        if (!existingTransactions.some((entry) => entry.code === buyerTransactionCode)) {
          // Buyer ledger row records the successful outgoing payment.
          await Transaction.create([{
            code: buyerTransactionCode,
            user: order.bidder,
            order: order._id,
            type: "Buy now payment",
            status: "Completed",
            amount,
            channel: "Stripe",
            metadata: {
              orderId: String(order._id),
              listingId: String(listing._id),
              stripeSessionId: session.id,
              grossAmount: amount,
              commissionAmount,
              sellerPayoutAmount,
            },
          }], { session: dbSession });
        }

        if (!existingTransactions.some((entry) => entry.code === sellerTransactionCode)) {
          // Seller ledger row records the incoming sale that will later be paid out.
          await Transaction.create([{
            code: sellerTransactionCode,
            user: order.seller,
            order: order._id,
            type: "Buy now sale",
            status: "Pending payout",
            amount: sellerPayoutAmount,
            channel: "Stripe",
            metadata: {
              orderId: String(order._id),
              listingId: String(listing._id),
              stripeSessionId: session.id,
              grossAmount: amount,
              commissionAmount,
              sellerPayoutAmount,
            },
          }], { session: dbSession });
        }
      }

      if (auction) {
        // Closing the auction immediately prevents further bidding after an
        // instant purchase has already completed successfully.
        auction.status = "Closed";
        auction.winner = order.bidder;
        auction.closedReason = "buy-now";
        auction.settling = false;
        auction.settlingAt = null;
        auction.settledAt = order.paidAt || new Date();
        await auction.save({ session: dbSession });
      }
    });
  } finally {
    await dbSession.endSession();
  }

  await Promise.all([
    // Both parties are notified after the payment becomes durable.
    createNotification({
      userId: order.bidder,
      title: "Buy now payment received",
      body: `Your payment of ${formatCurrency(amount)} for "${listing.title}" was received successfully.`,
      type: "payment",
      href: "/bidder/wins",
      metadata: {
        orderId: order._id,
        listingId: listing._id,
        auctionId: auction?._id || null,
        stripeSessionId: session.id,
      },
    }),
    createNotification({
      userId: order.seller,
      title: "Buy now order paid",
      body: `"${listing.title}" was purchased instantly for ${formatCurrency(amount)}. Your payout after the 5% commission is ${formatCurrency(getOrderFinancials(order).sellerPayoutAmount)}.`,
      type: "order",
      href: "/seller/orders",
      metadata: {
        orderId: order._id,
        listingId: listing._id,
        auctionId: auction?._id || null,
        stripeSessionId: session.id,
      },
    }),
  ]);

  publishLiveEvent({
    // A buy-now checkout updates both order dashboards and auction discovery.
    event: "order.updated",
    channels: ["market:orders", "market:auctions"],
    userIds: [order.bidder, order.seller],
    roles: ["Admin"],
    payload: {
      orderId: order._id,
      orderCode: order.code,
      listingId: listing._id,
      auctionId: auction?._id || null,
      status: order.status,
      paidAt: order.paidAt,
      purchaseType: "Buy now",
    },
  });

  return order;
}

export const createCheckoutSession = asyncHandler(async (req, res) => {
  // Stripe checkout is shared by multiple payment intents, so purpose selection
  // determines which validation branch and metadata bundle we use.
  if (!stripe) {
    throw new ApiError(503, "Stripe is not configured yet.");
  }

  const purpose =
    req.body.purpose === "winner-order"
      ? "winner-order"
      : req.body.purpose === "featured-listing"
        ? "featured-listing"
        : req.body.purpose === "buy-now-order"
          ? "buy-now-order"
        : "";
  let amount = 0;
  let successUrl = "";
  let cancelUrl = "";
  let productName = "";
  let metadata = {
    // Every payment purpose is scoped to the authenticated user for confirm-time authorization.
    userId: req.user._id.toString(),
    type: purpose,
  };

  if (purpose === "winner-order") {
    // The payable amount comes from the stored order, not the client request.
    if (req.user.role !== "Bidder") {
      throw new ApiError(403, "Only bidders can pay for winning orders.");
    }

    const order = await Order.findOne({
      _id: req.body.orderId,
      bidder: req.user._id,
    });

    if (!order) {
      throw new ApiError(404, "Winning order not found.");
    }

    if (order.status !== "Payment pending") {
      throw new ApiError(400, "This winning order is not awaiting payment.");
    }

    amount = assertNumber(order.amount, "Winning order amount", { min: 1, max: 50000 });
    successUrl = `${env.clientUrl}/bidder/wins?status=success&session_id={CHECKOUT_SESSION_ID}&order=${order._id}`;
    cancelUrl = `${env.clientUrl}/bidder/wins?status=cancelled&order=${order._id}`;
    productName = `AuctionArc winning order ${order.code}`;
    metadata = {
      ...metadata,
      orderId: order._id.toString(),
      orderCode: order.code,
    };
  } else if (purpose === "featured-listing") {
    // Featured placement is a seller-owned one-off purchase for a listing.
    if (req.user.role !== "Seller") {
      throw new ApiError(403, "Only sellers can pay to feature a listing.");
    }

    const listing = await Listing.findOne({
      _id: req.body.listingId,
      seller: req.user._id,
    });

    if (!listing) {
      throw new ApiError(404, "Listing not found.");
    }

    const linkedAuction = await Auction.findOne({ listing: listing._id }).select("_id status");

    if (linkedAuction || ["Live", "Featured"].includes(listing.status)) {
      throw new ApiError(400, "Featured placement is only available before a listing becomes live.");
    }

    if (listing.premiumHighlight) {
      throw new ApiError(400, "This listing is already featured.");
    }

    amount = FEATURED_LISTING_AMOUNT;
    successUrl = `${env.clientUrl}/seller/listings?featurePayment=success&session_id={CHECKOUT_SESSION_ID}&listing=${listing._id}`;
    cancelUrl = `${env.clientUrl}/seller/listings?featurePayment=cancelled&listing=${listing._id}`;
    productName = `AuctionArc featured placement for ${listing.title}`;
    metadata = {
      ...metadata,
      listingId: listing._id.toString(),
      listingCode: listing.code,
    };
  } else if (purpose === "buy-now-order") {
    // Buy now is only valid for bidders because sellers cannot purchase their own stock.
    if (req.user.role !== "Bidder") {
      throw new ApiError(403, "Only bidders can use buy now.");
    }

    const auctionId = req.body.auctionId;
    const listing = await Listing.findById(req.body.listingId);

    if (!listing) {
      throw new ApiError(404, "Listing not found.");
    }

    if (!listing.buyNowPrice || Number(listing.buyNowPrice) <= 0) {
      throw new ApiError(400, "This listing is not available for buy now.");
    }

    // Prevent self-purchase regardless of what the frontend allows.
    if (String(listing.seller) === String(req.user._id)) {
      throw new ApiError(400, "You cannot buy your own listing.");
    }

    const auction = auctionId ? await Auction.findById(auctionId) : await Auction.findOne({ listing: listing._id });

    if (!auction || auction.status === "Closed") {
      throw new ApiError(400, "This product is no longer available for instant purchase.");
    }

    // Only one active buy-now commercial flow is allowed per listing.
    const existingSale = await Order.findOne({
      listing: listing._id,
      status: { $in: ["Payment pending", "Paid", "Awaiting shipment", "Delivered", "Completed"] },
      purchaseType: "Buy now",
    });

    if (existingSale) {
      if (String(existingSale.bidder) !== String(req.user._id)) {
        throw new ApiError(400, "Another buyer is already completing the buy now purchase for this listing.");
      }

      if (existingSale.status !== "Payment pending") {
        throw new ApiError(400, "You have already purchased this listing.");
      }
    }

    amount = assertNumber(listing.buyNowPrice, "Buy now amount", { min: 1, max: 50000 });

    const dbSession = await mongoose.startSession();
    let order = null;

    try {
      await dbSession.withTransaction(async () => {
        // The order is created before redirecting to Stripe so the eventual
        // confirmation step has a durable commercial record to update.
        order = await getOrCreateBuyNowOrder({
          listing,
          buyerId: req.user._id,
          amount,
          session: dbSession,
        });
      });
    } finally {
      await dbSession.endSession();
    }

    successUrl = `${env.clientUrl}/bidder/wins?status=success&session_id={CHECKOUT_SESSION_ID}&order=${order._id}`;
    cancelUrl = `${env.clientUrl}/bidder/wins?status=cancelled&order=${order._id}`;
    productName = `AuctionArc buy now purchase for ${listing.title}`;
    metadata = {
      ...metadata,
      orderId: order._id.toString(),
      listingId: listing._id.toString(),
      listingCode: listing.code,
      auctionId: auction?._id?.toString?.() || "",
    };
  } else {
    throw new ApiError(400, "Unsupported payment purpose.");
  }

  const session = await stripe.checkout.sessions.create({
    // Stripe line items are built from trusted server-side data only.
    payment_method_types: ["card"],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: productName,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
  });

  res.json({
    success: true,
    data: {
      sessionId: session.id,
      url: session.url,
      commissionRate: PLATFORM_COMMISSION_RATE,
    },
  });
});

export const confirmCheckoutSession = asyncHandler(async (req, res) => {
  // Frontend confirmation complements webhooks so local state can update in
  // development or when the user returns to the app after paying.
  if (!stripe) {
    throw new ApiError(503, "Stripe is not configured yet.");
  }

  const sessionId = req.body.sessionId;

  if (!sessionId) {
    throw new ApiError(400, "Session ID is required.");
  }

  // The frontend confirms after redirect so local state still updates in
  // development even when no webhook tunnel is configured.
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session || session.payment_status !== "paid") {
    throw new ApiError(400, "This payment has not been completed yet.");
  }

  if (session.metadata?.userId !== req.user._id.toString()) {
    // Confirming sessions is restricted to the user who created the checkout.
    throw new ApiError(403, "You cannot confirm another user's payment session.");
  }

  const applied = await applyCompletedSessionEffects(session);

  const message =
    applied.type === "winner-order"
      ? "Winning order payment confirmed successfully."
      : applied.type === "featured-listing"
        ? "Featured listing payment confirmed successfully."
        : applied.type === "buy-now-order"
          ? "Buy now payment confirmed successfully."
        : "Payment confirmed successfully.";

  res.json({
    success: true,
    message,
    data: {
      type: applied.type,
    },
  });
});

export async function handleStripeWebhook(req, res, next) {
  try {
    // Webhooks are the durable production path because they do not depend on
    // the buyer returning to the frontend after payment.
    if (!stripe) {
      throw new ApiError(503, "Stripe is not configured yet.");
    }

    if (!env.stripeWebhookSecret) {
      throw new ApiError(501, "Stripe webhook secret has not been configured yet.");
    }

    const signature = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      env.stripeWebhookSecret,
    );

    // Webhooks provide the durable production path when the user never returns to
    // the app after completing payment.
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await applyCompletedSessionEffects(session);
    }

    res.json({ received: true });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      next(new ApiError(400, "Invalid Stripe webhook signature."));
      return;
    }

    next(error);
  }
}
