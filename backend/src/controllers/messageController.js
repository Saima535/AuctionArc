/**
 * Maintains the legacy thread-based messaging workflow still used by parts of the UI.
 */
import { User } from "../models/User.js";
import { Thread } from "../models/Thread.js";
import mongoose from "mongoose";
import { toThreadRow } from "../services/mapperService.js";
import { publishLiveEvent } from "../services/liveUpdateService.js";
import { createNotifications } from "../services/notificationService.js";
import { generateUniqueCode } from "../utils/codeGenerator.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertRequiredText } from "../utils/validation.js";

function notificationsHrefForParticipant(roleLabel) {
  if (roleLabel === "Admin") {
    return "/admin/chats";
  }

  if (roleLabel === "Buyer") {
    return "/bidder/messages";
  }

  return "/seller/messages";
}

function isDuplicateRecentMessage(thread, senderName, senderRole, body) {
  const lastMessage = thread.messages.at(-1);

  if (!lastMessage) {
    return false;
  }

  if (
    lastMessage.senderName !== senderName ||
    lastMessage.senderRole !== senderRole ||
    lastMessage.body !== body
  ) {
    return false;
  }

  const lastSentAt = lastMessage.sentAt ? new Date(lastMessage.sentAt).getTime() : 0;

  return Boolean(lastSentAt) && Date.now() - lastSentAt < 2 * 60 * 1000;
}

export const getThreads = asyncHandler(async (req, res) => {
  const filter = req.user.role === "Admin" ? {} : { "participants.user": req.user._id };
  const threads = await Thread.find(filter).sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: threads.map(toThreadRow),
  });
});

export const createThread = asyncHandler(async (req, res) => {
  let { recipientId, subject, body, listingId, auctionId } = req.body;

  if (!recipientId && listingId) {
    // resolve seller from listing
    const { Listing } = await import("../models/Listing.js");
    const listing = await Listing.findById(listingId).select("seller");
    if (listing && listing.seller) {
      recipientId = listing.seller;
    }
  }

  if (!recipientId && auctionId) {
    // resolve seller from auction
    const { Auction } = await import("../models/Auction.js");
    const auction = await Auction.findById(auctionId).select("seller");
    if (auction && auction.seller) {
      recipientId = auction.seller;
    }
  }

  if (!recipientId || !subject || !body) {
    throw new ApiError(400, "Recipient (or listing/auction), subject, and message body are required.");
  }

  const normalizedSubject = assertRequiredText(subject, "Subject", { maxLength: 160 });
  const normalizedBody = assertRequiredText(body, "Message body", { maxLength: 4000 });

  const recipient = await User.findById(recipientId);

  if (!recipient) {
    throw new ApiError(404, "The selected recipient could not be found.");
  }

  if (String(recipient._id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot start a conversation with yourself.");
  }

  const existingThread = await Thread.findOne({
    subject: normalizedSubject,
    "participants.user": { $all: [req.user._id, recipient._id] },
  });

  if (existingThread) {
    if (!isDuplicateRecentMessage(existingThread, req.user.name, req.user.role, normalizedBody)) {
      existingThread.messages.push({
        senderName: req.user.name,
        senderRole: req.user.role,
        body: normalizedBody,
      });
      existingThread.updatedAt = new Date();
      await existingThread.save();

      publishLiveEvent({
        event: "thread.updated",
        channels: ["market:messages"],
        userIds: existingThread.participants.map((participant) => participant.user),
        roles: ["Admin"],
        payload: {
          threadId: existingThread._id,
          subject: existingThread.subject,
        },
      });

      await createNotifications(
        existingThread.participants
          .filter((participant) => String(participant.user) !== String(req.user._id))
          .map((participant) => ({
            userId: participant.user,
            title: "New message received",
            body: `${req.user.name} added a new message to "${existingThread.subject}".`,
            type: "message",
            href: notificationsHrefForParticipant(participant.roleLabel),
            metadata: {
              threadId: existingThread._id,
              senderId: req.user._id,
            },
          })),
      );
    }

    res.status(201).json({
      success: true,
      message: "Conversation opened successfully.",
      data: toThreadRow(existingThread),
    });
    return;
  }

  const code = await generateUniqueCode(Thread, "MSG-", { digits: 3, min: 101 });
  const thread = await Thread.create({
    code,
    subject: normalizedSubject,
    priority: "Normal",
    status: "Open",
    participants: [
      {
        user: req.user._id,
        roleLabel: req.user.role === "Bidder" ? "Buyer" : req.user.role,
        name: req.user.name,
      },
      {
        user: recipient._id,
        roleLabel: recipient.role === "Bidder" ? "Buyer" : recipient.role,
        name: recipient.name,
      },
    ],
    messages: [
      {
        senderName: req.user.name,
        senderRole: req.user.role,
        body: normalizedBody,
      },
    ],
  });

  publishLiveEvent({
    event: "thread.created",
    channels: ["market:messages"],
    userIds: thread.participants.map((participant) => participant.user),
    roles: ["Admin"],
    payload: {
      threadId: thread._id,
      subject: thread.subject,
    },
  });

  await createNotifications(
    thread.participants
      .filter((participant) => String(participant.user) !== String(req.user._id))
      .map((participant) => ({
        userId: participant.user,
        title: "New conversation started",
        body: `${req.user.name} started "${thread.subject}".`,
        type: "message",
        href: notificationsHrefForParticipant(participant.roleLabel),
        metadata: {
          threadId: thread._id,
          senderId: req.user._id,
        },
      })),
  );

  res.status(201).json({
    success: true,
    message: "Conversation started successfully.",
    data: toThreadRow(thread),
  });
});

export const postThreadMessage = asyncHandler(async (req, res) => {
  const { body } = req.body;

  if (!body) {
    throw new ApiError(400, "Message body is required.");
  }

  const normalizedBody = assertRequiredText(body, "Message body", { maxLength: 4000 });

  const threadSelector = mongoose.Types.ObjectId.isValid(req.params.threadId)
    ? { _id: req.params.threadId }
    : { code: req.params.threadId };
  const filter =
    req.user.role === "Admin"
      ? threadSelector
      : { ...threadSelector, "participants.user": req.user._id };

  const thread = await Thread.findOne(filter);

  if (!thread) {
    throw new ApiError(404, "Thread not found.");
  }

  const senderName = req.user.role === "Admin" ? "Admin note" : req.user.name;

  if (!isDuplicateRecentMessage(thread, senderName, req.user.role, normalizedBody)) {
    thread.messages.push({
      senderName,
      senderRole: req.user.role,
      body: normalizedBody,
    });
    thread.updatedAt = new Date();
    await thread.save();

    publishLiveEvent({
      event: "thread.updated",
      channels: ["market:messages"],
      userIds: thread.participants.map((participant) => participant.user),
      roles: ["Admin"],
      payload: {
        threadId: thread._id,
        subject: thread.subject,
      },
    });

    await createNotifications(
      thread.participants
        .filter((participant) => String(participant.user) !== String(req.user._id))
        .map((participant) => ({
          userId: participant.user,
          title: req.user.role === "Admin" ? "Admin replied to a conversation" : "New message received",
          body:
            req.user.role === "Admin"
              ? `An admin replied in "${thread.subject}".`
              : `${req.user.name} replied in "${thread.subject}".`,
          type: "message",
          href: notificationsHrefForParticipant(participant.roleLabel),
          metadata: {
            threadId: thread._id,
            senderId: req.user._id,
          },
        })),
    );
  }

  res.status(201).json({
    success: true,
    message: "Message sent successfully.",
    data: toThreadRow(thread),
  });
});
