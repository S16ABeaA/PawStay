import { Router } from "express";
import { aiController } from "../controllers/aiController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateBody } from "../middleware/inputValidation";
import { aiOpsPerMinuteLimiter } from "../middleware/rateLimiters";
import multer from "multer";

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
});

const ALLOWED_HEALTHCHECK_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const aiChatSchema = {
	message: { type: "string", required: true, minLength: 1, maxLength: 2000 },
} as const;

const petAnalysisSchema = {
	detectedSpecies: { type: "string", required: false, maxLength: 40 },
	primaryPrediction: { type: "string", required: false, maxLength: 120 },
	primaryConfidence: { type: "number", required: false, min: 0, max: 1 },
	alternatives: { type: "string[]", required: false, maxItems: 10, maxLength: 120 },
	ocrText: { type: "string", required: false, maxLength: 10000 },
	descriptionHint: { type: "string", required: false, maxLength: 2000 },
} as const;

const validateImageMime = (req: any, res: any, next: any) => {
	const file = req.file as Express.Multer.File | undefined;
	if (!file) return next();
	if (!ALLOWED_HEALTHCHECK_MIME_TYPES.includes(file.mimetype)) {
		return res.status(400).json({ error: "Invalid file type" });
	}
	return next();
};

// TODO: replace with explicit Redis-only store before multi-instance deploy if Upstash env is not configured.
router.use(aiOpsPerMinuteLimiter, authMiddleware);

router.post("/chat", validateBody(aiChatSchema, { allowUnknown: true }), aiController.chat);
router.post("/ocr", upload.single("image"), validateImageMime, aiController.ocr);
router.post("/pet-analysis", validateBody(petAnalysisSchema, { allowUnknown: true }), aiController.analyzePet);
router.post(
	"/pet-health-check",
	upload.single("image"),
	validateImageMime,
	aiController.healthCheck
);
export default router;
