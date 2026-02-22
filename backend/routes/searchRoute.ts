import { Router } from "express";
import { propertyController } from "../controllers/propertyController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/search", propertyController.searchProperties);
router.post("/search", propertyController.searchProperties);
router.post("/randomproperty", propertyController.randomProperties);

// Protected routes for proprietor
router.get('/mine', authMiddleware, propertyController.myProperties);
router.post('/mine/seed', authMiddleware, propertyController.seedMyProperty);
router.get('/mine/stats', authMiddleware, propertyController.dashboardStats);

export default router;