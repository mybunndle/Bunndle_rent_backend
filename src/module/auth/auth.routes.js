import { Router } from "express";
import { uploadUserProfile } from "../../middleware/upload.js";
import {
  register,
  login,
  getCurrentUser,
  changePassword,
  updateProfile,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  googleAuthController,
  appleLogin,
  logoutController,
  deleteAccountController,
  quickConnect,
  createCorporateRequest,
} from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/get_me", authenticate, getCurrentUser);
router.put("/password_change", authenticate, changePassword);
router.put(
  "/update_profile",
  authenticate,
  uploadUserProfile.single("profilePicture"),
  updateProfile,
);
router.post("/forgot_password", forgotPassword);
router.post("/verify_reset_otp", verifyResetOtp);
router.post("/reset_password", resetPassword);

router.post("/google/android", googleAuthController);
router.post("/apple_login", appleLogin);

router.post("/logout", authenticate, logoutController);

router.delete("/delete_account", authenticate, deleteAccountController);

router.post("/quick_connect", authenticate, quickConnect);

router.post("/corporate_request", authenticate, createCorporateRequest);

export default router;
