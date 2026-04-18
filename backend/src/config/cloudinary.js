import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

const cloudinaryConfigured = Boolean(
  env.cloudinaryCloudName &&
    env.cloudinaryApiKey &&
    env.cloudinaryApiSecret,
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  });
}

export { cloudinary, cloudinaryConfigured };
