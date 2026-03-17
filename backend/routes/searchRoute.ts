import { Router } from "express";
import { propertyController } from "../controllers/propertyController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/search", propertyController.searchProperties);
router.post("/search", propertyController.searchProperties);
router.post("/randomproperty", propertyController.randomProperties);
router.get("/recommended", authMiddleware, propertyController.recommendedProperties);
router.post("/recommended", authMiddleware, propertyController.recommendedProperties);
// Protected routes for proprietor — place before param routes to avoid "mine" being treated as an :id
router.get('/mine', authMiddleware, propertyController.myProperties);
router.post('/mine/seed', authMiddleware, propertyController.seedMyProperty);
router.get('/mine/stats', authMiddleware, propertyController.dashboardStats);

router.get("/:id", propertyController.getById);
router.get("/:id/payment", propertyController.getPaymentOptions);
router.get("/:id/reviews", propertyController.getReviews);

// Service management routes
router.get('/:id/services', propertyController.getServices);
router.post('/:id/services', authMiddleware, propertyController.createService);
router.patch('/:id/services/:serviceId', authMiddleware, propertyController.updateService);
router.delete('/:id/services/:serviceId', authMiddleware, propertyController.deleteService);

// Service management routes
router.get('/:id/services', propertyController.getServices);
router.post('/:id/services', authMiddleware, propertyController.createService);
router.patch('/:id/services/:serviceId', authMiddleware, propertyController.updateService);
router.delete('/:id/services/:serviceId', authMiddleware, propertyController.deleteService);

export default router;