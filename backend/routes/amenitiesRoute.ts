import { Router } from "express";
import { amenitiesController } from "../controllers/amenitiesController";
import { authMiddleware, requireSuperAdmin } from "../middleware/authMiddleware";

const router = Router();

router.post("/servicetype", amenitiesController.getamenitiesByServiceType);

// Admin CRUD
router.get("/", authMiddleware, requireSuperAdmin, amenitiesController.listAmenities);
router.post("/", authMiddleware, requireSuperAdmin, amenitiesController.createAmenity);
router.put("/:id", authMiddleware, requireSuperAdmin, amenitiesController.updateAmenity);
router.delete("/:id", authMiddleware, requireSuperAdmin, amenitiesController.deleteAmenity);

export default router;