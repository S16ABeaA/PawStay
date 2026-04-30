import { Router } from "express";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";
import { getDashboardStats } from "../controllers/dashboardController";
import { authBrowseHourlyLimiter } from "../middleware/rateLimiters";

const router = Router();

// All routes require a logged-in super_admin
router.use(authMiddleware, requireSuperAdmin);

// GET /api/admin/dashboard
router.get("/", authBrowseHourlyLimiter, getDashboardStats);

export default router;
