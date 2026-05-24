/**
 * Declares admin API endpoints and binds them to controller actions.
 */
import { Router } from "express";
import {
  getAdminProfile,
  getAuditQueue,
  getAuctionDrilldown,
  getAuctions,
  getBids,
  getChats,
  getProducts,
  getReportSummary,
  getReports,
  getSettings,
  getTransactions,
  getUsers,
  getWinners,
  exportReport,
  updateAuctionStatus,
  updateBidStatus,
  updateProductStatus,
  updateReportStatus,
  updateSettings,
  updateUserStatus,
} from "../controllers/adminController.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireRole("Admin"));
router.get("/profile", getAdminProfile);
router.get("/users", getUsers);
router.patch("/users/:userId/status", updateUserStatus);
router.get("/products", getProducts);
router.patch("/products/:listingId/status", updateProductStatus);
router.get("/auction-drilldown/:scope", getAuctionDrilldown);
router.get("/auctions", getAuctions);
router.patch("/auctions/:auctionId/status", updateAuctionStatus);
router.get("/bids", getBids);
router.patch("/bids/:bidId/status", updateBidStatus);
router.get("/chats", getChats);
router.get("/audit-queue", getAuditQueue);
router.get("/reports/summary", getReportSummary);
router.get("/reports/export", exportReport);
router.get("/reports", getReports);
router.patch("/reports/:reportId/status", updateReportStatus);
router.get("/transactions", getTransactions);
router.get("/winners", getWinners);
router.get("/settings", getSettings);
router.patch("/settings", updateSettings);

export default router;
