import { supabaseAdmin } from "../config/supabaseAdmin";
import { notificationModel } from "../models/notificationModel";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type Priority = "reminder" | "alert" | "urgent";

const toDate = (value: string | null | undefined): Date | null => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysSince = (date: Date): number => Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);

const ageYearsFromBirthday = (birthday: string | null | undefined): number | null => {
  const d = toDate(birthday);
  if (!d) return null;
  return (Date.now() - d.getTime()) / (365.25 * MS_PER_DAY);
};

const toPhpDate = (d: Date): string => d.toISOString().slice(0, 10);

const getPriorityByOverdueRatio = (ratio: number): Priority => {
  if (ratio >= 1.5) return "urgent";
  if (ratio >= 1.25) return "alert";
  return "reminder";
};

const shouldSendByCooldown = async (
  petId: string,
  ownerId: string,
  key: string,
  priority: Priority,
): Promise<boolean> => {
  const { data, error } = await supabaseAdmin
    .from("pet_notifications")
    .select("id, sent_at, priority, snooze_until")
    .eq("pet_id", petId)
    .eq("owner_id", ownerId)
    .eq("notification_key", key)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return true;

  const snoozeUntil = toDate((data as any).snooze_until);
  if (snoozeUntil && snoozeUntil.getTime() > Date.now()) {
    return false;
  }

  const sentAt = toDate((data as any).sent_at);
  if (!sentAt) return true;

  const sameOrHigherPriorityBefore = ((data as any).priority || "reminder") === priority ||
    (((data as any).priority || "reminder") === "urgent") ||
    (((data as any).priority || "reminder") === "alert" && priority === "reminder");

  const cooldownDays = daysSince(sentAt);
  if (cooldownDays >= 7) return true;
  if (!sameOrHigherPriorityBefore) return true;
  return false;
};

const logPetNotification = async (input: {
  petId: string;
  ownerId: string;
  key: string;
  type: string;
  priority: Priority;
  reason: string;
  deepLink: string;
}) => {
  const { error } = await supabaseAdmin
    .from("pet_notifications")
    .insert({
      pet_id: input.petId,
      owner_id: input.ownerId,
      notification_key: input.key,
      notification_type: input.type,
      priority: input.priority,
      reason: input.reason,
      deep_link: input.deepLink,
    });

  if (error && !/duplicate key/i.test(String(error.message || ""))) {
    throw error;
  }
};

const getBenchmark = async (species: string, breed: string) => {
  const speciesName = String(species || "Dog");
  const exactBreed = String(breed || "Mixed").trim();

  const { data: exact } = await supabaseAdmin
    .from("breed_benchmarks")
    .select("*")
    .eq("species", speciesName)
    .eq("breed", exactBreed)
    .eq("is_active", true)
    .maybeSingle();

  if (exact) return exact as any;

  const { data: mixed } = await supabaseAdmin
    .from("breed_benchmarks")
    .select("*")
    .eq("species", speciesName)
    .eq("breed", "Mixed")
    .eq("is_active", true)
    .maybeSingle();

  return (mixed as any) || {
    vet_visit_interval_days: 365,
    grooming_interval_days: 56,
    senior_age_years: speciesName.toLowerCase() === "cat" ? 10 : 7,
    health_risk_notes: "Routine preventive health checks are recommended.",
    vaccine_schedule_notes: "Follow local annual booster guidance.",
  };
};

export const dispatchPetCareNotificationsJob = async () => {
  const { data: pets, error: petsErr } = await supabaseAdmin
    .from("pets")
    .select("id, owner_id, name, species, breed, birthday, is_deleted")
    .eq("is_deleted", false)
    .limit(100000);

  if (petsErr) throw petsErr;

  let created = 0;

  for (const pet of pets ?? []) {
    created += await dispatchPetCareNotificationsForPet(pet.id, pet.owner_id);
  }

  return { created };
};

export const clearPetCareNotificationsForPet = async (petId: string, ownerId: string) => {
  const { error: historyErr } = await supabaseAdmin
    .from("pet_notifications")
    .delete()
    .eq("pet_id", petId)
    .eq("owner_id", ownerId);

  if (historyErr) throw historyErr;

  const { error: notifErr } = await supabaseAdmin
    .from("notifications")
    .update({ is_deleted: true })
    .eq("user_id", ownerId)
    .eq("reference_type", "pet")
    .eq("reference_id", petId)
    .eq("is_deleted", false);

  if (notifErr) throw notifErr;
};

export const dispatchPetCareNotificationsForPet = async (petId: string, ownerId: string): Promise<number> => {
  const { data: pet, error: petErr } = await supabaseAdmin
    .from("pets")
    .select("id, owner_id, name, species, breed, birthday, is_deleted")
    .eq("id", petId)
    .eq("owner_id", ownerId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (petErr) throw petErr;
  if (!pet) return 0;

  let created = 0;

    const benchmark = await getBenchmark(pet.species, pet.breed);

    const { data: history } = await supabaseAdmin
      .from("pet_service_history")
      .select("service_type, performed_at")
      .eq("pet_id", pet.id)
      .order("performed_at", { ascending: false })
      .limit(200);

    const lastVet = (history ?? []).find((h: any) => ["checkup", "vaccination", "other"].includes(String(h.service_type || "").toLowerCase()));
    const lastGrooming = (history ?? []).find((h: any) => String(h.service_type || "").toLowerCase() === "grooming");

    const { data: latestRecord } = await supabaseAdmin
      .from("pet_health_records")
      .select("raw_extracted_json")
      .eq("pet_id", pet.id)
      .eq("owner_id", pet.owner_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const profileRes = await supabaseAdmin
      .from("profiles")
      .select("address")
      .eq("id", pet.owner_id)
      .maybeSingle();

    const ownerAddress = String(profileRes.data?.address || "").trim();
    const today = toPhpDate(new Date());
    const locationParam = ownerAddress ? `&location=${encodeURIComponent(ownerAddress)}` : "";

    const vetInterval = Number(benchmark.vet_visit_interval_days || 365);
    if (lastVet?.performed_at) {
      const days = daysSince(new Date(lastVet.performed_at));
      if (days >= vetInterval) {
        const ratio = days / vetInterval;
        const priority = getPriorityByOverdueRatio(ratio);
        const key = `vet-overdue-${priority}`;
        if (await shouldSendByCooldown(pet.id, pet.owner_id, key, priority)) {
          const reason = `${pet.name} hasn't had a vet visit in ${days} days. It's recommended to schedule a check to ensure they're healthy.`;
          const deepLink = `/veterinary?date=${today}${locationParam}&petId=${encodeURIComponent(pet.id)}`;
          await notificationModel.create({
            user_id: pet.owner_id,
            type: "system",
            title: `${priority === "urgent" ? "Urgent" : priority === "alert" ? "Alert" : "Reminder"}: ${pet.name} — it's been ${days} days since their last vet visit`,
            message: `${reason} Book now: ${deepLink}`,
            link: deepLink,
            reference_id: pet.id,
            reference_type: "pet",
          });
          await logPetNotification({
            petId: pet.id,
            ownerId: pet.owner_id,
            key,
            type: "vet_visit_overdue",
            priority,
            reason,
            deepLink,
          });
          created += 1;
        }
      }
    }

    const groomingInterval = Number(benchmark.grooming_interval_days || 56);
    if (lastGrooming?.performed_at) {
      const days = daysSince(new Date(lastGrooming.performed_at));
      if (days >= groomingInterval) {
        const ratio = days / groomingInterval;
        const priority = getPriorityByOverdueRatio(ratio);
        const key = `groom-overdue-${priority}`;
        if (await shouldSendByCooldown(pet.id, pet.owner_id, key, priority)) {
          const reason = `${pet.name} hasn't been groomed in ${days} days. Regular grooming helps maintain coat and skin health.`;
          const deepLink = `/grooming?date=${today}${locationParam}&petId=${encodeURIComponent(pet.id)}`;
          await notificationModel.create({
            user_id: pet.owner_id,
            type: "system",
            title: `${priority === "urgent" ? "Urgent" : priority === "alert" ? "Alert" : "Reminder"}: Grooming needed for ${pet.name}`,
            message: `${reason} Book now: ${deepLink}`,
            link: deepLink,
            reference_id: pet.id,
            reference_type: "pet",
          });
          await logPetNotification({
            petId: pet.id,
            ownerId: pet.owner_id,
            key,
            type: "grooming_overdue",
            priority,
            reason,
            deepLink,
          });
          created += 1;
        }
      }
    }

    const vaccines = (((latestRecord as any)?.raw_extracted_json as any)?.extracted?.structured?.vaccines || []) as Array<any>;
    for (const vaccine of vaccines) {
      const due = toDate(vaccine?.next_due_date || null);
      if (!due) continue;
      const daysUntilDue = Math.floor((due.getTime() - Date.now()) / MS_PER_DAY);
      if (daysUntilDue <= 30) {
        const priority: Priority = daysUntilDue < 0 ? "alert" : "reminder";
        const key = `vaccine-${String(vaccine?.name || "unknown").toLowerCase().replace(/\s+/g, "-")}-${toPhpDate(due)}`;
        if (await shouldSendByCooldown(pet.id, pet.owner_id, key, priority)) {
          const reason = daysUntilDue < 0
            ? `${pet.name}'s ${vaccine?.name || "vaccine"} is overdue. Please schedule soon.`
            : `${pet.name}'s ${vaccine?.name || "vaccine"} is due on ${toPhpDate(due)}.`;
          const deepLink = `/veterinary?date=${toPhpDate(due)}${locationParam}`;
          await notificationModel.create({
            user_id: pet.owner_id,
            type: "system",
            title: `${priority === "alert" ? "Alert" : "Reminder"}: Vaccine due for ${pet.name}`,
            message: reason,
            link: deepLink,
            reference_id: pet.id,
            reference_type: "pet",
          });
          await logPetNotification({
            petId: pet.id,
            ownerId: pet.owner_id,
            key,
            type: "vaccine_due",
            priority,
            reason,
            deepLink,
          });
          created += 1;
        }
      }
    }

  const ageYears = ageYearsFromBirthday(pet.birthday);
  const seniorAge = Number(benchmark.senior_age_years || 7);
  if (ageYears !== null && ageYears >= seniorAge - 0.2 && ageYears < seniorAge + 0.5) {
    const key = `senior-milestone-${Math.floor(ageYears)}`;
    if (await shouldSendByCooldown(pet.id, pet.owner_id, key, "reminder")) {
      const reason = `${pet.name} is approaching the senior life stage. Consider updating care and screening routines.`;
      const deepLink = `/my-pets`;
      await notificationModel.create({
        user_id: pet.owner_id,
        type: "system",
        title: `Reminder: ${pet.name} is entering senior stage`,
        message: reason,
        link: deepLink,
        reference_id: pet.id,
        reference_type: "pet",
      });
      await logPetNotification({
        petId: pet.id,
        ownerId: pet.owner_id,
        key,
        type: "wellness_milestone",
        priority: "reminder",
        reason,
        deepLink,
      });
      created += 1;
    }
  }

  return created;
};
