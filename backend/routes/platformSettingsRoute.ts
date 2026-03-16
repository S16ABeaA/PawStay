import { Router } from "express";
import { platformSettingsController } from "../controllers/platformSettingsController";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";

const router = Router();

// public read endpoint
router.get("/", platformSettingsController.getPlatformSettings);

// protected update endpoint — super admins only
router.put("/", authMiddleware, requireSuperAdmin, platformSettingsController.updatePlatformSettings);

export default router;
