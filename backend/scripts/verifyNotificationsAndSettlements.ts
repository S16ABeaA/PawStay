import type { Request } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";
import {
  dispatchSettlementRemindersJob,
  getProprietorMonthlyStatus,
  getReceivableSummary,
  submitProprietorSettlement,
  updateSettlementStatus,
} from "../controllers/settlementController";
import {
  dispatchBookingLifecycleNotificationsJob,
  dispatchWeeklyReportNotificationsJob,
} from "../services/notificationJobs";

const createMockRes = () => {
  const store: any = {
    statusCode: 200,
    body: null as any,
    status(code: number) {
      store.statusCode = code;
      return store;
    },
    json(payload: any) {
      store.body = payload;
      return store;
    },
  };
  return store;
};

const asReq = (payload: Record<string, any>) => payload as unknown as Request;

const logSection = (title: string) => {
  console.log("\n=== " + title + " ===");
};

(async () => {
  try {
    logSection("Notification Jobs");
    const settlementDryRun = await dispatchSettlementRemindersJob({ dryRun: true });
    console.log("Settlement reminders (dry-run):", settlementDryRun);

    const bookingJob = await dispatchBookingLifecycleNotificationsJob();
    console.log("Booking lifecycle job:", bookingJob);

    const weeklyJob = await dispatchWeeklyReportNotificationsJob();
    console.log("Weekly report job:", weeklyJob);

    logSection("Locating Test Property With Outstanding Balance");
    const { data: receivableRow, error: receivableErr } = await supabaseAdmin
      .from("mv_monthly_receivables")
      .select("property_id, proprietor_id, outstanding, month")
      .gt("outstanding", 20)
      .limit(1)
      .single();

    if (receivableErr) throw receivableErr;
    if (!receivableRow) throw new Error("No receivable row found with outstanding > 20");

    const propertyId = receivableRow.property_id;
    const proprietorId = receivableRow.proprietor_id;

    const { data: property, error: propertyErr } = await supabaseAdmin
      .from("properties")
      .select("id, name")
      .eq("id", propertyId)
      .single();

    if (propertyErr) throw propertyErr;

    console.log("Testing property:", property?.name || propertyId, "(Owner:", proprietorId, ")");

    const proprietorReqBase = { user: { id: proprietorId }, query: { propertyId } };

    const proprietorResBefore = createMockRes();
    await getProprietorMonthlyStatus(asReq(proprietorReqBase), proprietorResBefore);
    console.log("Proprietor summary BEFORE:", proprietorResBefore.body);

    const receivableSummaryBefore = createMockRes();
    await getReceivableSummary(asReq({}), receivableSummaryBefore);
    console.log("Superadmin summary BEFORE:", receivableSummaryBefore.body);

    const suggestedAmount = Math.max(10, Math.min(100, Math.floor((receivableRow.outstanding || 0) / 2)));
    console.log("Submitting settlement amount:", suggestedAmount);

    const submitReq = asReq({
      body: {
        propertyId,
        amount: String(suggestedAmount),
        method: "gcash",
        referenceNo: `AUTO-${Date.now()}`,
        notes: "Automated verification run",
      },
      user: { id: proprietorId, role: "proprietor" },
    });

    const submitRes = createMockRes();
    await submitProprietorSettlement(submitReq, submitRes);
    console.log("Submit settlement status:", submitRes.statusCode);
    if (submitRes.statusCode !== 201) {
      console.error("Submit error payload:", submitRes.body);
      throw new Error("Submit settlement failed");
    }

    const settlementId = submitRes.body?.settlement?.id as string;
    console.log("Created settlement ID:", settlementId);

    const { data: submissionNotif, error: submissionNotifErr } = await supabaseAdmin
      .from("notifications")
      .select("id, user_id, title, message, created_at")
      .eq("reference_id", settlementId)
      .eq("reference_type", "settlement")
      .order("created_at", { ascending: false })
      .limit(1);

    if (submissionNotifErr) throw submissionNotifErr;
    console.log("Most recent superadmin notification for submission:", submissionNotif?.[0]);

    const { data: superAdminProfile, error: superAdminErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "super_admin")
      .limit(1)
      .single();
    if (superAdminErr) throw superAdminErr;

    const updateReq = asReq({
      params: { id: settlementId },
      body: { status: "completed" },
      user: { id: superAdminProfile.id, role: "super_admin" },
    });
    const updateRes = createMockRes();
    await updateSettlementStatus(updateReq, updateRes);
    console.log("Update settlement status response:", updateRes.statusCode);

    const { data: proprietorNotif, error: proprietorNotifErr } = await supabaseAdmin
      .from("notifications")
      .select("id, user_id, title, message, created_at")
      .eq("reference_id", propertyId)
      .eq("type", "payment_received")
      .order("created_at", { ascending: false })
      .limit(1);
    if (proprietorNotifErr) throw proprietorNotifErr;
    console.log("Proprietor confirmation notification:", proprietorNotif?.[0]);

    const proprietorResAfter = createMockRes();
    await getProprietorMonthlyStatus(asReq(proprietorReqBase), proprietorResAfter);
    console.log("Proprietor summary AFTER:", proprietorResAfter.body);

    const receivableSummaryAfter = createMockRes();
    await getReceivableSummary(asReq({}), receivableSummaryAfter);
    console.log("Superadmin summary AFTER:", receivableSummaryAfter.body);
  } catch (err) {
    console.error("Verification script failed:", err);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
})();
