/**
 * Declares dashboard, wallet, and seller-order endpoints.
 */
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
  updateSellerOrderStatus,
  getWalletOverview,
  getWatchlist,
} from "../controllers/dashboardController.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/seller", requireRole("Seller"), getSellerOverview);
router.get("/seller/listings", requireRole("Seller"), getSellerListings);
router.get("/seller/auctions", requireRole("Seller"), getSellerAuctions);
router.get("/seller/orders", requireRole("Seller"), getSellerOrders);
router.patch("/seller/orders/:orderId", requireRole("Seller"), updateSellerOrderStatus);
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
