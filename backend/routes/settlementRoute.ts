import { Router } from "express";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin";
import {
  createSettlement,
  listSettlements,
  getSettlement,
  updateSettlementStatus,
  dispatchSettlementReminders,
  getMonthlyReceivables,
  getReceivableSummary,
  getPropertySettlements,
  deleteSettlement,
  getProprietorMonthlyStatus,
  getProprietorReceivables,
  getProprietorSettlements,
  submitProprietorSettlement,
} from "../controllers/settlementController";

const router = Router();

// All settlement routes require auth
router.use(authMiddleware);

// Proprietor endpoint - view own monthly status (accessible to all authenticated users)
router.get("/proprietor/monthly-status", getProprietorMonthlyStatus);
router.get("/proprietor/receivables", requireAdmin, getProprietorReceivables);
router.get("/proprietor/settlements", requireAdmin, getProprietorSettlements);
router.post("/proprietor/settlements", requireAdmin, submitProprietorSettlement);

// Dashboard aggregates (must be before /:id to avoid route conflicts)
router.get("/monthly-receivables", requireSuperAdmin, getMonthlyReceivables);
router.get("/summary", requireSuperAdmin, getReceivableSummary);

// Property-specific settlement history
router.get("/property/:propertyId", requireSuperAdmin, getPropertySettlements);

// Trigger reminder notifications (manual/admin trigger)
router.post("/reminders/dispatch", requireSuperAdmin, dispatchSettlementReminders);

// CRUD
router.get("/", requireSuperAdmin, listSettlements);
router.post("/", requireSuperAdmin, createSettlement);
router.get("/:id", requireSuperAdmin, getSettlement);
router.patch("/:id/status", requireSuperAdmin, updateSettlementStatus);
router.delete("/:id", requireSuperAdmin, deleteSettlement);

export default router;
