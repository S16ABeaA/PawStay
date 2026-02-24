import { Router } from "express";
import { authController } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";  

const router = Router();
// console.log("router loaded"); // Debug log to confirm router is loaded

router.post("/signUp", authController.signUp);
router.post("/resendConfirmation", authController.resendConfirmation);
router.post("/signIn", authController.signIn);
router.post("/signInWithGoogle", authController.signInWithGoogle);

router.get("/profile", authMiddleware, authController.getProfile); // Get current user
router.put("/profile", authMiddleware, authController.updateProfile); // Update current user profile
router.post("/signOut", authMiddleware, authController.signOut);

export default router;