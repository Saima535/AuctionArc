import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { bootstrapDatabase } from "./services/bootstrapService.js";

async function startServer() {
  await connectDatabase();
  await bootstrapDatabase();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`AuctionArc backend listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start the backend server.");
  console.error(error);
  process.exit(1);
});
