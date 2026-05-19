/**
 * Declares Stripe checkout, confirmation, and webhook endpoints.
 */
import { Router } from "express";
import {
  confirmCheckoutSession,
  createCheckoutSession,
  handleStripeWebhook,
} from "../controllers/paymentController.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/checkout-session", requireRole("Bidder", "Seller"), createCheckoutSession);
router.post("/confirm-session", requireRole("Bidder", "Seller"), confirmCheckoutSession);
router.post("/webhook", handleStripeWebhook);

export default router;
