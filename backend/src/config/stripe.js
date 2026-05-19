/**
 * Creates the Stripe SDK client when payment credentials are available.
 */
import Stripe from "stripe";
import { env } from "./env.js";

export const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey)
  : null;
