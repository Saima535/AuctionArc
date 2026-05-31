/**
 * Centralizes manual and automated user suspension flows.
 */
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { createNotificationOnce } from "./notificationService.js";
import { deleteUserAccountCompletely } from "./userDeletionService.js";

const PAYMENT_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
const SUSPENSION_DELETION_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

function buildSuspensionPayload({
  reason,
  source,
  suspendedBy = null,
  relatedOrder = null,
}) {
  return {
    reason,
    source,
    suspendedAt: new Date(),
    suspendedBy,
    relatedOrder,
  };
}

export async function suspendUserAccount({
  user,
  reason,
  source = "Admin",
  suspendedBy = null,
  relatedOrder = null,
  notificationTitle = "Account suspended",
  notificationBody = "",
  notificationHref = "",
  dedupKey = "",
}) {
  if (!user || !reason?.trim()) {
    return user || null;
  }

  user.status = "Suspended";
  user.suspension = buildSuspensionPayload({
    reason: reason.trim(),
    source,
    suspendedBy,
    relatedOrder,
  });
  await user.save();

  if (notificationBody) {
    await createNotificationOnce({
      dedupKey,
      userId: user._id,
      title: notificationTitle,
      body: notificationBody,
      type: "account",
      href: notificationHref,
      metadata: {
        reason: reason.trim(),
        source,
        relatedOrder: relatedOrder || null,
      },
    });
  }

  return user;
}

export async function activateUserAccount(user) {
  if (!user) {
    return null;
  }

  user.status = "Active";
  user.suspension = {
    reason: "",
    source: "",
    suspendedAt: null,
    suspendedBy: null,
    relatedOrder: null,
  };
  await user.save();
  return user;
}

export async function suspendOverduePaymentUsers() {
  const threshold = new Date(Date.now() - PAYMENT_GRACE_PERIOD_MS);
  const overdueOrders = await Order.find({
    status: "Payment pending",
    createdAt: { $lte: threshold },
  })
    .populate("bidder")
    .populate("listing");

  let suspendedUsers = 0;

  for (const order of overdueOrders) {
    const user = order.bidder;

    if (!user || user.role !== "Bidder" || user.status === "Suspended") {
      continue;
    }

    const productTitle = order.item || order.listing?.title || "Unknown product";
    const reason = `Failure to complete the payment for the product "${productTitle}" within 7 days.`;

    await suspendUserAccount({
      user,
      reason,
      source: "System",
      relatedOrder: order._id,
      notificationTitle: "Account suspended for overdue payment",
      notificationBody: `Your account has been suspended because payment for "${productTitle}" was not completed within 7 days.`,
      notificationHref: "/bidder/wins",
      dedupKey: `overdue-payment-suspension:${order._id}`,
    });
    suspendedUsers += 1;
  }

  return suspendedUsers;
}

export async function deleteExpiredSuspendedUsers() {
  const threshold = new Date(Date.now() - SUSPENSION_DELETION_GRACE_PERIOD_MS);
  const suspendedUsers = await User.find({
    status: "Suspended",
    "suspension.suspendedAt": { $lte: threshold },
    role: { $in: ["Seller", "Bidder"] },
  });

  let deletedUsers = 0;

  for (const user of suspendedUsers) {
    await deleteUserAccountCompletely(user._id, { deletedByAdmin: false });
    deletedUsers += 1;
  }

  return deletedUsers;
}
