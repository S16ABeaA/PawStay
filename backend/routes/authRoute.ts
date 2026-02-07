import { Router } from "express";
import { authController } from "../controllers/authController";

const router = Router();

router.post("/signUp", authController.signUp);
router.post("/signIn", authController.signIn);
router.post("/signInWithGoogle", authController.signInWithGoogle);
router.post("/signOut", authController.signOut);

export default router;