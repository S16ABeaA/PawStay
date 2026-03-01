import { Router } from "express";
import { reviewsController } from "../controllers/reviewsController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/mine", authMiddleware, reviewsController.myReviews);
router.post("/:id/reply", authMiddleware, reviewsController.replyToReview);

export default router;
