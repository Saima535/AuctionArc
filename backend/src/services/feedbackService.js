/**
 * Encapsulates order-linked feedback validation, persistence, and notifications.
 */
import { Feedback } from "../models/Feedback.js";
import { generateUniqueCode } from "../utils/codeGenerator.js";
import { ApiError } from "../utils/apiError.js";
import { assertNumber, assertOptionalText } from "../utils/validation.js";
import { createNotification } from "./notificationService.js";
import { publishLiveEvent } from "./liveUpdateService.js";

const SELLER_FEEDBACK_ALLOWED_STATUSES = ["Paid", "Awaiting shipment", "Delivered", "Completed"];
const BIDDER_FEEDBACK_ALLOWED_STATUSES = ["Delivered", "Completed"];

function toId(value) {
  return String(value?._id || value || "");
}

export function canSellerLeaveFeedback(order) {
  return SELLER_FEEDBACK_ALLOWED_STATUSES.includes(order?.status);
}

export function canBidderLeaveFeedback(order) {
  return BIDDER_FEEDBACK_ALLOWED_STATUSES.includes(order?.status);
}

export function serializeFeedbackSummary(feedback) {
  if (!feedback) {
    return null;
  }

  return {
    feedbackId: String(feedback._id),
    code: feedback.code,
    rating: feedback.rating,
    comment: feedback.comment || "",
    fromRole: feedback.fromRole,
    toRole: feedback.toRole,
    createdAt: feedback.createdAt || null,
  };
}

export async function getFeedbackMapsForOrders(orderIds = []) {
  if (!orderIds.length) {
    return {
      byOrderAndRole: new Map(),
    };
  }

  const feedbackEntries = await Feedback.find({
    order: { $in: orderIds },
  }).sort({ createdAt: -1 }).lean();

  return {
    byOrderAndRole: new Map(
      feedbackEntries.map((feedback) => [`${String(feedback.order)}:${feedback.fromRole}`, feedback]),
    ),
  };
}

export async function submitOrderFeedback({
  order,
  actorRole,
  actorUserId,
  rating,
  comment,
}) {
  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  const normalizedRating = Math.round(assertNumber(rating, "Rating", { min: 1, max: 5 }));

  if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
    throw new ApiError(400, "Rating must be a whole number between 1 and 5.");
  }

  const normalizedComment = assertOptionalText(comment, "Feedback", { maxLength: 500 });
  const sellerId = toId(order.seller);
  const bidderId = toId(order.bidder);
  const actorId = String(actorUserId || "");

  let fromUserId = "";
  let toUserId = "";
  let fromRole = "";
  let toRole = "";
  let recipientHref = "";

  if (actorRole === "Seller") {
    if (sellerId !== actorId) {
      throw new ApiError(403, "You can only leave feedback for your own orders.");
    }

    if (!canSellerLeaveFeedback(order)) {
      throw new ApiError(400, "Seller feedback becomes available after the buyer has paid.");
    }

    fromUserId = sellerId;
    toUserId = bidderId;
    fromRole = "Seller";
    toRole = "Bidder";
    recipientHref = "/bidder/wins";
  } else if (actorRole === "Bidder") {
    if (bidderId !== actorId) {
      throw new ApiError(403, "You can only leave feedback for your own wins.");
    }

    if (!canBidderLeaveFeedback(order)) {
      throw new ApiError(400, "Buyer feedback becomes available after the order is delivered.");
    }

    fromUserId = bidderId;
    toUserId = sellerId;
    fromRole = "Bidder";
    toRole = "Seller";
    recipientHref = "/seller/orders";
  } else {
    throw new ApiError(400, "Unsupported feedback author role.");
  }

  const existingFeedback = await Feedback.findOne({
    order: order._id,
    fromUser: actorUserId,
  });

  if (existingFeedback) {
    throw new ApiError(400, "Feedback has already been submitted for this order.");
  }

  const code = await generateUniqueCode(Feedback, "FDBK-", { digits: 4, min: 1001 });
  const [feedback] = await Feedback.create([{
    code,
    order: order._id,
    listing: order.listing,
    seller: order.seller,
    bidder: order.bidder,
    fromUser: fromUserId,
    toUser: toUserId,
    fromRole,
    toRole,
    rating: normalizedRating,
    comment: normalizedComment,
  }]);

  await createNotification({
    userId: toUserId,
    title: "New rating received",
    body: normalizedComment
      ? `${fromRole} left a ${normalizedRating}/5 rating and feedback for "${order.item}".`
      : `${fromRole} left a ${normalizedRating}/5 rating for "${order.item}".`,
    type: "feedback",
    href: recipientHref,
    metadata: {
      feedbackId: feedback._id,
      orderId: order._id,
      rating: normalizedRating,
      fromRole,
    },
  });

  publishLiveEvent({
    event: "feedback.created",
    channels: ["market:orders"],
    userIds: [fromUserId, toUserId],
    roles: ["Admin"],
    payload: {
      feedbackId: feedback._id,
      orderId: order._id,
      fromRole,
      toRole,
      rating: normalizedRating,
    },
  });

  return feedback;
}
