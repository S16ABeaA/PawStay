import { supabaseAdmin } from "../config/supabaseAdmin";
import { notificationModel } from "../models/notificationModel";
import { getSuperAdminRecipients } from "./notificationRecipients";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDayUtc = (d: Date) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const toDateKey = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

const getWeekStartMondayUtc = (d: Date) => {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const base = startOfDayUtc(d);
  return new Date(base.getTime() + diff * MS_PER_DAY);
};

const hasNotificationForReference = async (userId: string, referenceId: string, type: string) => {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("reference_id", referenceId)
    .eq("type", type)
    .eq("is_deleted", false)
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
};

export const dispatchBookingLifecycleNotificationsJob = async () => {
  const now = new Date();
  const today = startOfDayUtc(now);
  const tomorrow = new Date(today.getTime() + MS_PER_DAY);
  const dayAfterTomorrow = new Date(tomorrow.getTime() + MS_PER_DAY);

  let remindersCreated = 0;
  let completedCreated = 0;

  const { data: reminderBookings, error: reminderErr } = await supabaseAdmin
    .from("bookings")
    .select("id, user_id, checkin, service_name, service_type")
    .eq("is_deleted", false)
    .eq("status", "confirmed")
    .gte("checkin", tomorrow.toISOString())
    .lt("checkin", dayAfterTomorrow.toISOString())
    .limit(100000);

  if (reminderErr) throw reminderErr;

  for (const booking of reminderBookings ?? []) {
    const exists = await hasNotificationForReference(booking.user_id, booking.id, "booking_reminder");
    if (exists) continue;

    const svcLabel = booking.service_name || booking.service_type || "your booking";
    await notificationModel.create({
      user_id: booking.user_id,
      type: "booking_reminder",
      title: "Booking Reminder",
      message: `Reminder: Your booking for ${svcLabel} is scheduled for tomorrow.`,
      link: `/my-bookings?bookingId=${booking.id}`,
      reference_id: booking.id,
      reference_type: "booking",
    });
    remindersCreated += 1;
  }

  const { data: completedBookings, error: completedErr } = await supabaseAdmin
    .from("bookings")
    .select("id, user_id, checkin, checkout, service_name, service_type")
    .eq("is_deleted", false)
    .in("status", ["completed", "checked_out"])
    .limit(100000);

  if (completedErr) throw completedErr;

  for (const booking of completedBookings ?? []) {
    const exists = await hasNotificationForReference(booking.user_id, booking.id, "booking_completed");
    if (exists) continue;

    const svcLabel = booking.service_name || booking.service_type || "your booking";
    const endDate = booking.checkout || booking.checkin;
    const end = endDate ? new Date(endDate) : null;
    if (end && end.getTime() > now.getTime()) {
      continue;
    }

    await notificationModel.create({
      user_id: booking.user_id,
      type: "booking_completed",
      title: "Booking Completed",
      message: `Your booking for ${svcLabel} has been completed. We hope your pet had a great stay!`,
      link: `/my-bookings?bookingId=${booking.id}`,
      reference_id: booking.id,
      reference_type: "booking",
    });
    completedCreated += 1;
  }

  return { remindersCreated, completedCreated };
};

export const dispatchWeeklyReportNotificationsJob = async () => {
  const now = new Date();
  const weekStart = getWeekStartMondayUtc(now);
  const weekStartKey = toDateKey(weekStart);
  const nextWeekStart = new Date(weekStart.getTime() + 7 * MS_PER_DAY);

  const recipients = await getSuperAdminRecipients();
  if (recipients.length === 0) return { created: 0, skipped: "no-super-admins" as const };

  const isMonday = now.getUTCDay() === 1;
  if (!isMonday) return { created: 0, skipped: "not-monday" as const };

  const [bookingsRes, reviewsRes, pendingPropsRes, ticketsRes] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart.toISOString())
      .lt("created_at", nextWeekStart.toISOString())
      .eq("is_deleted", false),
    supabaseAdmin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart.toISOString())
      .lt("created_at", nextWeekStart.toISOString())
      .eq("is_deleted", false),
    supabaseAdmin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("is_deleted", false),
    supabaseAdmin
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart.toISOString())
      .lt("created_at", nextWeekStart.toISOString())
      .eq("is_deleted", false),
  ]);

  if (bookingsRes.error) throw bookingsRes.error;
  if (reviewsRes.error) throw reviewsRes.error;
  if (pendingPropsRes.error) throw pendingPropsRes.error;
  if (ticketsRes.error) throw ticketsRes.error;

  const weeklyBookings = bookingsRes.count ?? 0;
  const weeklyReviews = reviewsRes.count ?? 0;
  const pendingProperties = pendingPropsRes.count ?? 0;
  const weeklyTickets = ticketsRes.count ?? 0;

  let created = 0;
  const title = `Weekly Report (${weekStartKey})`;

  for (const recipient of recipients) {
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("notifications")
      .select("id")
      .eq("user_id", recipient.id)
      .eq("title", title)
      .eq("is_deleted", false)
      .limit(1);

    if (existingErr) throw existingErr;
    if ((existing ?? []).length > 0) continue;

    await notificationModel.create({
      user_id: recipient.id,
      type: "system",
      title,
      message: `Weekly summary: ${weeklyBookings} new bookings, ${weeklyReviews} new reviews, ${weeklyTickets} support tickets, and ${pendingProperties} pending property applications.`,
      link: "/superadmin",
    });

    created += 1;
  }

  return { created, weekStart: weekStartKey };
};
