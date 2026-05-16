import { Router } from "express";
import {
  getOrCreateConversation,
  getMyConversations,
  getSellerConversations,
  getBuyerConversations,
  getAdminConversations,
  getConversation,
  sendMessage,
  getConversationMessages,
  getUnreadCount,
  archiveConversation,
  deleteConversation,
} from "../controllers/conversationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Conversation routes
router.post("/", getOrCreateConversation); // Create or get existing conversation
router.get("/my", getMyConversations); // Get all user's conversations
router.get("/seller", getSellerConversations); // Get seller's conversations
router.get("/buyer", getBuyerConversations); // Get buyer's conversations
router.get("/admin", getAdminConversations); // Get admin view of all buyer/seller conversations
router.get("/unread-count", getUnreadCount); // Get unread message count
router.get("/:conversationId", getConversation); // Get specific conversation
router.patch("/:conversationId/archive", archiveConversation); // Archive conversation
router.delete("/:conversationId", deleteConversation); // Delete (close) conversation

// Message routes
router.post("/:conversationId/messages", sendMessage); // Send message
router.get("/:conversationId/messages", getConversationMessages); // Get messages with pagination

export default router;
