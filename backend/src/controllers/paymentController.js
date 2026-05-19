/**
 * Starts Stripe checkout sessions and applies payment side effects after confirmation.
 */
import Stripe from "stripe";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { stripe } from "../config/stripe.js";
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import { createNotification } from "../services/notificationService.js";
import { publishLiveEvent } from "../services/liveUpdateService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertNumber } from "../utils/validation.js";
import { formatCurrency } from "../utils/formatters.js";

// Winner checkout is now the only Stripe-backed payment workflow in the project.
async function applyCompletedSessionEffects(session) {
  return applyWinnerOrderSessionEffects(session);
}

// Winner checkout touches buyer, order, seller, and ledger state together, so it
// runs inside a database transaction.
async function applyWinnerOrderSessionEffects(session) {
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

      // Persist Stripe references directly on the order for reconciliation/support.
      order.status = "Paid";
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
          amount,
          channel: "Stripe",
          metadata: {
            orderId: String(order._id),
            stripeSessionId: session.id,
          },
        }], { session: dbSession });
      }
    });
  } finally {
    await dbSession.endSession();
  }

  if (!order) {
    return null;
  }

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
      body: `Payment for order ${order.code} has been received. You can prepare the shipment now.`,
      type: "order",
      href: "/seller/orders",
      metadata: {
        orderId: order._id,
        stripeSessionId: session.id,
      },
    }),
  ]);

  publishLiveEvent({
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

export const createCheckoutSession = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw new ApiError(503, "Stripe is not configured yet.");
  }

  const purpose = req.body.purpose === "winner-order" ? "winner-order" : "";
  let amount = 0;
  let successUrl = "";
  let cancelUrl = "";
  let productName = "";
  let metadata = {
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
  } else {
    throw new ApiError(400, "Unsupported payment purpose.");
  }

  const session = await stripe.checkout.sessions.create({
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
    },
  });
});

export const confirmCheckoutSession = asyncHandler(async (req, res) => {
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
    throw new ApiError(403, "You cannot confirm another user's payment session.");
  }

  await applyCompletedSessionEffects(session);

  res.json({
    success: true,
    message: "Winning order payment confirmed successfully.",
  });
});

export async function handleStripeWebhook(req, res, next) {
  try {
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
