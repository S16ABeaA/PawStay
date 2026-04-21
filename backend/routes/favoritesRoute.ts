import { Router } from "express";
import { favoritesController } from "../controllers/favoritesController";
import { authMiddleware } from "../middleware/authMiddleware";
import { authBrowseHourlyLimiter, bookingOpsHourlyLimiter } from "../middleware/rateLimiters";
import { validateBody, validateParams } from "../middleware/inputValidation";

const router = Router();
// console.log("router loaded"); // Debug log to confirm router is loaded

const favoriteSchema = {
	property_id: { type: "uuid", required: true },
} as const;

const favoriteParamSchema = {
	property_id: { type: "uuid", required: true },
} as const;

router.use(authMiddleware);
router.get("/", authBrowseHourlyLimiter, authMiddleware, favoritesController.getUserFavorites);
router.post("/", bookingOpsHourlyLimiter, validateBody(favoriteSchema), favoritesController.addFavorite);
router.delete("/:property_id", bookingOpsHourlyLimiter, validateParams(favoriteSchema), favoritesController.removeFavorite);
router.get(
	"/check/:property_id",
	bookingOpsHourlyLimiter,
	validateParams(favoriteParamSchema),
	favoritesController.checkFavorite
);

export default router;