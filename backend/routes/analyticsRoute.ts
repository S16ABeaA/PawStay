import { Router } from "express";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";
import { analyticsController } from "../controllers/analyticsController";
import { authBrowseHourlyLimiter } from "../middleware/rateLimiters";
import { validateQuery } from "../middleware/inputValidation";

const router = Router();

const analyticsQuerySchema = {
	range: { type: "enum", required: false, enumValues: ["7d", "30d", "3m", "6m", "12m"] },
} as const;

// All analytics routes require a logged-in super_admin
router.use(authMiddleware, requireSuperAdmin);

router.get("/overview", authBrowseHourlyLimiter, validateQuery(analyticsQuerySchema), analyticsController.getOverview);
router.get("/booking-trends", authBrowseHourlyLimiter, validateQuery(analyticsQuerySchema), analyticsController.getBookingTrends);
router.get("/service-breakdown", authBrowseHourlyLimiter, validateQuery(analyticsQuerySchema), analyticsController.getServiceBreakdown);
router.get("/user-growth", authBrowseHourlyLimiter, validateQuery(analyticsQuerySchema), analyticsController.getUserGrowth);
router.get("/top-locations", authBrowseHourlyLimiter, validateQuery(analyticsQuerySchema), analyticsController.getTopLocations);
router.get("/top-properties", authBrowseHourlyLimiter, validateQuery(analyticsQuerySchema), analyticsController.getTopProperties);
router.get("/booking-patterns", authBrowseHourlyLimiter, validateQuery(analyticsQuerySchema), analyticsController.getBookingPatterns);

export default router;
