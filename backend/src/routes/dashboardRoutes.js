/**
 * Declares dashboard and seller-order endpoints.
 */
import { Router } from "express";
import {
  getAdminInsights,
  getAdminOverview,
  getBidderBids,
  getBidderDiscover,
  createBidderOrderFeedback,
  getBidderOverview,
  getBidderWins,
  createSellerOrderFeedback,
  getSellerAnalytics,
  getSellerAuctions,
  getSellerListings,
  getSellerOrders,
  getSellerOverview,
  getSellerReport,
  exportSellerReport,
  updateSellerOrderStatus,
  getWatchlist,
} from "../controllers/dashboardController.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/seller", requireRole("Seller"), getSellerOverview);
router.get("/seller/listings", requireRole("Seller"), getSellerListings);
router.get("/seller/auctions", requireRole("Seller"), getSellerAuctions);
router.get("/seller/orders", requireRole("Seller"), getSellerOrders);
router.patch("/seller/orders/:orderId", requireRole("Seller"), updateSellerOrderStatus);
router.post("/seller/orders/:orderId/feedback", requireRole("Seller"), createSellerOrderFeedback);
router.get("/seller/analytics", requireRole("Seller"), getSellerAnalytics);
router.get("/seller/report", requireRole("Seller"), getSellerReport);
router.get("/seller/report/export", requireRole("Seller"), exportSellerReport);

router.get("/bidder", requireRole("Bidder"), getBidderOverview);
router.get("/bidder/discover", requireRole("Bidder"), getBidderDiscover);
router.get("/bidder/bids", requireRole("Bidder"), getBidderBids);
router.get("/bidder/wins", requireRole("Bidder"), getBidderWins);
router.post("/bidder/wins/:orderId/feedback", requireRole("Bidder"), createBidderOrderFeedback);
router.get("/bidder/watchlist", requireRole("Bidder"), getWatchlist);

router.get("/admin", requireRole("Admin"), getAdminOverview);
router.get("/admin/insights", requireRole("Admin"), getAdminInsights);

export default router;
