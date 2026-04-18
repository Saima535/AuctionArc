import Stripe from "stripe";
import { env } from "../config/env.js";
import { stripe } from "../config/stripe.js";
import { Transaction } from "../models/Transaction.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createCheckoutSession = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw new ApiError(503, "Stripe is not configured yet.");
  }

  const amount = Number(req.body.amount);

  if (!amount || amount <= 0) {
    throw new ApiError(400, "A positive amount is required.");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${env.clientUrl}/bidder/wallet?status=success`,
    cancel_url: `${env.clientUrl}/bidder/wallet?status=cancelled`,
    metadata: {
      userId: req.user._id.toString(),
      type: "wallet-top-up",
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "AuctionArc wallet top-up",
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
      const code = `TXN-WEB-${Date.now()}`;

      await Transaction.create({
        code,
        user: session.metadata.userId,
        type: "Wallet top-up",
        status: "Completed",
        amount: Number(session.amount_total || 0) / 100,
        channel: "Stripe",
      });
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
