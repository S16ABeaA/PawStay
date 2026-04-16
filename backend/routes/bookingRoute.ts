import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin";
import {
  anonSearchHourlyLimiter,
  bookingConfirmationLimiter,
  bookingOpsHourlyLimiter,
  bulkOpsLimiter,
  calendarAccessLimiter,
  paymentInitiationLimiter,
} from "../middleware/rateLimiters";
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

// Availability check — public (no auth required) so the booking page can check before submitting
router.get("/availability/:propertyId", anonSearchHourlyLimiter, checkAvailability);

// All other booking routes require authentication
router.use(authMiddleware);

// Admin calendar — returns bookings across all proprietor's properties
router.get("/admin/calendar", calendarAccessLimiter, adminCalendar);

// Admin walk-in — create a walk-in booking (proprietor / admin only)
router.post("/admin/walkin", bulkOpsLimiter, adminCreateWalkin);

// Admin update booking status (confirm, check-in, complete, cancel)
router.patch("/admin/:id/status", bookingConfirmationLimiter, adminUpdateBookingStatus);

// Admin update payment status (paid, refunded, etc.)
router.patch("/admin/:id/payment", paymentInitiationLimiter, adminUpdatePaymentStatus);

// Admin soft-delete a booking
router.delete("/admin/:id", bulkOpsLimiter, adminDeleteBooking);
// Proprietor: today's check-ins for their properties
router.get('/mine/today', getTodayCheckInsForOwner);
// Proprietor: recent bookings for their properties
router.get('/mine/recent', getRecentBookingsForOwner);
// Proprietor: list bookings (paginated)
router.get('/mine/list', listBookingsForOwner);
// Compatibility: accept /mine as alias for /mine/list
router.get('/mine', listBookingsForOwner);
// Proprietor: get single booking detail (with images)
router.get('/mine/:id', getBookingForOwner);
// Proprietor: update booking status
router.post('/:id/status', bookingConfirmationLimiter, updateBookingStatusForOwner);

// Super admin revenue analytics
router.get('/revenue/total', requireSuperAdmin, getTotalRevenue);
router.get('/revenue/by-service-type', requireSuperAdmin, getRevenueByServiceType);
router.get('/revenue/by-property', requireSuperAdmin, getRevenueByProperty);
router.get('/revenue/by-location', requireSuperAdmin, getRevenueByLocation);
router.get('/revenue/by-time-period', requireSuperAdmin, getRevenueByTimePeriod);
router.get('/revenue/period-comparison', requireSuperAdmin, getRevenuePeriodComparison);
router.get('/revenue/monthly-series', requireSuperAdmin, getRevenueMonthlySeries);

// Super admin receivables
router.get('/receivables', requireSuperAdmin, getReceivables);

router.get("/", listBookings);
router.get("/:id", getBooking);
router.patch("/:id/cancel", bookingConfirmationLimiter, cancelBookingForUser);
router.get("/:id/payment-status", checkPaymentStatus);
router.post("/", bookingOpsHourlyLimiter, bookingConfirmationLimiter, createBooking);

export default router;