/**
 * Runs recurring maintenance tasks that keep auctions synchronized and settled.
 */
import cron from "node-cron";
import { Auction } from "../models/Auction.js";
import { env } from "../config/env.js";
import { syncStaleAuctionStates } from "./auctionLifecycleService.js";
import { finalizeExpiredAuctions } from "./auctionSettlementService.js";
import { publishLiveEvent } from "./liveUpdateService.js";
import { suspendOverduePaymentUsers } from "./userSuspensionService.js";

let schedulerTask = null;

async function runAuctionMaintenanceCycle() {
  const beforeSyncIds = await Auction.find({
    status: { $in: ["Scheduled", "Live", "Extended"] },
  }).select("_id status");
  const previousStatusById = new Map(
    beforeSyncIds.map((auction) => [String(auction._id), auction.status]),
  );

  const syncedAuctions = await syncStaleAuctionStates();
  const finalizedAuctions = await finalizeExpiredAuctions();
  const suspendedUsers = await suspendOverduePaymentUsers();

  for (const auction of syncedAuctions) {
    const previousStatus = previousStatusById.get(String(auction._id));

    if (!previousStatus || previousStatus === auction.status) {
      continue;
    }

    publishLiveEvent({
      event: "auction.updated",
      channels: ["market:auctions"],
      userIds: [auction.seller, auction.winner].filter(Boolean),
      roles: ["Admin"],
      payload: {
        auctionId: auction._id,
        status: auction.status,
      },
    });
  }

  return {
    syncedAuctions: syncedAuctions.length,
    finalizedAuctions: finalizedAuctions.filter((result) => result.finalized).length,
    suspendedUsers,
  };
}

export function startAuctionScheduler() {
  if (schedulerTask || env.nodeEnv === "test" || !env.auctionSchedulerEnabled) {
    return schedulerTask;
  }

  schedulerTask = cron.schedule("*/1 * * * *", async () => {
    try {
      await runAuctionMaintenanceCycle();
    } catch (error) {
      console.error("Auction scheduler cycle failed.");
      console.error(error);
    }
  });

  runAuctionMaintenanceCycle().catch((error) => {
    console.error("Auction scheduler bootstrap cycle failed.");
    console.error(error);
  });

  return schedulerTask;
}

export function stopAuctionScheduler() {
  if (!schedulerTask) {
    return;
  }

  schedulerTask.stop();
  schedulerTask = null;
}
