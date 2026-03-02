import { Router } from "express";
import multer from "multer";
import { authController } from "../controllers/authController";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";
import rateLimit from "express-rate-limit";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Strict limiter for signup — prevents brute-forcing the invite code
const signUpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                  // max 10 signup attempts per IP per hour
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many signup attempts. Please try again later." },
});

router.post("/signUp", signUpLimiter, authController.signUp);
router.post("/resendConfirmation", authController.resendConfirmation);
router.post("/signIn", authController.signIn);
router.get("/signInWithGoogle", authController.signInWithGoogle);
router.get("/oauth/callback", authController.oauthCallback); // Google OAuth callback
router.post("/forgotPassword", authController.forgotPassword);
router.get("/profile", authMiddleware, authController.getProfile); // Get current user
router.put("/updateProfile", authMiddleware, authController.updateProfile);
router.post("/uploadAvatar", authMiddleware, upload.single("avatar"), authController.uploadAvatar);
router.post("/signOut", authMiddleware, authController.signOut);
router.post("/promote", authMiddleware, requireSuperAdmin, authController.promoteUser);
router.get("/users", authMiddleware, requireSuperAdmin, authController.listUsers);
router.patch("/users/:id/ban", authMiddleware, requireSuperAdmin, authController.banUser);
router.delete("/users/:id", authMiddleware, requireSuperAdmin, authController.deleteUser);

export default router;