import { Router } from "express";
import { reviewsController } from "../controllers/reviewsController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/mine", authMiddleware, reviewsController.myReviews);
router.post("/:id/reply", authMiddleware, reviewsController.replyToReview);
router.post("/", authMiddleware, reviewsController.createReview);
router.get("/property/:propertyId", reviewsController.getPropertyReviews);
router.get("/check/:bookingId", authMiddleware, reviewsController.checkReview);

export default router;
