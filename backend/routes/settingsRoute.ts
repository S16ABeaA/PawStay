import { Router } from "express";
import { settingsController } from "../controllers/settingsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { availabilityUpdateLimiter, bulkOpsLimiter } from "../middleware/rateLimiters";
import { validateBody } from "../middleware/inputValidation";

const router = Router();

const businessSchema = {
	property_id: { type: "uuid", required: false },
	name: { type: "string", required: false, minLength: 1, maxLength: 120 },
	phone: { type: "string", required: false, minLength: 7, maxLength: 30, pattern: /^[+0-9\-()\s]{7,30}$/ },
	website: { type: "url", required: false, maxLength: 255 },
	description: { type: "string", required: false, maxLength: 2000 },
	address: { type: "string", required: false, minLength: 3, maxLength: 200 },
} as const;

const notificationsSchema = {
	newBookings: { type: "boolean", required: false },
	bookingReminders: { type: "boolean", required: false },
	newReviews: { type: "boolean", required: false },
	marketingUpdates: { type: "boolean", required: false },
} as const;

const availabilitySchema = {
	property_id: { type: "uuid", required: false },
	maxCapacity: { type: "number", required: false, min: 0, max: 1000 },
	minStay: { type: "number", required: false, min: 1, max: 365 },
	checkInTime: { type: "string", required: false, maxLength: 10, pattern: /^([01]\d|2[0-3]):[0-5]\d$/ },
	checkOutTime: { type: "string", required: false, maxLength: 10, pattern: /^([01]\d|2[0-3]):[0-5]\d$/ },
	sameDayBookings: { type: "boolean", required: false },
} as const;

const paymentSchema = {
	property_id: { type: "uuid", required: false },
	acceptedMethods: { type: "string[]", required: false, maxItems: 20, maxLength: 60 },
	gcashQrUrl: { type: "url", required: false, maxLength: 500 },
	paymayaQrUrl: { type: "url", required: false, maxLength: 500 },
} as const;

const propertySetupSchema = {
	property_id: { type: "uuid", required: false },
	unvaccinatedPolicy: { type: "boolean", required: false },
	unvaccinatedPolicyDetails: { type: "string", required: false, maxLength: 2000 },
	breedRestrictions: { type: "boolean", required: false },
	breedRestrictionsDetails: { type: "string", required: false, maxLength: 2000 },
	aggressivePolicy: { type: "boolean", required: false },
	aggressivePolicyDetails: { type: "string", required: false, maxLength: 2000 },
	bookingRules: { type: "string[]", required: false, maxItems: 100, maxLength: 300 },
	complianceRequirements: { type: "string[]", required: false, maxItems: 100, maxLength: 300 },
	vaccinationRequirements: { type: "string[]", required: false, maxItems: 100, maxLength: 300 },
	emergencyProcedures: { type: "string", required: false, maxLength: 4000 },
	vetAvailability: { type: "string[]", required: false, maxItems: 100, maxLength: 300 },
	isolationSanitationProtocols: { type: "string[]", required: false, maxItems: 100, maxLength: 300 },
} as const;

// All settings routes require authentication
router.use(authMiddleware);

// GET  /api/settings            — load all settings for the logged-in owner
router.get("/", settingsController.getSettings);

// PUT  /api/settings/business      — update business info
router.put("/business", bulkOpsLimiter, validateBody(businessSchema), settingsController.updateBusiness);

// PUT  /api/settings/notifications — update notification prefs
router.put("/notifications", bulkOpsLimiter, validateBody(notificationsSchema), settingsController.updateNotifications);

// PUT  /api/settings/availability  — update availability settings
router.put("/availability", availabilityUpdateLimiter, validateBody(availabilitySchema), settingsController.updateAvailability);

// PUT  /api/settings/payment       — update payment settings
router.put("/payment", bulkOpsLimiter, validateBody(paymentSchema), settingsController.updatePayment);

// PUT  /api/settings/property-setup — update property setup
router.put("/property-setup", bulkOpsLimiter, validateBody(propertySetupSchema), settingsController.updatePropertySetup);

export default router;
