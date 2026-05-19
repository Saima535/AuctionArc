/**
 * Creates, deduplicates, lists, and updates in-app notifications.
 */
import { Notification } from "../models/Notification.js";
import { publishLiveEvent } from "./liveUpdateService.js";

function normalizeNotification(record) {
  return {
    notificationId: record._id,
    id: String(record._id),
    title: record.title,
    body: record.body,
    type: record.type,
    href: record.href || "",
    isRead: Boolean(record.isRead),
    readAt: record.readAt || null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function notificationPreviewPayload(notification) {
  return {
    notificationId: notification._id,
    title: notification.title,
    type: notification.type,
    href: notification.href || "",
    isRead: Boolean(notification.isRead),
    createdAt: notification.createdAt,
  };
}

function withDedupKey(metadata = {}, dedupKey) {
  if (!dedupKey) {
    return metadata || {};
  }

  return {
    ...(metadata || {}),
    dedupKey,
  };
}

export async function createNotification({
  userId,
  title,
  body,
  type = "general",
  href = "",
  metadata = {},
  createdAt,
}) {
  if (!userId || !title || !body) {
    return null;
  }

  const notification = await Notification.create({
    user: userId,
    title,
    body,
    type,
    href,
    metadata,
    ...(createdAt ? { createdAt, updatedAt: createdAt } : {}),
  });

  publishLiveEvent({
    event: "notification.created",
    channels: [`user:${userId}`, "market:notifications"],
    userIds: [userId],
    payload: notificationPreviewPayload(notification),
  });

  return notification;
}

export async function createNotificationOnce({
  dedupKey,
  metadata = {},
  ...entry
}) {
  if (dedupKey) {
    const existing = await Notification.findOne({
      user: entry.userId,
      "metadata.dedupKey": dedupKey,
    }).select("_id");

    if (existing) {
      return null;
    }
  }

  return createNotification({
    ...entry,
    metadata: withDedupKey(metadata, dedupKey),
  });
}

export async function createNotifications(entries = []) {
  const validEntries = entries.filter(
    (entry) => entry?.userId && entry?.title && entry?.body,
  );

  if (!validEntries.length) {
    return [];
  }

  const notifications = await Notification.insertMany(
    validEntries.map((entry) => ({
      user: entry.userId,
      title: entry.title,
      body: entry.body,
      type: entry.type || "general",
      href: entry.href || "",
      metadata: entry.metadata || {},
      ...(entry.createdAt
        ? { createdAt: entry.createdAt, updatedAt: entry.createdAt }
        : {}),
    })),
  );

  for (const notification of notifications) {
    publishLiveEvent({
      event: "notification.created",
      channels: [`user:${notification.user}`, "market:notifications"],
      userIds: [notification.user],
      payload: notificationPreviewPayload(notification),
    });
  }

  return notifications;
}

export async function createNotificationsOnce(entries = []) {
  const validEntries = entries.filter(
    (entry) => entry?.userId && entry?.title && entry?.body,
  );

  if (!validEntries.length) {
    return [];
  }

  const dedupEntries = validEntries
    .map((entry) => ({
      userId: String(entry.userId),
      dedupKey: entry.dedupKey || entry.metadata?.dedupKey || "",
    }))
    .filter((entry) => entry.dedupKey);

  let existingKeys = new Set();

  if (dedupEntries.length) {
    const existingNotifications = await Notification.find({
      $or: dedupEntries.map((entry) => ({
        user: entry.userId,
        "metadata.dedupKey": entry.dedupKey,
      })),
    }).select("user metadata");

    existingKeys = new Set(
      existingNotifications.map(
        (notification) =>
          `${String(notification.user)}:${notification.metadata?.dedupKey || ""}`,
      ),
    );
  }

  const entriesToCreate = validEntries.filter((entry) => {
    const dedupKey = entry.dedupKey || entry.metadata?.dedupKey || "";

    if (!dedupKey) {
      return true;
    }

    return !existingKeys.has(`${String(entry.userId)}:${dedupKey}`);
  });

  if (!entriesToCreate.length) {
    return [];
  }

  return createNotifications(
    entriesToCreate.map(({ dedupKey, metadata = {}, ...entry }) => ({
      ...entry,
      metadata: withDedupKey(metadata, dedupKey),
    })),
  );
}

export async function listNotificationsForUser(
  userId,
  { limit = 0, unreadFirst = false } = {},
) {
  const query = Notification.find({ user: userId });

  if (unreadFirst) {
    query.sort({ isRead: 1, createdAt: -1 });
  } else {
    query.sort({ createdAt: -1 });
  }

  if (limit > 0) {
    query.limit(limit);
  }

  const [items, unreadCount] = await Promise.all([
    query,
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    items: items.map(normalizeNotification),
    unreadCount,
  };
}

export async function markNotificationRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true },
  );

  if (!notification) {
    return null;
  }

  publishLiveEvent({
    event: "notification.updated",
    channels: [`user:${userId}`, "market:notifications"],
    userIds: [userId],
    payload: notificationPreviewPayload(notification),
  });

  return normalizeNotification(notification);
}

export async function markAllNotificationsRead(userId) {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );

  publishLiveEvent({
    event: "notification.updated",
    channels: [`user:${userId}`, "market:notifications"],
    userIds: [userId],
    payload: {
      userId: String(userId),
      markAll: true,
    },
  });
}
