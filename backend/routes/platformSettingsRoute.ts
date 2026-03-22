import { Router } from "express";
import { platformSettingsController } from "../controllers/platformSettingsController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// public read endpoint
router.get("/", platformSettingsController.getPlatformSettings);

// protected update endpoint
router.put("/", authMiddleware, platformSettingsController.updatePlatformSettings);

export default router;
