import { Router } from "express";
import { aiController } from "../controllers/aiController";
import multer from "multer";

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
});

// Initial skeleton route (can be protected with authMiddleware later)
router.post("/chat", aiController.chat);
router.post("/ocr", upload.single("image"), aiController.ocr);
router.post("/pet-analysis", aiController.analyzePet);
router.post("/pet-health-check", upload.single("image"), aiController.healthCheck);

export default router;
