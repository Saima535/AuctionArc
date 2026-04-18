import { Thread } from "../models/Thread.js";
import { toThreadRow } from "../services/mapperService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getThreads = asyncHandler(async (req, res) => {
  const filter = req.user.role === "Admin" ? {} : { "participants.user": req.user._id };
  const threads = await Thread.find(filter).sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: threads.map(toThreadRow),
  });
});

export const postThreadMessage = asyncHandler(async (req, res) => {
  const { body } = req.body;

  if (!body) {
    throw new ApiError(400, "Message body is required.");
  }

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
    body,
  });
  thread.updatedAt = new Date();
  await thread.save();

  res.status(201).json({
    success: true,
    message: "Message sent successfully.",
    data: toThreadRow(thread),
  });
});
