import { Router } from "express";
import {
  addToWatchlist,
  createListing,
  placeBid,
  removeFromWatchlist,
} from "../controllers/auctionController.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/listings", requireRole("Seller"), createListing);
router.post("/:auctionId/bids", requireRole("Bidder"), placeBid);
router.post("/:auctionId/watchlist", requireRole("Bidder"), addToWatchlist);
router.delete("/:auctionId/watchlist", requireRole("Bidder"), removeFromWatchlist);

export default router;
