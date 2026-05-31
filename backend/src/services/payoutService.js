/**
 * Releases seller payouts automatically when fulfilment reaches delivery/completion.
 */
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import { createNotificationOnce } from "./notificationService.js";
import { publishLiveEvent } from "./liveUpdateService.js";
import { generateUniqueCode } from "../utils/codeGenerator.js";
import { formatCurrency } from "../utils/formatters.js";
import { getOrderFinancials } from "./commissionService.js";

const ELIGIBLE_PAYOUT_ORDER_STATUSES = new Set(["Delivered", "Completed"]);
const PAYOUT_TRANSACTION_TYPES = ["Auction sale", "Buy now sale", "Seller payout"];

function isPayoutCompleted(status = "") {
  return /complete|paid/i.test(String(status)) && !/pending/i.test(String(status));
}

function getExpectedPayoutTransactionType(order) {
  return order?.purchaseType === "Buy now" ? "Buy now sale" : "Auction sale";
}

export async function releaseSellerPayoutForOrder(orderInput) {
  const order =
    orderInput?.populate && typeof orderInput.populate === "function"
      ? orderInput
      : await Order.findById(orderInput?._id || orderInput)
        .populate("seller bidder listing");

  if (!order || !ELIGIBLE_PAYOUT_ORDER_STATUSES.has(order.status)) {
    return { released: false, order: null, payoutTransaction: null };
  }

  const payoutTransaction = await Transaction.findOne({
    order: order._id,
    type: { $in: PAYOUT_TRANSACTION_TYPES },
  }).sort({ createdAt: -1 });

  if (payoutTransaction && isPayoutCompleted(payoutTransaction.status)) {
    if (!order.payoutReleasedAt) {
      order.payoutReleasedAt = order.payoutReleasedAt || payoutTransaction.updatedAt || new Date();
      await order.save();
    }

    return { released: false, order, payoutTransaction };
  }

  const { grossAmount, commissionAmount, sellerPayoutAmount } = getOrderFinancials(order);
  const releasedAt = new Date();
  let releasedTransaction = payoutTransaction;

  if (!releasedTransaction) {
    const code = await generateUniqueCode(Transaction, "TXN-PAYOUT-", { digits: 4, min: 1001 });
    const createdTransactions = await Transaction.create([{
      code,
      user: order.seller?._id || order.seller,
      order: order._id,
      type: getExpectedPayoutTransactionType(order),
      status: "Completed payout",
      amount: sellerPayoutAmount,
      channel: "Auto release",
      metadata: {
        orderId: String(order._id),
        listingId: String(order.listing?._id || order.listing),
        grossAmount,
        commissionAmount,
        sellerPayoutAmount,
        payoutReleasedAt: releasedAt.toISOString(),
        autoReleased: true,
      },
    }]);

    [releasedTransaction] = createdTransactions;
  } else {
    releasedTransaction.status = "Completed payout";
    releasedTransaction.channel = releasedTransaction.channel || "Auto release";
    releasedTransaction.metadata = {
      ...(releasedTransaction.metadata || {}),
      grossAmount,
      commissionAmount,
      sellerPayoutAmount,
      payoutReleasedAt: releasedAt.toISOString(),
      autoReleased: true,
    };
    await releasedTransaction.save();
  }

  order.payoutReleasedAt = releasedAt;
  await order.save();

  await createNotificationOnce({
    userId: order.seller?._id || order.seller,
    title: "Seller payout released",
    body: `Your payout of ${formatCurrency(sellerPayoutAmount)} for "${order.item}" has been released automatically.`,
    type: "payment",
    href: "/seller/orders",
    dedupKey: `payout-release:${String(order._id)}`,
    metadata: {
      orderId: order._id,
      payoutTransactionId: releasedTransaction._id,
      payoutReleasedAt: releasedAt.toISOString(),
      autoReleased: true,
    },
  });

  publishLiveEvent({
    event: "order.updated",
    channels: ["market:orders"],
    userIds: [order.seller?._id || order.seller, order.bidder?._id || order.bidder].filter(Boolean),
    roles: ["Admin"],
    payload: {
      orderId: order._id,
      orderCode: order.code,
      status: order.status,
      payoutStatus: releasedTransaction.status,
      payoutReleasedAt: releasedAt,
    },
  });

  return {
    released: true,
    order,
    payoutTransaction: releasedTransaction,
  };
}

export async function releaseEligibleSellerPayouts(filters = {}) {
  const orders = await Order.find({
    ...filters,
    status: { $in: [...ELIGIBLE_PAYOUT_ORDER_STATUSES] },
  }).populate("seller bidder listing");

  const results = [];

  for (const order of orders) {
    results.push(await releaseSellerPayoutForOrder(order));
  }

  return results;
}

export async function getPayoutTransactionsByOrderIds(orderIds = []) {
  const validOrderIds = orderIds.filter(Boolean);

  if (!validOrderIds.length) {
    return new Map();
  }

  const transactions = await Transaction.find({
    order: { $in: validOrderIds },
    type: { $in: PAYOUT_TRANSACTION_TYPES },
  }).sort({ createdAt: -1 });

  const transactionsByOrderId = new Map();

  for (const transaction of transactions) {
    const orderId = String(transaction.order);

    if (!transactionsByOrderId.has(orderId)) {
      transactionsByOrderId.set(orderId, transaction);
    }
  }

  return transactionsByOrderId;
}
