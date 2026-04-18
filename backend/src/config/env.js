import dotenv from "dotenv";

dotenv.config();

function getRequiredValue(key) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  mongoUri: getRequiredValue("MONGO_URI"),
  jwtSecret: getRequiredValue("JWT_SECRET"),
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  adminEmail: getRequiredValue("ADMIN_EMAIL"),
  adminPassword: getRequiredValue("ADMIN_PASS"),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  emailService: process.env.EMAIL_SERVICE || "",
  emailUsername: process.env.EMAIL_USERNAME || "",
  emailPassword: process.env.EMAIL_PASSWORD || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  seedOnBoot: process.env.SEED_ON_BOOT !== "false",
};
