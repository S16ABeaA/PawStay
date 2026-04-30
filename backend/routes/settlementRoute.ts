import { Router } from "express";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin";
import { authBrowseHourlyLimiter, bulkOpsLimiter, paymentInitiationLimiter } from "../middleware/rateLimiters";
import { validateBody, validateParams } from "../middleware/inputValidation";
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
  getSettlementPaymentChannels,
  updateSettlementPaymentChannels,
} from "../controllers/settlementController";

const router = Router();

const settlementIdParamSchema = {
  id: { type: "uuid", required: true },
} as const;

const propertyIdParamSchema = {
  propertyId: { type: "uuid", required: true },
} as const;

const settlementStatusSchema = {
  status: { type: "enum", required: true, enumValues: ["pending", "completed", "failed", "reversed"] },
} as const;

const createSettlementSchema = {
  amount: { type: "number", required: true, min: 0 },
  property_id: { type: "uuid", required: true },
} as const;

const proprietorSettlementSchema = {
  propertyId: { type: "uuid", required: true },
  amount: { type: "number", required: true, min: 0 },
} as const;

const paymentChannelSchema = {
  channel: { type: "string", required: true, minLength: 1, maxLength: 80 },
} as const;

const normalizeCreateSettlementBody = (req: any, _res: any, next: any) => {
  req.body = req.body || {};
  if (req.body.propertyId !== undefined && req.body.property_id === undefined) {
    req.body.property_id = req.body.propertyId;
  }
  if (req.body.property_id !== undefined && req.body.propertyId === undefined) {
    req.body.propertyId = req.body.property_id;
  }
  next();
};

const normalizePaymentChannelsBody = (req: any, _res: any, next: any) => {
  req.body = req.body || {};
  if (req.body.channel === undefined && req.body.paymentChannels && typeof req.body.paymentChannels === "object") {
    const first = Object.keys(req.body.paymentChannels)[0];
    if (first) req.body.channel = first;
  }
  if (req.body.channel !== undefined && req.body.paymentChannels === undefined) {
    const channel = String(req.body.channel).toLowerCase();
    req.body.paymentChannels = {
      [channel]: {
        imageUrl: req.body[`${channel}QrUrl`] || null,
      },
    };
  }
  next();
};

// All settlement routes require auth
router.use(authMiddleware);

// Proprietor endpoint - view own monthly status (accessible to all authenticated users)
router.get("/proprietor/monthly-status", authBrowseHourlyLimiter, getProprietorMonthlyStatus);
router.get("/proprietor/receivables", authBrowseHourlyLimiter, requireAdmin, getProprietorReceivables);
router.get("/proprietor/settlements", authBrowseHourlyLimiter, requireAdmin, getProprietorSettlements);
router.post(
  "/proprietor/settlements",
  paymentInitiationLimiter,
  requireAdmin,
  validateBody(proprietorSettlementSchema, { allowUnknown: true }),
  submitProprietorSettlement
);
router.get("/payment-channels", authBrowseHourlyLimiter, getSettlementPaymentChannels);
router.put(
  "/payment-channels",
  paymentInitiationLimiter,
  normalizePaymentChannelsBody,
  requireSuperAdmin,
  validateBody(paymentChannelSchema, { allowUnknown: true }),
  updateSettlementPaymentChannels
);

// Dashboard aggregates (must be before /:id to avoid route conflicts)
router.get("/monthly-receivables", authBrowseHourlyLimiter, requireSuperAdmin, getMonthlyReceivables);
router.get("/summary", authBrowseHourlyLimiter, requireSuperAdmin, getReceivableSummary);

// Property-specific settlement history
router.get("/property/:propertyId", authBrowseHourlyLimiter, validateParams({ propertyId: { type: "uuid", required: true } }), requireSuperAdmin, getPropertySettlements);

// Trigger reminder notifications (manual/admin trigger)
router.post("/reminders/dispatch", bulkOpsLimiter, requireSuperAdmin, dispatchSettlementReminders);

// CRUD
router.get("/", authBrowseHourlyLimiter, requireSuperAdmin, listSettlements);
router.post(
  "/",
  paymentInitiationLimiter,
  bulkOpsLimiter,
  normalizeCreateSettlementBody,
  validateBody(createSettlementSchema, { allowUnknown: true }),
  requireSuperAdmin,
  createSettlement
);
router.get("/:id", authBrowseHourlyLimiter, validateParams({ id: { type: "uuid", required: true } }), requireSuperAdmin, getSettlement);
router.patch("/:id/status", bulkOpsLimiter, validateParams(settlementIdParamSchema), validateBody(settlementStatusSchema), requireSuperAdmin, updateSettlementStatus);
router.delete("/:id", bulkOpsLimiter, validateParams(settlementIdParamSchema), requireSuperAdmin, deleteSettlement);

export default router;
