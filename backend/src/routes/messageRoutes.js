import { Router } from "express";
import { createThread, getThreads, postThreadMessage } from "../controllers/messageController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", getThreads);
router.post("/", createThread);
router.post("/:threadId/messages", postThreadMessage);

export default router;
