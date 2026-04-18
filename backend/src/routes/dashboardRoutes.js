import { Router } from "express";
import {
  getAdminInsights,
  getAdminOverview,
  getBidderBids,
  getBidderDiscover,
  getBidderOverview,
  getBidderWins,
  getSellerAnalytics,
  getSellerAuctions,
  getSellerListings,
  getSellerOrders,
  getSellerOverview,
  getWalletOverview,
  getWatchlist,
} from "../controllers/dashboardController.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/seller", requireRole("Seller"), getSellerOverview);
router.get("/seller/listings", requireRole("Seller"), getSellerListings);
router.get("/seller/auctions", requireRole("Seller"), getSellerAuctions);
router.get("/seller/orders", requireRole("Seller"), getSellerOrders);
router.get("/seller/analytics", requireRole("Seller"), getSellerAnalytics);

router.get("/bidder", requireRole("Bidder"), getBidderOverview);
router.get("/bidder/discover", requireRole("Bidder"), getBidderDiscover);
router.get("/bidder/bids", requireRole("Bidder"), getBidderBids);
router.get("/bidder/wins", requireRole("Bidder"), getBidderWins);
router.get("/bidder/watchlist", requireRole("Bidder"), getWatchlist);

router.get("/wallet", requireRole("Seller", "Bidder"), getWalletOverview);

router.get("/admin", requireRole("Admin"), getAdminOverview);
router.get("/admin/insights", requireRole("Admin"), getAdminInsights);

export default router;
