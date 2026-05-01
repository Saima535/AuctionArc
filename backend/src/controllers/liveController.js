import crypto from "node:crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  addLiveClient,
  removeLiveClient,
} from "../services/liveUpdateService.js";

function parseChannels(value) {
  return String(value || "")
    .split(",")
    .map((channel) => channel.trim())
    .filter(Boolean);
}

export const streamLiveUpdates = asyncHandler(async (req, res) => {
  const clientId = crypto.randomUUID();
  const requestedChannels = parseChannels(req.query.channels);
  const userScopedChannels = [`user:${req.user._id}`];
  const roleScopedChannels = [`role:${req.user.role}`];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const client = addLiveClient({
    id: clientId,
    userId: req.user._id,
    role: req.user.role,
    channels: [...requestedChannels, ...userScopedChannels, ...roleScopedChannels],
    res,
  });

  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeLiveClient(client.id);
    res.end();
  });
});
