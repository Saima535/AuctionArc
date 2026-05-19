/**
 * Declares server-sent event endpoints for live marketplace updates.
 */
import { Router } from "express";
import { streamLiveUpdates } from "../controllers/liveController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/stream", requireAuth, streamLiveUpdates);

export default router;
