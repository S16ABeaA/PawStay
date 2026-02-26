import { Router } from "express";
import multer from "multer";
import { authController } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";  

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/signUp", authController.signUp);
router.post("/resendConfirmation", authController.resendConfirmation);
router.post("/signIn", authController.signIn);
router.get("/signInWithGoogle", authController.signInWithGoogle);
router.get("/oauth/callback", authController.oauthCallback); // Google OAuth callback
router.post("/forgotPassword", authController.forgotPassword);
router.get("/profile", authMiddleware, authController.getProfile); // Get current user
router.put("/updateProfile", authMiddleware, authController.updateProfile);
router.post("/uploadAvatar", authMiddleware, upload.single("avatar"), authController.uploadAvatar);
router.post("/signOut", authMiddleware, authController.signOut);

export default router;