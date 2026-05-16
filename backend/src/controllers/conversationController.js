import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { Auction } from "../models/Auction.js";
import { Listing } from "../models/Listing.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

/**
 * Get or create a conversation between buyer and seller
 * Ensures only one conversation per buyer-seller pair
 */
export const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { otherUserId, auctionId, listingId } = req.body;

  if (!otherUserId) {
    throw new ApiError(400, "Other user ID is required");
  }

  const userId = req.user._id;

  // Prevent self-conversation
  if (String(userId) === String(otherUserId)) {
    throw new ApiError(400, "Cannot create conversation with yourself");
  }

  // Verify other user exists
  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    throw new ApiError(404, "User not found");
  }

  // Verify auction/listing if provided
  let auction = null;
  let listing = null;
  if (auctionId) {
    auction = await Auction.findById(auctionId);
    if (!auction) {
      throw new ApiError(404, "Auction not found");
    }
  }
  if (listingId) {
    listing = await Listing.findById(listingId);
    if (!listing) {
      throw new ApiError(404, "Listing not found");
    }
  }

  // Determine buyer and seller
  let buyerId, sellerId;
  if (req.user.role === "Buyer") {
    buyerId = userId;
    sellerId = otherUserId;
  } else if (req.user.role === "Seller") {
    buyerId = otherUserId;
    sellerId = userId;
  } else {
    throw new ApiError(400, "Invalid user role for conversation");
  }

  // Find or create conversation
  let conversation = await Conversation.findOne({
    buyerId,
    sellerId,
  }).populate("buyerId sellerId lastMessageSenderId", "name role avatar");

  if (!conversation) {
    // Create new conversation
    conversation = new Conversation({
      buyerId,
      sellerId,
      participants: [buyerId, sellerId],
      auctionId: auctionId || null,
      listingId: listingId || null,
    });
    await conversation.save();
    await conversation.populate("buyerId sellerId lastMessageSenderId", "name role avatar");
  }

  res.json({
    success: true,
    data: formatConversation(conversation),
  });
});

/**
 * Get all conversations for the current user
 */
export const getMyConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status = "Active" } = req.query;

  // Get conversations where user is participant
  const conversations = await Conversation.find({
    participants: userId,
    status: status,
  })
    .populate("buyerId sellerId lastMessageSenderId", "name role avatar status")
    .sort({ lastMessageAt: -1 })
    .lean();

  res.json({
    success: true,
    data: conversations.map(formatConversation),
  });
});

/**
 * Get seller's conversations (seller inbox)
 */
export const getSellerConversations = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const conversations = await Conversation.find({
    sellerId,
    status: "Active",
  })
    .populate("buyerId sellerId lastMessageSenderId", "name role avatar status")
    .sort({ lastMessageAt: -1 })
    .lean();

  // Calculate unread count for each conversation
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        receiverId: sellerId,
        isRead: false,
      });
      return {
        ...conv,
        unreadCount,
      };
    }),
  );

  res.json({
    success: true,
    data: conversationsWithUnread.map(formatConversation),
  });
});

/**
 * Get buyer's conversations (buyer inbox)
 */
export const getBuyerConversations = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;

  const conversations = await Conversation.find({
    buyerId,
    status: "Active",
  })
    .populate("buyerId sellerId lastMessageSenderId", "name role avatar status")
    .sort({ lastMessageAt: -1 })
    .lean();

  // Calculate unread count for each conversation
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        receiverId: buyerId,
        isRead: false,
      });
      return {
        ...conv,
        unreadCount,
      };
    }),
  );

  res.json({
    success: true,
    data: conversationsWithUnread.map(formatConversation),
  });
});

/**
 * Get a specific conversation with authorization check
 */
export const getConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findById(conversationId).populate(
    "buyerId sellerId lastMessageSenderId",
    "name role avatar status",
  );

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  // Verify user is a participant
  if (!conversation.participants.includes(userId)) {
    throw new ApiError(403, "Unauthorized access to this conversation");
  }

  res.json({
    success: true,
    data: formatConversation(conversation),
  });
});

/**
 * Send a message in a conversation
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { text } = req.body;
  const senderId = req.user._id;

  // Validate message text
  if (!text || !text.trim()) {
    throw new ApiError(400, "Message text is required");
  }

  if (text.trim().length > 4000) {
    throw new ApiError(400, "Message must be less than 4000 characters");
  }

  // Get conversation
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  // Verify sender is a participant
  if (!conversation.participants.includes(senderId)) {
    throw new ApiError(403, "Unauthorized to send message in this conversation");
  }

  // Verify conversation is not blocked
  if (conversation.isBlocked && String(conversation.blockedBy) !== String(senderId)) {
    throw new ApiError(403, "This conversation has been blocked");
  }

  // Determine receiver
  const receiverId = conversation.buyerId._id === senderId ? conversation.sellerId : conversation.buyerId;

  // Create message
  const message = new Message({
    conversationId,
    senderId,
    receiverId,
    text: text.trim(),
    type: "text",
  });

  await message.save();

  // Update conversation
  conversation.lastMessage = text.trim().substring(0, 100);
  conversation.lastMessageAt = new Date();
  conversation.lastMessageSenderId = senderId;

  // Update read status based on user role
  if (String(conversation.buyerId) === String(senderId)) {
    conversation.buyerLastReadAt = new Date();
  } else {
    conversation.sellerLastReadAt = new Date();
  }

  await conversation.save();

  // Create notification for receiver
  try {
    const receiverUser = await User.findById(receiverId);
    const senderUser = await User.findById(senderId);
    
    if (receiverUser) {
      await createNotification(receiverId, {
        type: "message",
        title: `New message from ${senderUser.name}`,
        body: text.trim().substring(0, 100),
        data: {
          conversationId: conversationId.toString(),
          senderId: senderId.toString(),
        },
      });
    }
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't fail the request if notification fails
  }

  // Populate sender and receiver info
  await message.populate("senderId receiverId", "name avatar role");

  res.status(201).json({
    success: true,
    data: formatMessage(message),
  });
});

/**
 * Get messages for a conversation with pagination
 */
export const getConversationMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 50 } = req.query;

  // Get conversation
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  // Verify user is a participant
  if (!conversation.participants.includes(userId)) {
    throw new ApiError(403, "Unauthorized access to this conversation");
  }

  // Get messages with pagination (most recent first in reverse order)
  const skip = (page - 1) * limit;
  const messages = await Message.find({
    conversationId,
    isDeleted: false,
  })
    .populate("senderId receiverId", "name avatar role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Reverse to get chronological order
  const chronologicalMessages = messages.reverse();

  // Mark messages as read for the current user
  await Message.updateMany(
    {
      conversationId,
      receiverId: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    },
  );

  // Get total count
  const totalMessages = await Message.countDocuments({
    conversationId,
    isDeleted: false,
  });

  res.json({
    success: true,
    data: {
      messages: chronologicalMessages.map(formatMessage),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
      },
    },
  });
});

/**
 * Get unread message count for current user
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const unreadCount = await Message.countDocuments({
    receiverId: userId,
    isRead: false,
  });

  res.json({
    success: true,
    data: {
      unreadCount,
    },
  });
});

/**
 * Archive a conversation
 */
export const archiveConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  // Verify user is a participant
  if (!conversation.participants.includes(userId)) {
    throw new ApiError(403, "Unauthorized to archive this conversation");
  }

  conversation.status = "Archived";
  await conversation.save();

  res.json({
    success: true,
    message: "Conversation archived successfully",
  });
});

/**
 * Delete a conversation (soft delete - archive it)
 */
export const deleteConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  // Verify user is a participant
  if (!conversation.participants.includes(userId)) {
    throw new ApiError(403, "Unauthorized to delete this conversation");
  }

  conversation.status = "Closed";
  await conversation.save();

  res.json({
    success: true,
    message: "Conversation deleted successfully",
  });
});

/**
 * Helper function to format conversation response
 */
function formatConversation(conversation) {
  return {
    id: conversation._id,
    buyerId: conversation.buyerId?._id,
    buyerName: conversation.buyerId?.name,
    buyerAvatar: conversation.buyerId?.avatar,
    sellerId: conversation.sellerId?._id,
    sellerName: conversation.sellerId?.name,
    sellerAvatar: conversation.sellerId?.avatar,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    lastMessageSenderName: conversation.lastMessageSenderId?.name,
    auctionId: conversation.auctionId,
    listingId: conversation.listingId,
    status: conversation.status,
    isBlocked: conversation.isBlocked,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    buyerLastReadAt: conversation.buyerLastReadAt,
    sellerLastReadAt: conversation.sellerLastReadAt,
  };
}

/**
 * Helper function to format message response
 */
function formatMessage(message) {
  return {
    id: message._id,
    conversationId: message.conversationId,
    senderId: message.senderId?._id,
    senderName: message.senderId?.name,
    senderAvatar: message.senderId?.avatar,
    senderRole: message.senderId?.role,
    receiverId: message.receiverId?._id,
    receiverName: message.receiverId?.name,
    text: message.text,
    type: message.type,
    isRead: message.isRead,
    readAt: message.readAt,
    isEdited: message.isEdited,
    editedAt: message.editedAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}
