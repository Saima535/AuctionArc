import { Router } from "express";
import {
  getCurrentProfile,
  getCurrentSettings,
  updateCurrentProfile,
  updateCurrentSettings,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(requireAuth);
router.get("/me/profile", getCurrentProfile);
router.patch("/me/profile", upload.single("profilePicture"), updateCurrentProfile);
router.get("/me/settings", getCurrentSettings);
router.patch("/me/settings", updateCurrentSettings);

export default router;
