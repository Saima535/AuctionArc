import { Router } from "express";
import {
  forgotPassword,
  getMe,
  login,
  register,
  resetPassword,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post("/register", upload.single("profilePicture"), register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", requireAuth, getMe);

export default router;
