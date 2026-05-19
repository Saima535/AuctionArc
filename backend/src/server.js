/**
 * Bootstraps infrastructure dependencies and starts the HTTP + Socket.io server.
 */
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { startAuctionScheduler } from "./services/auctionScheduler.js";
import { bootstrapDatabase } from "./services/bootstrapService.js";
import { initializeSocket } from "./services/socketService.js";
import http from "http";

async function startServer() {
  await connectDatabase();
  await bootstrapDatabase();
  if (env.auctionSchedulerEnabled) {
    startAuctionScheduler();
  }

  const app = createApp();

  // Create HTTP server for Socket.io
  const httpServer = http.createServer(app);

  // Initialize Socket.io
  const io = initializeSocket(httpServer);

  // Make io accessible to routes if needed
  app.locals.io = io;

  httpServer.listen(env.port, () => {
    console.log(`AuctionArc backend listening on port ${env.port}`);
    console.log(`WebSocket server ready for connections`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start the backend server.");
  console.error(error);
  process.exit(1);
});
