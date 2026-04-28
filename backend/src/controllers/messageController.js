import { User } from "../models/User.js";
import { Thread } from "../models/Thread.js";
import { toThreadRow } from "../services/mapperService.js";
import { generateUniqueCode } from "../utils/codeGenerator.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertRequiredText } from "../utils/validation.js";

export const getThreads = asyncHandler(async (req, res) => {
  const filter = req.user.role === "Admin" ? {} : { "participants.user": req.user._id };
  const threads = await Thread.find(filter).sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: threads.map(toThreadRow),
  });
});

export const createThread = asyncHandler(async (req, res) => {
  const { recipientId, subject, body } = req.body;

  if (!recipientId || !subject || !body) {
    throw new ApiError(400, "Recipient, subject, and message body are required.");
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
    existingThread.messages.push({
      senderName: req.user.name,
      senderRole: req.user.role,
      body: normalizedBody,
    });
    existingThread.updatedAt = new Date();
    await existingThread.save();

    res.status(201).json({
      success: true,
      message: "Conversation updated successfully.",
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

  const filter =
    req.user.role === "Admin"
      ? { _id: req.params.threadId }
      : { _id: req.params.threadId, "participants.user": req.user._id };

  const thread = await Thread.findOne(filter);

  if (!thread) {
    throw new ApiError(404, "Thread not found.");
  }

  thread.messages.push({
    senderName: req.user.role === "Admin" ? "Admin note" : req.user.name,
    senderRole: req.user.role,
    body: normalizedBody,
  });
  thread.updatedAt = new Date();
  await thread.save();

  res.status(201).json({
    success: true,
    message: "Message sent successfully.",
    data: toThreadRow(thread),
  });
});
