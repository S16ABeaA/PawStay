import { Router } from "express";
import { authController } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";  

const router = Router();
// console.log("router loaded"); // Debug log to confirm router is loaded

router.post("/signUp", authController.signUp);
router.post("/signIn", authController.signIn);
// router.post("/signInWithGoogle", authController.signInWithGoogle);
// router.post("/refresh", authController.refreshToken);

router.get("/profile", authMiddleware, authController.getProfile);
// Get current user
// router.get("/profile", authMiddleware, (req, res) => {
//   res.json({ user: (req as any).user });
// });
router.post("/signOut", authMiddleware, authController.signOut);

export default router;