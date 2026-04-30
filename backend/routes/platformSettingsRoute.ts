import { Router } from "express";
import { platformSettingsController } from "../controllers/platformSettingsController";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";
import { bulkOpsLimiter } from "../middleware/rateLimiters";
import { validateBody } from "../middleware/inputValidation";

const router = Router();

const platformSettingsSchema = {
	name: { type: "string", required: false, minLength: 1, maxLength: 120 },
	commission_percent: { type: "number", required: false, min: 0, max: 100 },
} as const;

// public read endpoint
router.get("/", platformSettingsController.getPlatformSettings);

// protected update endpoint
router.put(
	"/",
	authMiddleware,
	requireSuperAdmin,
	bulkOpsLimiter,
	validateBody(platformSettingsSchema),
	platformSettingsController.updatePlatformSettings
);

export default router;
