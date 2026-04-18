import Stripe from "stripe";
import { env } from "./env.js";

export const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey)
  : null;
