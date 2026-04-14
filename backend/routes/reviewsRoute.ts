import { Router } from "express";
import { reviewsController } from "../controllers/reviewsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { authGuardLimiter, reviewsHourlyLimiter } from "../middleware/rateLimiters";

const router = Router();

router.get("/mine", authGuardLimiter, authMiddleware, reviewsController.myReviews);
router.post("/:id/reply", authGuardLimiter, authMiddleware, reviewsHourlyLimiter, reviewsController.replyToReview);
router.post("/", authGuardLimiter, authMiddleware, reviewsHourlyLimiter, reviewsController.createReview);
router.get("/property/:propertyId", reviewsController.getPropertyReviews);
router.get("/check/:bookingId", authGuardLimiter, authMiddleware, reviewsController.checkReview);

export default router;
