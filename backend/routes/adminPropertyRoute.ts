import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireSuperAdmin } from "../middleware/authMiddleware";
import { adminPropertyController } from "../controllers/adminPropertyController";
import { authBrowseHourlyLimiter, bulkOpsLimiter } from "../middleware/rateLimiters";
import { validateBody, validateParams, validateQuery } from "../middleware/inputValidation";

const router = Router();

const propertyIdParamSchema = {
	id: { type: "uuid", required: true },
} as const;

const statusUpdateSchema = {
	status: { type: "enum", required: true, enumValues: ["approved", "rejected", "suspended", "pending"] },
	rejection_reason: { type: "string", required: false, maxLength: 500 },
} as const;

const adminPropertyQuerySchema = {
	search: { type: "string", required: false, maxLength: 100 },
	status: { type: "string", required: false, maxLength: 20 },
	sort: { type: "enum", required: false, enumValues: ["asc", "desc"] },
	page: { type: "number", required: false, min: 1 },
	limit: { type: "number", required: false, min: 1, max: 100 },
} as const;

// All routes require a logged-in super_admin
router.use(authMiddleware, requireSuperAdmin);

// GET /api/admin/properties/stats  — must come before /:id
router.get("/stats", authBrowseHourlyLimiter, adminPropertyController.getStats);

// GET /api/admin/properties?status=&search=&page=&limit=
router.get("/", authBrowseHourlyLimiter, requireSuperAdmin, validateQuery(adminPropertyQuerySchema), adminPropertyController.listProperties);

// GET /api/admin/properties/:id
router.get("/:id", authBrowseHourlyLimiter, validateParams({ id: { type: "uuid", required: true } }), adminPropertyController.getPropertyDetail);

// PATCH /api/admin/properties/:id/status
router.patch("/:id/status", bulkOpsLimiter, validateParams(propertyIdParamSchema), validateBody(statusUpdateSchema), adminPropertyController.updatePropertyStatus);

// DELETE /api/admin/properties/:id
router.delete("/:id", bulkOpsLimiter, validateParams(propertyIdParamSchema), adminPropertyController.deleteProperty);

export default router;
