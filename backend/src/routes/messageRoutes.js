import { Router } from "express";
import { getThreads, postThreadMessage } from "../controllers/messageController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", getThreads);
router.post("/:threadId/messages", postThreadMessage);

export default router;
