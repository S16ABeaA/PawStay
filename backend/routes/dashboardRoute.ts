import { Router } from "express";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";
import { getDashboardStats } from "../controllers/dashboardController";

const router = Router();

// All routes require a logged-in super_admin
router.use(authMiddleware, requireSuperAdmin);

// GET /api/admin/dashboard
router.get("/", getDashboardStats);

export default router;
