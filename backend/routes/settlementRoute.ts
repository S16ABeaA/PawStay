import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin";
import {
  createSettlement,
  listSettlements,
  getSettlement,
  updateSettlementStatus,
  getMonthlyReceivables,
  getReceivableSummary,
  getPropertySettlements,
  deleteSettlement,
  getProprietorMonthlyStatus,
} from "../controllers/settlementController";

const router = Router();

// All settlement routes require auth
router.use(authMiddleware);

// Proprietor endpoint - view own monthly status (accessible to all authenticated users)
router.get("/proprietor/monthly-status", getProprietorMonthlyStatus);

// Dashboard aggregates (must be before /:id to avoid route conflicts)
router.get("/monthly-receivables", requireSuperAdmin, getMonthlyReceivables);
router.get("/summary", requireSuperAdmin, getReceivableSummary);

// Property-specific settlement history
router.get("/property/:propertyId", requireSuperAdmin, getPropertySettlements);

// CRUD
router.get("/", requireSuperAdmin, listSettlements);
router.post("/", requireSuperAdmin, createSettlement);
router.get("/:id", requireSuperAdmin, getSettlement);
router.patch("/:id/status", requireSuperAdmin, updateSettlementStatus);
router.delete("/:id", requireSuperAdmin, deleteSettlement);

export default router;
