import { Router } from "express";
import { propertyController } from "../controllers/propertyController";
import { authMiddleware } from "../middleware/authMiddleware";
import {
	authGuardLimiter,
	anonBrowseHourlyLimiter,
	anonSearchHourlyLimiter,
	authBrowseDailyLimiter,
	authBrowseHourlyLimiter,
	serviceListingUpdateLimiter,
} from "../middleware/rateLimiters";
import { validateBody, validateParams, validateQuery } from "../middleware/inputValidation";

const router = Router();

const searchSchema = {
	location: { type: "string", required: false, maxLength: 120, pattern: /^[a-zA-Z0-9\s,.'\-]*$/ },
	checkin: { type: "string", required: false, maxLength: 10, pattern: /^\d{4}-\d{2}-\d{2}$/ },
	checkIn: { type: "string", required: false, maxLength: 10, pattern: /^\d{4}-\d{2}-\d{2}$/ },
	checkout: { type: "string", required: false, maxLength: 10, pattern: /^\d{4}-\d{2}-\d{2}$/ },
	checkOut: { type: "string", required: false, maxLength: 10, pattern: /^\d{4}-\d{2}-\d{2}$/ },
	timeSlot: { type: "string", required: false, maxLength: 16, pattern: /^[a-zA-Z0-9:\-\s]*$/ },
	time_slot: { type: "string", required: false, maxLength: 16, pattern: /^[a-zA-Z0-9:\-\s]*$/ },
	petType: { type: "string", required: false, maxLength: 30, pattern: /^[a-zA-Z\s,/-]*$/ },
	pet: { type: "string", required: false, maxLength: 30, pattern: /^[a-zA-Z\s,/-]*$/ },
	dogSize: { type: "string", required: false, maxLength: 30, pattern: /^[a-zA-Z\s,/-]*$/ },
	dogsize: { type: "string", required: false, maxLength: 30, pattern: /^[a-zA-Z\s,/-]*$/ },
	propertyType: { type: "string", required: false, maxLength: 30, pattern: /^[a-zA-Z\s,/-]*$/ },
	type: { type: "string", required: false, maxLength: 30, pattern: /^[a-zA-Z\s,/-]*$/ },
	serviceCategory: { type: "string", required: false, maxLength: 40, pattern: /^[a-zA-Z\s,/-]*$/ },
	minPrice: { type: "number", required: false, min: 0, max: 1000000 },
	maxPrice: { type: "number", required: false, min: 0, max: 1000000 },
	rating: { type: "number", required: false, min: 0, max: 5 },
	amenities: { type: "string", required: false, maxLength: 300, pattern: /^[a-zA-Z0-9\s,.'\-]*$/ },
	keyword: { type: "string", required: false, maxLength: 120, pattern: /^[a-zA-Z0-9\s,.'\-]*$/ },
	lat: { type: "number", required: false, min: -90, max: 90 },
	lng: { type: "number", required: false, min: -180, max: 180 },
	radiusKm: { type: "number", required: false, min: 0, max: 500 },
} as const;

const limitSchema = {
	limit: { type: "number", required: false, min: 1, max: 18 },
} as const;

const propertyIdParamSchema = {
	id: { type: "uuid", required: true },
} as const;

const serviceParamsSchema = {
	id: { type: "uuid", required: true },
	serviceId: { type: "uuid", required: true },
} as const;

router.get("/search", anonSearchHourlyLimiter, validateQuery(searchSchema), propertyController.searchProperties);
router.post("/search", anonSearchHourlyLimiter, validateBody(searchSchema), propertyController.searchProperties);
router.post("/randomproperty", anonBrowseHourlyLimiter, validateBody(limitSchema), propertyController.randomProperties);
router.get("/recommended", authGuardLimiter, authMiddleware, authBrowseHourlyLimiter, authBrowseDailyLimiter, validateQuery(limitSchema), propertyController.recommendedProperties);
router.post("/recommended", authGuardLimiter, authMiddleware, authBrowseHourlyLimiter, authBrowseDailyLimiter, validateBody(limitSchema), propertyController.recommendedProperties);
// Protected routes for proprietor — place before param routes to avoid "mine" being treated as an :id
router.get('/mine', authGuardLimiter, authMiddleware, authBrowseHourlyLimiter, authBrowseDailyLimiter, propertyController.myProperties);
router.post('/mine/seed', authGuardLimiter, authMiddleware, serviceListingUpdateLimiter, propertyController.seedMyProperty);
router.get('/mine/stats', authGuardLimiter, authMiddleware, authBrowseHourlyLimiter, authBrowseDailyLimiter, propertyController.dashboardStats);

router.get("/:id", validateParams(propertyIdParamSchema), anonBrowseHourlyLimiter, propertyController.getById);
router.get("/:id/payment", validateParams(propertyIdParamSchema), anonBrowseHourlyLimiter, propertyController.getPaymentOptions);
router.get("/:id/cancellation-policy", validateParams(propertyIdParamSchema), anonBrowseHourlyLimiter, propertyController.getCancellationPolicy);
router.get("/:id/reviews", validateParams(propertyIdParamSchema), anonBrowseHourlyLimiter, propertyController.getReviews);

// Service management routes
router.get('/:id/services', validateParams(propertyIdParamSchema), anonBrowseHourlyLimiter, propertyController.getServices);
router.post('/:id/services', validateParams(propertyIdParamSchema), authGuardLimiter, authMiddleware, serviceListingUpdateLimiter, propertyController.createService);
router.patch('/:id/services/:serviceId', validateParams(serviceParamsSchema), authGuardLimiter, authMiddleware, serviceListingUpdateLimiter, propertyController.updateService);
router.delete('/:id/services/:serviceId', validateParams(serviceParamsSchema), authGuardLimiter, authMiddleware, serviceListingUpdateLimiter, propertyController.deleteService);

export default router;