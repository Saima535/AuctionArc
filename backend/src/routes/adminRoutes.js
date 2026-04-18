import { Router } from "express";
import {
  getAdminProfile,
  getAuctions,
  getBids,
  getChats,
  getProducts,
  getReports,
  getSettings,
  getTransactions,
  getUsers,
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
router.get("/auctions", getAuctions);
router.patch("/auctions/:auctionId/status", updateAuctionStatus);
router.get("/bids", getBids);
router.patch("/bids/:bidId/status", updateBidStatus);
router.get("/chats", getChats);
router.get("/reports", getReports);
router.patch("/reports/:reportId/status", updateReportStatus);
router.get("/transactions", getTransactions);
router.get("/settings", getSettings);
router.patch("/settings", updateSettings);

export default router;
