#!/usr/bin/env python3
"""Replace the old availability block in property.service.ts"""
import os

filepath = os.path.join(os.path.dirname(__file__), "services", "property.service.ts")

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find start: line containing "Availability" and "multi-service"
start_idx = None
for i, line in enumerate(lines):
    if "Availability" in line and "multi-service" in line:
        start_idx = i
        break

if start_idx is None:
    print("ERROR: Could not find old availability block start")
    exit(1)

# Find end: the closing `}` of `if (filters.checkin) { ... }`
# We need to track brace depth starting from the `if (filters.checkin) {` line
brace_start = None
for i in range(start_idx, len(lines)):
    if "if (filters.checkin)" in lines[i]:
        brace_start = i
        break

if brace_start is None:
    print("ERROR: Could not find 'if (filters.checkin)' line")
    exit(1)

depth = 0
end_idx = None
for i in range(brace_start, len(lines)):
    depth += lines[i].count("{") - lines[i].count("}")
    if depth == 0:
        end_idx = i + 1  # exclusive
        break

if end_idx is None:
    print("ERROR: Could not find closing brace")
    exit(1)

print(f"Old block: lines {start_idx+1}-{end_idx} (0-indexed {start_idx}-{end_idx-1})")
print(f"Removing {end_idx - start_idx} lines")

new_block = r"""  // -- Availability filter --
  //
  // BOARDING (hotel): checkin + checkout present
  //   property_services.capacity = per-room-type capacity
  //   Check overlapping bookings per night; busiest night must be < capacity
  //   Property available if >= 1 boarding service has room on every night
  //
  // GROOMING / VET (appointment): only checkin present (no checkout)
  //   properties.capacity = total concurrent slots (staff/chairs)
  //   Count active bookings on that date (optionally scoped by timeSlot)
  //   Property available if total bookings < property.capacity
  //
  if (filters.checkin) {
    const checkin = filters.checkin;
    const checkout = filters.checkout;          // undefined for appointments
    const serviceCategory = filters.serviceCategory;

    const isBoarding = !!checkout;              // has checkout = overnight

    if (isBoarding) {
      // === BOARDING: per-service capacity ===

      // 1. Get boarding services with their capacity
      let svcQuery = supabaseAdmin
        .from("property_services")
        .select("id, property_id, capacity, category")
        .eq("is_active", true)
        .eq("is_deleted", false);

      if (serviceCategory) {
        svcQuery = svcQuery.eq("category", serviceCategory);
      } else {
        svcQuery = svcQuery.eq("category", "Boarding");
      }

      const { data: services, error: svcErr } = await svcQuery;
      if (svcErr) throw svcErr;
      if (!services?.length) return [];

      const serviceIds = services.map(s => s.id);

      // 2. Fetch ALL overlapping active bookings for those services
      const { data: bookings, error: bookErr } = await supabaseAdmin
        .from("bookings")
        .select("service_id, checkin, checkout")
        .in("service_id", serviceIds)
        .eq("is_deleted", false)
        .in("status", ["pending", "confirmed", "checked_in"])
        .lt("checkin", checkout)       // booking starts before our checkout
        .gt("checkout", checkin);      // booking ends after our checkin

      if (bookErr) throw bookErr;

      // 3. Build every night in the requested range
      const nights: string[] = [];
      {
        const cur = new Date(checkin);
        const end = new Date(checkout);
        while (cur < end) {
          nights.push(cur.toISOString().slice(0, 10));
          cur.setDate(cur.getDate() + 1);
        }
      }

      // 4. For each service, find the busiest night and check capacity
      const availablePropertyIds = new Set<string>();

      for (const svc of services) {
        const capacity = svc.capacity ?? 1;
        const svcBookings = (bookings ?? []).filter(
          (b: any) => b.service_id === svc.id
        );

        let full = false;
        for (const night of nights) {
          const nightStart = night;
          const nextDay = new Date(night);
          nextDay.setDate(nextDay.getDate() + 1);
          const nightEnd = nextDay.toISOString().slice(0, 10);

          // A booking occupies this night when:
          //   booking.checkin < nightEnd AND booking.checkout > nightStart
          const count = svcBookings.filter(
            (b: any) => b.checkin < nightEnd && b.checkout > nightStart
          ).length;

          if (count >= capacity) { full = true; break; }
        }

        if (!full) {
          availablePropertyIds.add(String(svc.property_id));
        }
      }

      if (availablePropertyIds.size === 0) return [];
      query = query.in("id", [...availablePropertyIds]);

    } else {
      // === GROOMING / VET: property-level capacity ===

      // 1. Count active appointment bookings per property on the date
      let bookingQuery = supabaseAdmin
        .from("bookings")
        .select("property_id")
        .eq("checkin", checkin)
        .eq("is_deleted", false)
        .in("status", ["pending", "confirmed", "checked_in"]);

      // Appointments have no checkout
      bookingQuery = bookingQuery.is("checkout", null);

      // Optionally narrow by time slot
      if (filters.timeSlot) {
        bookingQuery = bookingQuery.eq("time_slot", filters.timeSlot);
      }

      const { data: dayBookings, error: dayErr } = await bookingQuery;
      if (dayErr) throw dayErr;

      // 2. Tally bookings per property
      const countByProp: Record<string, number> = {};
      for (const b of dayBookings ?? []) {
        const pid = String(b.property_id);
        countByProp[pid] = (countByProp[pid] || 0) + 1;
      }

      // 3. Fetch candidate properties with their capacity column
      const { data: allProps, error: propErr } = await supabaseAdmin
        .from("properties")
        .select("id, capacity")
        .eq("status", "approved")
        .eq("is_deleted", false);

      if (propErr) throw propErr;

      const availablePropertyIds = (allProps ?? [])
        .filter((p: any) => {
          const cap = p.capacity ?? 1;           // default 1 if unset
          const booked = countByProp[String(p.id)] || 0;
          return booked < cap;
        })
        .map((p: any) => String(p.id));

      if (availablePropertyIds.length === 0) return [];
      query = query.in("id", availablePropertyIds);
    }
  }
"""

before = lines[:start_idx]
after = lines[end_idx:]

result = before + [new_block + "\n"] + after

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(result)

# Verify
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

total = content.count("\n")
has_boarding = "BOARDING" in content
has_grooming = "GROOMING" in content
has_old = "multi-service aware" in content

print(f"Done! Total lines: {total}")
print(f"Has BOARDING: {has_boarding}")
print(f"Has GROOMING: {has_grooming}")
print(f"Has old 'multi-service aware': {has_old}")

if has_boarding and has_grooming and not has_old:
    print("SUCCESS - replacement verified!")
else:
    print("WARNING - something may be wrong")
