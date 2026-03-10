import { Router } from "express";
import { aiController } from "../controllers/aiController";

const router = Router();

// Initial skeleton route (can be protected with authMiddleware later)
router.post("/chat", aiController.chat);

export default router;
