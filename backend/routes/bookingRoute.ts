import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin";
import {
  authBrowseHourlyLimiter,
  anonBrowseHourlyLimiter,
  anonSearchHourlyLimiter,
  bookingConfirmationLimiter,
  bookingOpsHourlyLimiter,
  bulkOpsLimiter,
  calendarAccessLimiter,
  paymentInitiationLimiter,
} from "../middleware/rateLimiters";
import { validateBody, validateParams, validateQuery } from "../middleware/inputValidation";
import {
  createBooking,
  listBookings,
  getBooking,
  cancelBookingForUser,
  checkAvailability,
  checkPaymentStatus,
  adminCalendar,
  adminCreateWalkin,
  adminUpdateBookingStatus,
  adminUpdatePaymentStatus,
  adminDeleteBooking,
  getTodayCheckInsForOwner,
  getRecentBookingsForOwner,
  listBookingsForOwner,
  getBookingForOwner,
  updateBookingStatusForOwner,
  getTotalRevenue,
  getRevenueByServiceType,
  getRevenueByProperty,
  getRevenueByLocation,
  getRevenueByTimePeriod,
  getRevenuePeriodComparison,
  getRevenueMonthlySeries,
  getReceivables,
} from "../controllers/bookingController";

const router = Router();

const bookingIdParamSchema = {
  id: { type: "uuid", required: true },
} as const;

const availabilityParamSchema = {
  propertyId: { type: "uuid", required: true },
} as const;

const availabilityQuerySchema = {
  type: { type: "enum", required: true, enumValues: ["daily", "monthly", "hourly"] },
  startDate: { type: "string", required: true },
  endDate: { type: "string", required: true },
} as const;

const receivablesQuerySchema = {
  status: { type: "string", required: false, maxLength: 20 },
  search: { type: "string", required: false, maxLength: 100 },
  sort: { type: "enum", required: false, enumValues: ["asc", "desc"] },
  page: { type: "number", required: false, min: 1 },
  limit: { type: "number", required: false, min: 1, max: 100 },
} as const;

const createBookingSchema = {
  property_id: { type: "uuid", required: true },
  check_in: { type: "string", required: true, maxLength: 40 },
  check_out: { type: "string", required: true, maxLength: 40 },
  guests: { type: "number", required: true, min: 1, max: 20 },
} as const;

const adminWalkinSchema = {
  property_id: { type: "uuid", required: true },
  guest_name: { type: "string", required: true, minLength: 1, maxLength: 120 },
  check_in: { type: "string", required: true, maxLength: 40 },
  check_out: { type: "string", required: true, maxLength: 40 },
} as const;

const bookingStatusSchema = {
  status: { type: "enum", required: true, enumValues: ["pending", "confirmed", "cancelled", "completed"] },
} as const;

const paymentStatusSchema = {
  payment_status: { type: "enum", required: true, enumValues: ["unpaid", "paid", "refunded", "partially_refunded"] },
} as const;

const normalizeCreateBookingBody = (req: any, _res: any, next: any) => {
  req.body = req.body || {};
  if (req.body.check_in === undefined && req.body.checkin !== undefined) req.body.check_in = req.body.checkin;
  if (req.body.check_out === undefined && req.body.checkout !== undefined) req.body.check_out = req.body.checkout;
  if (req.body.checkin === undefined && req.body.check_in !== undefined) req.body.checkin = req.body.check_in;
  if (req.body.checkout === undefined && req.body.check_out !== undefined) req.body.checkout = req.body.check_out;
  if (req.body.guests === undefined) req.body.guests = 1;
  next();
};

const normalizeAdminWalkinBody = (req: any, _res: any, next: any) => {
  req.body = req.body || {};
  const hadCheckout = req.body.checkout !== undefined || req.body.check_out !== undefined;
  if (req.body.check_in === undefined && req.body.checkin !== undefined) req.body.check_in = req.body.checkin;
  if (req.body.check_out === undefined && req.body.checkout !== undefined) req.body.check_out = req.body.checkout;
  if (req.body.check_out === undefined && req.body.check_in !== undefined) {
    req.body.check_out = req.body.check_in;
  }
  if (req.body.checkin === undefined && req.body.check_in !== undefined) req.body.checkin = req.body.check_in;
  if (req.body.checkout === undefined && req.body.check_out !== undefined) req.body.checkout = req.body.check_out;
  if (req.body.guest_name === undefined && req.body.owner_name !== undefined) req.body.guest_name = req.body.owner_name;
  if (req.body.owner_name === undefined && req.body.guest_name !== undefined) req.body.owner_name = req.body.guest_name;
  req.__walkinHadCheckout = hadCheckout;
  next();
};

const restoreAdminWalkinCheckout = (req: any, _res: any, next: any) => {
  if (!req.__walkinHadCheckout) {
    delete req.body.checkout;
    delete req.body.check_out;
  }
  next();
};

// Availability check — public (no auth required) so the booking page can check before submitting
router.get(
  "/availability/:propertyId",
  anonBrowseHourlyLimiter,
  validateParams(availabilityParamSchema),
  validateQuery(availabilityQuerySchema),
  checkAvailability
);

// All other booking routes require authentication
router.use(authMiddleware);

// Admin calendar — returns bookings across all proprietor's properties
router.get("/admin/calendar", calendarAccessLimiter, adminCalendar);

// Admin walk-in — create a walk-in booking (proprietor / admin only)
router.post(
  "/admin/walkin",
  bookingOpsHourlyLimiter,
  bulkOpsLimiter,
  normalizeAdminWalkinBody,
  validateBody(adminWalkinSchema, { allowUnknown: true }),
  restoreAdminWalkinCheckout,
  adminCreateWalkin
);

// Admin update booking status (confirm, check-in, complete, cancel)
router.patch(
  "/admin/:id/status",
  bookingOpsHourlyLimiter,
  bookingConfirmationLimiter,
  validateParams(bookingIdParamSchema),
  validateBody(bookingStatusSchema, { allowUnknown: true }),
  adminUpdateBookingStatus
);

// Admin update payment status (paid, refunded, etc.)
router.patch(
  "/admin/:id/payment",
  paymentInitiationLimiter,
  validateParams(bookingIdParamSchema),
  validateBody(paymentStatusSchema, { allowUnknown: true }),
  adminUpdatePaymentStatus
);

// Admin soft-delete a booking
router.delete("/admin/:id", bookingOpsHourlyLimiter, bulkOpsLimiter, validateParams(bookingIdParamSchema), adminDeleteBooking);
// Proprietor: today's check-ins for their properties
router.get('/mine/today', authBrowseHourlyLimiter, getTodayCheckInsForOwner);
// Proprietor: recent bookings for their properties
router.get('/mine/recent', authBrowseHourlyLimiter, getRecentBookingsForOwner);
// Proprietor: list bookings (paginated)
router.get('/mine/list', authBrowseHourlyLimiter, listBookingsForOwner);
// Compatibility: accept /mine as alias for /mine/list
router.get('/mine', authBrowseHourlyLimiter, authMiddleware, listBookingsForOwner);
// Proprietor: get single booking detail (with images)
router.get('/mine/:id', authBrowseHourlyLimiter, validateParams(bookingIdParamSchema), getBookingForOwner);
// Proprietor: update booking status
router.post(
  '/:id/status',
  bookingOpsHourlyLimiter,
  bookingConfirmationLimiter,
  validateParams(bookingIdParamSchema),
  validateBody(bookingStatusSchema, { allowUnknown: true }),
  updateBookingStatusForOwner
);

// Super admin revenue analytics
router.get('/revenue/total', authBrowseHourlyLimiter, requireSuperAdmin, getTotalRevenue);
router.get('/revenue/by-service-type', authBrowseHourlyLimiter, requireSuperAdmin, getRevenueByServiceType);
router.get('/revenue/by-property', authBrowseHourlyLimiter, requireSuperAdmin, getRevenueByProperty);
router.get('/revenue/by-location', authBrowseHourlyLimiter, requireSuperAdmin, getRevenueByLocation);
router.get('/revenue/by-time-period', authBrowseHourlyLimiter, requireSuperAdmin, getRevenueByTimePeriod);
router.get('/revenue/period-comparison', authBrowseHourlyLimiter, requireSuperAdmin, getRevenuePeriodComparison);
router.get('/revenue/monthly-series', authBrowseHourlyLimiter, requireSuperAdmin, getRevenueMonthlySeries);

// Super admin receivables
router.get('/receivables', authBrowseHourlyLimiter, requireSuperAdmin, validateQuery(receivablesQuerySchema), getReceivables);

router.get("/", authBrowseHourlyLimiter, listBookings);
router.get("/:id", authBrowseHourlyLimiter, validateParams(bookingIdParamSchema), getBooking);
router.patch(
  "/:id/cancel",
  bookingConfirmationLimiter,
  validateParams(bookingIdParamSchema),
  cancelBookingForUser
);
router.get("/:id/payment-status", bookingOpsHourlyLimiter, validateParams(bookingIdParamSchema), checkPaymentStatus);
router.post(
  "/",
  bookingOpsHourlyLimiter,
  bookingConfirmationLimiter,
  normalizeCreateBookingBody,
  validateBody(createBookingSchema, { allowUnknown: true }),
  createBooking
);

export default router;