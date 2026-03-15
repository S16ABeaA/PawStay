import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createBooking,
  listBookings,
  getBooking,
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
} from "../controllers/bookingController";

const router = Router();

// Availability check — public (no auth required) so the booking page can check before submitting
router.get("/availability/:propertyId", checkAvailability);

// All other booking routes require authentication
router.use(authMiddleware);

// Admin calendar — returns bookings across all proprietor's properties
router.get("/admin/calendar", adminCalendar);

// Admin walk-in — create a walk-in booking (proprietor / admin only)
router.post("/admin/walkin", adminCreateWalkin);

// Admin update booking status (confirm, check-in, complete, cancel)
router.patch("/admin/:id/status", adminUpdateBookingStatus);

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

router.get("/", listBookings);
router.get("/:id", getBooking);
router.get("/:id/payment-status", checkPaymentStatus);
router.post("/", createBooking);

export default router;