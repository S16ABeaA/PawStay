import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createBooking,
  listBookings,
  getBooking,
  checkAvailability,
  adminCalendar,
  adminCreateWalkin,
  adminUpdateBookingStatus,
  adminDeleteBooking,
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

// Admin soft-delete a booking
router.delete("/admin/:id", adminDeleteBooking);

router.get("/", listBookings);
router.get("/:id", getBooking);
router.post("/", createBooking);

export default router;
