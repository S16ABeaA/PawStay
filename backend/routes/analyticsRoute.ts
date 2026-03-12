import { Router } from "express";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";
import { analyticsController } from "../controllers/analyticsController";

const router = Router();

// All analytics routes require a logged-in super_admin
router.use(authMiddleware, requireSuperAdmin);

router.get("/overview", analyticsController.getOverview);
router.get("/booking-trends", analyticsController.getBookingTrends);
router.get("/service-breakdown", analyticsController.getServiceBreakdown);
router.get("/user-growth", analyticsController.getUserGrowth);
router.get("/top-locations", analyticsController.getTopLocations);
router.get("/top-properties", analyticsController.getTopProperties);
router.get("/booking-patterns", analyticsController.getBookingPatterns);

export default router;
