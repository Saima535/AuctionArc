import Stripe from "stripe";
import { env } from "../config/env.js";
import { stripe } from "../config/stripe.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertNumber } from "../utils/validation.js";

async function applyCompletedSessionEffects(session) {
  const userId = session.metadata?.userId;
  const type = session.metadata?.type;
  const amount = Number(session.amount_total || 0) / 100;
  const code = `TXN-WEB-${session.id}`;
  const existingTransaction = await Transaction.findOne({ code });

  if (!userId) {
    throw new ApiError(400, "Stripe session is missing the account owner.");
  }

  if (existingTransaction) {
    return existingTransaction;
  }

  if (type === "listing-feature") {
    await Transaction.create({
      code,
      user: userId,
      type: "Listing feature credit",
      status: "Completed",
      amount,
      channel: "Stripe",
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { "wallet.featureCredits": 1 },
    });

    await createNotification({
      userId,
      title: "Feature credit ready",
      body: "Your $1 feature credit is ready to use on a listing.",
      type: "payment",
      href: "/seller/listings/new",
      metadata: {
        sessionId: session.id,
      },
    });

    return null;
  }

  await Transaction.create({
    code,
    user: userId,
    type: "Wallet top-up",
    status: "Completed",
    amount,
    channel: "Stripe",
  });

  await User.findByIdAndUpdate(userId, {
    $inc: { "wallet.availableBalance": amount },
  });

  return null;
}

export const createCheckoutSession = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw new ApiError(503, "Stripe is not configured yet.");
  }

  const purpose = req.body.purpose === "listing-feature" ? "listing-feature" : "wallet-top-up";
  const amount =
    purpose === "listing-feature"
      ? 1
      : assertNumber(req.body.amount, "Amount", { min: 1, max: 50000 });
  const successUrl =
    purpose === "listing-feature"
      ? `${env.clientUrl}/seller/listings/new?featurePayment=success&session_id={CHECKOUT_SESSION_ID}`
      : `${env.clientUrl}/bidder/wallet?status=success`;
  const cancelUrl =
    purpose === "listing-feature"
      ? `${env.clientUrl}/seller/listings/new?featurePayment=cancelled`
      : `${env.clientUrl}/bidder/wallet?status=cancelled`;
  const productName =
    purpose === "listing-feature"
      ? "AuctionArc listing feature credit"
      : "AuctionArc wallet top-up";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: req.user._id.toString(),
      type: purpose,
    },
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
    message:
      session.metadata?.type === "listing-feature"
        ? "Feature credit added successfully."
        : "Payment confirmed successfully.",
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
