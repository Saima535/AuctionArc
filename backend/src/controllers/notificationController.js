/**
 * Lists and marks user notifications as read.
 */
import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const limit = Math.max(Number(req.query.limit) || 0, 0);
  const unreadFirst = String(req.query.unreadFirst || "false") === "true";

  const data = await listNotificationsForUser(req.user._id, {
    limit,
    unreadFirst,
  });

  res.json({
    success: true,
    data,
  });
});

export const readNotification = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead(
    req.user._id,
    req.params.notificationId,
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found.");
  }

  res.json({
    success: true,
    message: "Notification marked as read.",
    data: notification,
  });
});

export const readAllNotifications = asyncHandler(async (req, res) => {
  await markAllNotificationsRead(req.user._id);

  res.json({
    success: true,
    message: "All notifications marked as read.",
  });
});
