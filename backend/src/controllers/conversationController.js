/**
 * Powers the newer conversation and direct-message experience across marketplace roles.
 */
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { Auction } from "../models/Auction.js";
import { Listing } from "../models/Listing.js";
import { Thread } from "../models/Thread.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

function sameId(left, right) {
  return String(left) === String(right);
}

function hasParticipant(conversation, userId) {
  return conversation.participants?.some((participantId) => sameId(participantId, userId));
}

function profileImageUrl(user) {
  return user?.profilePicture?.url || "";
}

function legacyRoleLabel(roleLabel) {
  if (roleLabel === "Bidder") {
    return "Buyer";
  }

  return roleLabel;
}

async function migrateLegacyThreadsForUser(userId) {
  const legacyThreads = await Thread.find({
    "participants.user": userId,
    "participants.roleLabel": { $nin: ["Admin"] },
  }).lean();

  for (const thread of legacyThreads) {
    const buyerParticipant = thread.participants.find(
      (participant) => legacyRoleLabel(participant.roleLabel) === "Buyer",
    );
    const sellerParticipant = thread.participants.find(
      (participant) => participant.roleLabel === "Seller",
    );

    if (!buyerParticipant?.user || !sellerParticipant?.user) {
      continue;
    }

    let conversation = await Conversation.findOne({
      buyerId: buyerParticipant.user,
      sellerId: sellerParticipant.user,
    });

    if (!conversation) {
      const lastLegacyMessage = thread.messages.at(-1);
      const lastLegacySenderId =
        legacyRoleLabel(lastLegacyMessage?.senderRole) === "Buyer"
          ? buyerParticipant.user
          : sellerParticipant.user;

      conversation = await Conversation.create({
        buyerId: buyerParticipant.user,
        sellerId: sellerParticipant.user,
        participants: [buyerParticipant.user, sellerParticipant.user],
        lastMessage: lastLegacyMessage?.body?.substring(0, 100) || null,
        lastMessageAt: lastLegacyMessage?.sentAt || thread.updatedAt,
        lastMessageSenderId: lastLegacyMessage ? lastLegacySenderId : null,
        buyerLastReadAt: lastLegacyMessage?.sentAt || thread.updatedAt,
        sellerLastReadAt: lastLegacyMessage?.sentAt || thread.updatedAt,
        status: thread.status === "Resolved" ? "Archived" : "Active",
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      });
    }

    const existingMessageCount = await Message.countDocuments({
      conversationId: conversation._id,
    });

    if (existingMessageCount > 0) {
      continue;
    }

    const legacyMessages = thread.messages.map((legacyMessage, index) => {
      const normalizedSenderRole = legacyRoleLabel(legacyMessage.senderRole);
      const senderId =
        normalizedSenderRole === "Buyer" ? buyerParticipant.user : sellerParticipant.user;
      const receiverId =
        normalizedSenderRole === "Buyer" ? sellerParticipant.user : buyerParticipant.user;
      const sentAt = legacyMessage.sentAt || thread.createdAt || new Date();

      return {
        conversationId: conversation._id,
        senderId,
        receiverId,
        text: legacyMessage.body,
        type: "text",
        isRead: true,
        readAt: sentAt,
        createdAt: sentAt,
        updatedAt: sentAt,
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        deletedAt: null,
        __order: index,
      };
    });

    if (legacyMessages.length) {
      await Message.insertMany(
        legacyMessages
          .sort((left, right) => {
            const leftTime = new Date(left.createdAt).getTime();
            const rightTime = new Date(right.createdAt).getTime();

            if (leftTime === rightTime) {
              return left.__order - right.__order;
            }

            return leftTime - rightTime;
          })
          .map(({ __order, ...message }) => message),
      );
    }
  }
}

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
  if (req.user.role === "Bidder") {
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
  }).populate("buyerId sellerId lastMessageSenderId", "name role profilePicture status");

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
    await conversation.populate("buyerId sellerId lastMessageSenderId", "name role profilePicture status");
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

  await migrateLegacyThreadsForUser(userId);

  // Get conversations where user is participant
  const conversations = await Conversation.find({
    participants: userId,
    status: status,
  })
    .populate("buyerId sellerId lastMessageSenderId", "name role profilePicture status")
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

  await migrateLegacyThreadsForUser(sellerId);

  const conversations = await Conversation.find({
    sellerId,
    status: "Active",
  })
    .populate("buyerId sellerId lastMessageSenderId", "name role profilePicture status")
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

  await migrateLegacyThreadsForUser(buyerId);

  const conversations = await Conversation.find({
    buyerId,
    status: "Active",
  })
    .populate("buyerId sellerId lastMessageSenderId", "name role profilePicture status")
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
 * Get all buyer/seller conversations for admins
 */
export const getAdminConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    status: { $in: ["Active", "Archived"] },
  })
    .populate("buyerId sellerId lastMessageSenderId", "name role profilePicture status")
    .sort({ lastMessageAt: -1 })
    .lean();

  res.json({
    success: true,
    data: conversations.map((conversation) =>
      formatConversation({
        ...conversation,
        unreadCount: 0,
      }),
    ),
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
    "name role profilePicture status",
  );

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  // Verify user is a participant
  if (req.user.role !== "Admin" && !hasParticipant(conversation, userId)) {
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
  if (!hasParticipant(conversation, senderId)) {
    throw new ApiError(403, "Unauthorized to send message in this conversation");
  }

  // Verify conversation is not blocked
  if (conversation.isBlocked && String(conversation.blockedBy) !== String(senderId)) {
    throw new ApiError(403, "This conversation has been blocked");
  }

  // Determine receiver
  const receiverId = sameId(conversation.buyerId, senderId)
    ? conversation.sellerId
    : conversation.buyerId;

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
      await createNotification({
        userId: receiverId,
        title: `New message from ${senderUser.name}`,
        body: text.trim().substring(0, 100),
        type: "message",
        href: receiverUser.role === "Seller" ? "/seller/messages" : "/bidder/messages",
        metadata: {
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
  await message.populate("senderId receiverId", "name profilePicture role");

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
  if (req.user.role !== "Admin" && !hasParticipant(conversation, userId)) {
    throw new ApiError(403, "Unauthorized access to this conversation");
  }

  // Get messages with pagination (most recent first in reverse order)
  const skip = (page - 1) * limit;
  const messages = await Message.find({
    conversationId,
    isDeleted: false,
  })
    .populate("senderId receiverId", "name profilePicture role")
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

  if (sameId(conversation.buyerId, userId)) {
    conversation.buyerLastReadAt = new Date();
  } else {
    conversation.sellerLastReadAt = new Date();
  }

  await conversation.save();

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
  if (!hasParticipant(conversation, userId)) {
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
  if (!hasParticipant(conversation, userId)) {
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
  const buyer = conversation.buyerId;
  const seller = conversation.sellerId;

  return {
    id: conversation._id,
    buyerId: buyer?._id || buyer,
    buyerName: buyer?.name,
    buyerAvatar: profileImageUrl(buyer),
    sellerId: seller?._id || seller,
    sellerName: seller?.name,
    sellerAvatar: profileImageUrl(seller),
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
    unreadCount: conversation.unreadCount || 0,
  };
}

/**
 * Helper function to format message response
 */
function formatMessage(message) {
  return {
    id: message._id,
    conversationId: message.conversationId,
    senderId: message.senderId?._id || message.senderId,
    senderName: message.senderId?.name,
    senderAvatar: profileImageUrl(message.senderId),
    senderRole: message.senderId?.role,
    receiverId: message.receiverId?._id || message.receiverId,
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
