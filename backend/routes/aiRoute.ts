import { Router } from "express";
import { aiController } from "../controllers/aiController";
import { authMiddleware } from "../middleware/authMiddleware";
import multer from "multer";
import rateLimit from "express-rate-limit";

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
});

const aiLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 30,                  // max 30 AI requests per IP per hour
	standardHeaders: "draft-7",
	legacyHeaders: false,
	message: { error: "Too many AI requests. Please try again later." },
});

router.post("/chat", aiLimiter, authMiddleware, aiController.chat);
router.post("/ocr", aiLimiter, authMiddleware, upload.single("image"), aiController.ocr);
router.post("/pet-analysis", aiLimiter, authMiddleware, aiController.analyzePet);
router.post("/pet-health-check", aiLimiter, authMiddleware, upload.single("image"), aiController.healthCheck);

export default router;
