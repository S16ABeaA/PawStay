import { Router } from "express";
import { propertyController } from "../controllers/propertyController";

const router = Router();

router.get("/search", propertyController.searchProperties);
router.post("/search", propertyController.searchProperties);
router.post("/randomproperty", propertyController.randomProperties);
router.get("/:id", propertyController.getById);
router.get("/:id/reviews", propertyController.getReviews);

export default router;