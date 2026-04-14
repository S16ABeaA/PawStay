import { Router } from "express";
import { settingsController } from "../controllers/settingsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { availabilityUpdateLimiter } from "../middleware/rateLimiters";

const router = Router();

// All settings routes require authentication
router.use(authMiddleware);

// GET  /api/settings            — load all settings for the logged-in owner
router.get("/", settingsController.getSettings);

// PUT  /api/settings/business      — update business info
router.put("/business", settingsController.updateBusiness);

// PUT  /api/settings/notifications — update notification prefs
router.put("/notifications", settingsController.updateNotifications);

// PUT  /api/settings/availability  — update availability settings
router.put("/availability", availabilityUpdateLimiter, settingsController.updateAvailability);

// PUT  /api/settings/payment       — update payment settings
router.put("/payment", settingsController.updatePayment);

// PUT  /api/settings/property-setup — update property setup
router.put("/property-setup", settingsController.updatePropertySetup);

export default router;
