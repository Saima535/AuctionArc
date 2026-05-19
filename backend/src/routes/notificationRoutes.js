/**
 * Declares notification retrieval and read-state endpoints.
 */
import { Router } from "express";
import {
  getNotifications,
  readAllNotifications,
  readNotification,
} from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", getNotifications);
router.patch("/read-all", readAllNotifications);
router.patch("/:notificationId/read", readNotification);

export default router;
