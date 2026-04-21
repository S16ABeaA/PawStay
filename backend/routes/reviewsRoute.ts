import { Router } from "express";
import { reviewsController } from "../controllers/reviewsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { anonBrowseHourlyLimiter, authBrowseHourlyLimiter, authGuardLimiter, reviewsHourlyLimiter } from "../middleware/rateLimiters";
import { validateBody, validateParams } from "../middleware/inputValidation";

const router = Router();

const idParamSchema = {
	id: { type: "uuid", required: true },
} as const;

const bookingParamSchema = {
	bookingId: { type: "uuid", required: true },
} as const;

const propertyIdParamSchema = {
	propertyId: { type: "uuid", required: true },
} as const;

const createReviewSchema = {
	booking_id: { type: "uuid", required: true },
	rating: { type: "number", required: true, min: 1, max: 5 },
	comment: { type: "string", required: false, maxLength: 2000 },
} as const;

const reviewReplySchema = {
	reply: { type: "string", required: true, minLength: 1, maxLength: 2000 },
} as const;

router.get("/mine", authBrowseHourlyLimiter, authMiddleware, reviewsController.myReviews);
router.post("/:id/reply", authGuardLimiter, authMiddleware, reviewsHourlyLimiter, validateParams(idParamSchema), validateBody(reviewReplySchema), reviewsController.replyToReview);
router.post("/", authGuardLimiter, authMiddleware, reviewsHourlyLimiter, validateBody(createReviewSchema), reviewsController.createReview);
router.get("/property/:propertyId", anonBrowseHourlyLimiter, validateParams(propertyIdParamSchema), reviewsController.getPropertyReviews);
router.get(
	"/check/:bookingId",
	authBrowseHourlyLimiter,
	authMiddleware,
	validateParams({ bookingId: { type: "uuid", required: true } }),
	reviewsController.checkReview
);

export default router;
