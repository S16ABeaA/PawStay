import { Router } from "express";
import { authController } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";  

const router = Router();

router.post("/signUp", authController.signUp);
router.post("/resendConfirmation", authController.resendConfirmation);
router.post("/signIn", authController.signIn);
router.get("/signInWithGoogle", authController.signInWithGoogle);
router.get("/oauth/callback", authController.oauthCallback); // Google OAuth callback
router.get("/profile", authMiddleware, authController.getProfile); // Get current user
router.post("/signOut", authMiddleware, authController.signOut);

export default router;