/**
 * Declares public auction, listing, bid, and watchlist endpoints.
 */
import { Router } from "express";
import {
  addToWatchlist,
  createListing,
  deleteListing,
  getPublicAuctions,
  placeBid,
  removeFromWatchlist,
  updateListing,
} from "../controllers/auctionController.js";
import { requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/public", getPublicAuctions);
router.post("/listings", requireRole("Seller"), upload.array("images", 3), createListing);
router.patch("/listings/:listingId", requireRole("Seller"), updateListing);
router.delete("/listings/:listingId", requireRole("Seller"), deleteListing);
router.post("/:auctionId/bids", requireRole("Bidder"), placeBid);
router.post("/:auctionId/watchlist", requireRole("Bidder"), addToWatchlist);
router.delete("/:auctionId/watchlist", requireRole("Bidder"), removeFromWatchlist);

export default router;
