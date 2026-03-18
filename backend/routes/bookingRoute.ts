import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin";
import {
  createBooking,
  listBookings,
  getBooking,
  checkAvailability,
  getCancellationPolicy,
  cancelBooking,
  checkPaymentStatus,
  adminCalendar,
  adminCreateWalkin,
  adminUpdateBookingStatus,
  adminModifyReservation,
  adminUpdatePaymentStatus,
  adminDeleteBooking,
  autoRebookCancellation,
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
router.get("/availability/:propertyId", checkAvailability);
router.get("/cancellation-policy/:propertyId", getCancellationPolicy);

// All other booking routes require authentication
router.use(authMiddleware);

// Admin calendar — returns bookings across all proprietor's properties
router.get("/admin/calendar", adminCalendar);

// Admin walk-in — create a walk-in booking (proprietor / admin only)
router.post("/admin/walkin", adminCreateWalkin);

// Admin update booking status (confirm, check-in, complete, cancel)
router.patch("/admin/:id/status", adminUpdateBookingStatus);

// Admin modify reservation details (reschedule, service options)
router.patch("/admin/:id/modify", adminModifyReservation);

// Admin update payment status (paid, refunded, etc.)
router.patch("/admin/:id/payment", adminUpdatePaymentStatus);

// Admin soft-delete a booking
router.delete("/admin/:id", adminDeleteBooking);
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
router.post('/:id/status', updateBookingStatusForOwner);

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
router.patch("/:id/cancel", cancelBooking);
router.get("/:id/auto-rebook", autoRebookCancellation);
router.get("/:id/payment-status", checkPaymentStatus);
router.post("/", createBooking);

export default router;