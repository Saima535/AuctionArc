import nodemailer from "nodemailer";
import { env } from "./env.js";

const mailConfigured = Boolean(
  env.emailService &&
    env.emailUsername &&
    env.emailPassword,
);

export const mailer = mailConfigured
  ? nodemailer.createTransport({
      service: env.emailService,
      auth: {
        user: env.emailUsername,
        pass: env.emailPassword,
      },
    })
  : null;

export async function sendMail(options) {
  if (!mailer) {
    return {
      delivered: false,
      reason: "Mail transporter is not configured.",
    };
  }

  await mailer.sendMail({
    from: env.emailUsername,
    ...options,
  });

  return {
    delivered: true,
  };
}
