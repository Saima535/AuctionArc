import { connectDatabase } from "../config/db.js";
import { bootstrapDatabase } from "../services/bootstrapService.js";

async function runSeed() {
  await connectDatabase();
  await bootstrapDatabase();
  console.log("Database seed/bootstrap completed successfully.");
  process.exit(0);
}

runSeed().catch((error) => {
  console.error(error);
  process.exit(1);
});
