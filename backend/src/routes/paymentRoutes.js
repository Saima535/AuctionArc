import { Router } from "express";
import {
  createCheckoutSession,
  handleStripeWebhook,
} from "../controllers/paymentController.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/checkout-session", requireRole("Bidder", "Seller"), createCheckoutSession);
router.post("/webhook", handleStripeWebhook);

export default router;
