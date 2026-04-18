import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/error.js";
import adminRoutes from "./routes/adminRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/v1/health", (req, res) => {
    res.json({
      success: true,
      message: "AuctionArc API is running.",
      environment: env.nodeEnv,
    });
  });

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/dashboard", dashboardRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/auctions", auctionRoutes);
  app.use("/api/v1/messages", messageRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/payments", paymentRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
