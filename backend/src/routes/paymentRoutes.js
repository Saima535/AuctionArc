/**
 * Declares Stripe checkout, confirmation, and webhook endpoints.
 */
import { Router } from "express";
import {
  confirmCheckoutSession,
  createCheckoutSession,
  handleStripeWebhook,
} from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/checkout-session", requireAuth, createCheckoutSession);
router.post("/confirm-session", requireAuth, confirmCheckoutSession);
router.post("/webhook", handleStripeWebhook);

export default router;
