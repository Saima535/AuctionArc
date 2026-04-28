import Stripe from "stripe";
import { env } from "../config/env.js";
import { stripe } from "../config/stripe.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertNumber } from "../utils/validation.js";

export const createCheckoutSession = asyncHandler(async (req, res) => {
  if (!stripe) {
    throw new ApiError(503, "Stripe is not configured yet.");
  }

  const amount = assertNumber(req.body.amount, "Amount", { min: 1, max: 50000 });

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
      const userId = session.metadata?.userId;
      const amount = Number(session.amount_total || 0) / 100;
      const code = `TXN-WEB-${session.id}`;
      const existingTransaction = await Transaction.findOne({ code });

      if (!userId) {
        throw new ApiError(400, "Stripe session is missing the wallet owner.");
      }

      if (!existingTransaction) {
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
      }
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
