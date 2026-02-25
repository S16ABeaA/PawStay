import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireSuperAdmin } from "../middleware/authMiddleware";
import { adminPropertyController } from "../controllers/adminPropertyController";

const router = Router();

// All routes require a logged-in super_admin
router.use(authMiddleware, requireSuperAdmin);

// GET /api/admin/properties/stats  — must come before /:id
router.get("/stats", adminPropertyController.getStats);

// GET /api/admin/properties?status=&search=&page=&limit=
router.get("/", adminPropertyController.listProperties);

// GET /api/admin/properties/:id
router.get("/:id", adminPropertyController.getPropertyDetail);

// PATCH /api/admin/properties/:id/status
router.patch("/:id/status", adminPropertyController.updatePropertyStatus);

// DELETE /api/admin/properties/:id
router.delete("/:id", adminPropertyController.deleteProperty);

export default router;
