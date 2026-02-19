-- ============================================================
-- PawStay — Complete Supabase Schema
-- Run in Supabase SQL Editor or via migration
-- ============================================================


-- ============================================================
-- 1. PROFILES  (extends Supabase Auth users)
-- ============================================================
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete restrict,
  first_name    text,
  last_name     text,
  email         text unique,
  phone         text,
  address       text,
  avatar_url    text,
  role          text not null default 'customer'
                check (role in ('customer','admin','proprietor')),

  -- Notification preferences (admin Settings page)
  notification_prefs  jsonb default '{}'::jsonb,
  /*  {
        "newBookings": true,
        "bookingReminders": true,
        "newReviews": true,
        "marketingUpdates": false
      }
  */
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
  new.raw_user_meta_data ->> 'first_name',
  split_part(new.raw_user_meta_data ->> 'full_name', ' ', 1),
  ''
),
coalesce(
  new.raw_user_meta_data ->> 'last_name',
  split_part(new.raw_user_meta_data ->> 'full_name', ' ', 2),
  ''
),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 2. PROPERTIES  (core listing info — lean table for search)
--    Maps to ListProperty Step 1 + Step 3 + computed fields.
-- ============================================================
create table if not exists properties (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references profiles(id) on delete restrict,
  status              text not null default 'pending'
                      check (status in ('pending','approved','rejected','suspended')),
  rejection_reason    text,

  -- Establishment Info  (Step 1)
  name                text not null,
  property_type       text[] not null default '{}'
                      check (property_type <@ array['hotel','grooming','veterinary']),
  address             text,
  address_line2       text,
  country             text default 'Philippines',
  city                text,
  zip_code            text,
  latitude            double precision,
  longitude           double precision,
  phone               text,
  website             text,
  description         text,
  capacity            int,

  -- Pet types  (needed for search filtering)
  pet_types_accepted  text[]   default '{}',
  dog_sizes           text[]   default '{}',
  exotic_pet_types    text,

  -- Amenities  (needed for search filtering)
  facilities_amenities text[]  default '{}',

  -- Photos  (Step 3)
  images              text[]   default '{}',
  cover_image         text,

  -- Computed / search helpers
  rating              numeric(2,1) default 0,
  review_count        int      default 0,

  is_deleted          boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Indexes for search
create index if not exists idx_properties_city
  on properties using gin (to_tsvector('simple', coalesce(city,'')));
create index if not exists idx_properties_type
  on properties using gin (property_type);
create index if not exists idx_properties_status
  on properties (status);
create index if not exists idx_properties_owner
  on properties (owner_id);
do $$
begin
  if exists (select 1 from pg_extension where extname = 'postgis') then
    execute 'create index if not exists idx_properties_location
      on properties using gist (st_makepoint(longitude, latitude))';
  else
    execute 'create index if not exists idx_properties_lat on properties (latitude)';
    execute 'create index if not exists idx_properties_lng on properties (longitude)';
  end if;
end $$;


-- ============================================================
-- 2e. AMENITIES  (admin-managed list)
-- ============================================================
create table if not exists amenities (
  id            uuid primary key default gen_random_uuid(),
  amenity       text not null unique,
  category      text,
  service_types text[] default '{}'  -- e.g. '{hotel,grooming}', '{veterinary}', '{hotel,grooming,veterinary}'
                check (service_types <@ array['hotel','grooming','veterinary']),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Join table: property ↔ amenities
create table if not exists property_amenities (
  property_id uuid not null references properties(id) on delete restrict,
  amenity_id  uuid not null references amenities(id) on delete restrict,
  created_at  timestamptz not null default now(),
  primary key (property_id, amenity_id)
);

create index if not exists idx_amenities_active on amenities(is_active);
create index if not exists idx_property_amenities_property on property_amenities(property_id);
create index if not exists idx_property_amenities_amenity on property_amenities(amenity_id);


-- ============================================================
-- 2b. PROPERTY SETUP  (1-to-1 — policies, hours, health & safety)
--     Maps to ListProperty Step 2. Loaded on detail / admin page.
-- ============================================================
create table if not exists property_setup (
  property_id         uuid primary key references properties(id) on delete restrict,

  -- Policies
  policies            jsonb    default '{}'::jsonb,
  /*  {
        "breedRestrictions": false, "breedRestrictionDetails": "",
        "aggressivePolicy": false,  "aggressivePolicyDetails": "",
        "unvaccinatedPolicy": false,"unvaccinatedPolicyDetails": ""
      }
  */

  -- Operating hours
  operating_hours     jsonb    default '{}'::jsonb,
  /*  {
        "sameHoursEveryDay": true,
        "dailyOpenTime": "08:00", "dailyCloseTime": "18:00",
        "weeklyHours": { "Monday": {"open":"08:00","close":"18:00"}, ... },
        "weekendAvailability": true, "holidayAvailability": false,
        "emergencyServices": false,
        "checkInCutoff": "15:00",
        "pickupStart": "08:00", "pickupEnd": "12:00",
        "appointmentOnly": "appointments"
      }
  */

  -- Booking rules & compliance
  booking_rules       text[]   default '{}',
  compliance          text[]   default '{}',

  -- Cancellation policy
  cancellation_policy jsonb    default '{}'::jsonb,
  /*  { "freeCancellation":"24hours", "lateFee":"₱200", "noShow":"₱500" } */

  -- Health & safety
  health_safety       text[]   default '{}',
  vet_availability    text[]   default '{}',
  sanitation_protocols text[]  default '{}',
  emergency_contact   text,
  nearest_vet_hospital text,
  emergency_response_time text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ============================================================
-- 2c. PROPERTY PRICING  (1-to-1 — all pricing & payment config)
--     Maps to ListProperty Step 4. Loaded on detail / booking page.
-- ============================================================
create table if not exists property_pricing (
  property_id         uuid primary key references properties(id) on delete restrict,

  -- Base services
  base_services       jsonb    default '[]'::jsonb,
  /*  [{"name":"Overnight Stay","priceType":"Fixed price","price":"500","duration":"24h"}] */

  -- Size-based pricing
  pet_size_pricing    jsonb    default '{}'::jsonb,
  /*  {"small":"300","medium":"400","large":"500","giant":"600","cats":"350","exotic":"450"} */

  -- Add-ons
  add_ons             jsonb    default '[]'::jsonb,
  /*  [{"name":"Flea treatment","price":"250","type":"One-time"}] */

  -- Vet fees  (veterinary properties only)
  vet_fees            jsonb    default '{}'::jsonb,
  /*  {"generalConsult":"500","vaccination":"300","emergency":"2000"} */

  -- Boarding rules
  boarding_rules      jsonb    default '{}'::jsonb,
  /*  {
        "advanceBooking":true,"sameDayBooking":false,
        "freeCancellation":true,"lateCancellationFee":false,
        "lateCancellationFeeAmount":"","vaccinationRequired":true,
        "healthDeclaration":true,"noAggressivePets":true,"liabilityWaiver":true
      }
  */

  -- Fees & charges
  fees_charges        jsonb    default '{}'::jsonb,
  /*  {
        "serviceFee":"10%","taxes":"Included","noShow":"₱300",
        "latePickup":"₱100/hr","cleaningFee":"₱200",
        "emergencyFee":"₱500","holidaySurcharge":"20%","cancellationFee":"₱250"
      }
  */

  -- Payment options
  payment_options     jsonb    default '{}'::jsonb,
  /*  {"deposit":true,"methods":["GCash","Cash","Card"],"refundPolicy":"Full refund..."} */

  pricing_notes       text,
  additional_pricing_notes text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ============================================================
-- 2d. PROPERTY LEGAL  (1-to-1 — documents & legal agreements)
--     Maps to ListProperty Step 5. Admin-only access.
-- ============================================================
create table if not exists property_legal (
  property_id         uuid primary key references properties(id) on delete restrict,

  legal_entity_type   text     check (legal_entity_type in ('individual','business','')),

  -- Contracting party
  contracting_party   jsonb    default '{}'::jsonb,
  /*  {"firstName":"","middleName":"","lastName":"","email":"","phone":"","phoneCountryCode":"+63"} */
  contracting_party_address jsonb default '{}'::jsonb,
  /*  {"country":"Philippines","streetAddress":"","addressLine2":"","city":"","postalCode":""} */

  -- Document uploads  (Supabase Storage URLs)
  lgu_permits         text[]   default '{}',
  bai_document        text,
  contract_document   text,

  -- Agreements
  legal_agreements    jsonb    default '{}'::jsonb,
  /*  {"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true} */

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ============================================================
-- 3. PETS  (user's pet profiles – MyPets page)
-- ============================================================
create table if not exists pets (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references profiles(id) on delete restrict,
  name          text not null,
  species       text not null,          -- Dog, Cat, etc.
  breed         text ,
  birthday      date not null,           -- pet's date of birth (age is calculated from this)
  weight        numeric(5,1) not null,  -- in kg
  photo_url     text,                   -- Supabase Storage URL
  notes         text,                   -- allergies, dietary needs, etc.
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_pets_owner on pets(owner_id);


-- ============================================================
-- 4. PROPERTY SERVICES  (admin-managed service catalogue per property)
-- ============================================================
create table if not exists property_services (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties(id) on delete restrict,
  name          text not null,
  description   text,
  price         numeric(10,2) not null default 0,
  category      text not null
                check (category in ('Boarding','Grooming','Veterinary','Transport','Daycare','Other')),
  is_active     boolean not null default true,
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_property_services_property on property_services(property_id);
create index if not exists idx_property_services_category on property_services(category);


-- ============================================================
-- 6. BOOKINGS  (one row per reservation)
-- ============================================================
create table if not exists bookings (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references properties(id) on delete restrict,
  user_id         uuid not null references profiles(id) on delete restrict,
  pet_id          uuid references pets(id) on delete restrict,
  service_id      uuid references property_services(id) on delete restrict,

  -- Dates & time
  checkin         date not null,
  checkout        date,                 -- null for same-day services (grooming, vet)
  time_slot       time,                 -- appointment time e.g. 09:00, 14:00

  -- Pet snapshot (in case pet profile changes later)
  pet_name        text,
  pet_type        text,                 -- Dog, Cat
  pet_breed       text,
  pet_age         text,
  pet_weight      text,
  special_requirements text,

  -- Service info
  service_name    text,
  service_type    text                  -- boarding, grooming, veterinary, daycare
                  check (service_type in ('boarding','grooming','veterinary','daycare','transport',null)),

  -- Owner contact snapshot
  owner_name      text,
  owner_email     text,
  owner_phone     text,
  emergency_contact text,

  -- Pricing
  subtotal        numeric(10,2),
  service_fee     numeric(10,2) default 0,
  total_price     numeric(10,2),

  -- Payment
  payment_method  text
                  check (payment_method in ('card','gcash','cash','bank_transfer',null)),
  payment_status  text not null default 'unpaid'
                  check (payment_status in ('unpaid','paid','refunded','partially_refunded')),
  paid_at         timestamptz,

  -- Room assignment (for hotel bookings)
  room_name       text,                 -- e.g. "Standard Room", "Luxury Suite"

  -- Status
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','checked_in','checked_out',
                                    'cancelled','completed','no_show')),
  cancellation_reason text,
  notes           text,

  is_deleted      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_bookings_property on bookings(property_id);
create index if not exists idx_bookings_user     on bookings(user_id);
create index if not exists idx_bookings_pet      on bookings(pet_id);
create index if not exists idx_bookings_dates    on bookings(checkin, checkout);
create index if not exists idx_bookings_status   on bookings(status);


-- ============================================================
-- 7. PET SERVICE HISTORY  (grooming/vet history per pet)
-- ============================================================
create table if not exists pet_service_history (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references pets(id) on delete restrict,
  booking_id    uuid references bookings(id) on delete restrict,
  service_type  text not null
                check (service_type in ('grooming','checkup','vaccination','dental','other')),
  service_name  text not null,         -- e.g. "Full Grooming Package"
  performed_at  date not null default current_date,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_pet_service_history_pet on pet_service_history(pet_id);


-- ============================================================
-- 8. REVIEWS  (with owner reply support)
-- ============================================================
create table if not exists reviews (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties(id) on delete restrict,
  user_id       uuid not null references profiles(id) on delete restrict,
  booking_id    uuid references bookings(id) on delete restrict,
  pet_name      text,                   -- snapshot from booking
  service_type  text,                   -- boarding, grooming, etc.
  rating        smallint not null check (rating between 1 and 5),
  comment       text,

  -- Owner reply
  reply         text,
  replied_at    timestamptz,

  -- Moderation
  flagged       boolean not null default false,
  flagged_reason text,

  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (booking_id)                   -- one review per booking
);

create index if not exists idx_reviews_property on reviews(property_id);
create index if not exists idx_reviews_user     on reviews(user_id);
create index if not exists idx_reviews_rating   on reviews(rating);


-- ============================================================
-- 8. FAVORITES  (user wishlists)
-- ============================================================
create table if not exists favorites (
  user_id       uuid not null references profiles(id) on delete restrict,
  property_id   uuid not null references properties(id) on delete restrict,
  created_at    timestamptz not null default now(),
  primary key (user_id, property_id)
);


-- ============================================================
-- 9. TRANSACTIONS  (platform-level payment ledger)
-- ============================================================
create table if not exists transactions (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid references bookings(id) on delete restrict,
  property_id     uuid not null references properties(id) on delete restrict,
  user_id         uuid references profiles(id) on delete restrict,

  transaction_type text not null
                   check (transaction_type in ('booking','service','refund','payout')),
  amount          numeric(10,2) not null,
  platform_fee    numeric(10,2) default 0,     -- PawStay commission
  net_amount      numeric(10,2),               -- amount - platform_fee

  status          text not null default 'pending'
                  check (status in ('pending','completed','failed','refunded')),
  payment_method  text,
  reference_id    text,                        -- external payment reference (GCash, Stripe, etc.)

  created_at      timestamptz not null default now()
);

create index if not exists idx_transactions_property on transactions(property_id);
create index if not exists idx_transactions_booking  on transactions(booking_id);
create index if not exists idx_transactions_status   on transactions(status);
create index if not exists idx_transactions_date     on transactions(created_at);


-- ============================================================
-- 10. PAYOUTS  (property owner payouts)
-- ============================================================
create table if not exists payouts (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references properties(id) on delete restrict,
  owner_id        uuid not null references profiles(id) on delete restrict,
  amount          numeric(10,2) not null,
  status          text not null default 'scheduled'
                  check (status in ('scheduled','processing','completed','failed')),
  payout_method   text,                -- GCash, Bank Transfer, etc.
  reference_id    text,                -- external payout reference
  period_start    date,                -- payout period covered
  period_end      date,
  processed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_payouts_property on payouts(property_id);
create index if not exists idx_payouts_owner    on payouts(owner_id);
create index if not exists idx_payouts_status   on payouts(status);


-- ============================================================
-- 11. SUPPORT TICKETS  (super-admin support system)
-- ============================================================
create table if not exists support_tickets (
  id              uuid primary key default gen_random_uuid(),
  ticket_number   text unique not null,         -- human-readable e.g. TKT-1234
  user_id         uuid not null references profiles(id) on delete restrict,
  subject         text not null,
  user_type       text not null default 'Customer'
                  check (user_type in ('Customer','Property')),
  priority        text not null default 'Medium'
                  check (priority in ('Low','Medium','High','Urgent')),
  status          text not null default 'Open'
                  check (status in ('Open','Pending','In Progress','Resolved','Closed')),
  is_deleted      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_tickets_user     on support_tickets(user_id);
create index if not exists idx_tickets_status   on support_tickets(status);
create index if not exists idx_tickets_priority on support_tickets(priority);

-- Auto-generate ticket number
create or replace function generate_ticket_number()
returns trigger language plpgsql as $$
declare
  next_num int;
begin
  select coalesce(max(cast(substring(ticket_number from 5) as int)), 0) + 1
  into next_num
  from support_tickets;

  new.ticket_number := 'TKT-' || lpad(next_num::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists trg_ticket_number on support_tickets;
create trigger trg_ticket_number
  before insert on support_tickets
  for each row
  when (new.ticket_number is null or new.ticket_number = '')
  execute function generate_ticket_number();


-- ============================================================
-- 12. TICKET MESSAGES  (conversation thread within a ticket)
-- ============================================================
create table if not exists ticket_messages (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references support_tickets(id) on delete restrict,
  sender_id       uuid not null references profiles(id) on delete restrict,
  message         text not null,
  is_staff        boolean not null default false,   -- true if sent by admin/superadmin
  created_at      timestamptz not null default now()
);

create index if not exists idx_ticket_messages_ticket on ticket_messages(ticket_id);

-- Auto-update ticket's updated_at when a message is posted
create or replace function update_ticket_on_message()
returns trigger language plpgsql as $$
begin
  update support_tickets
  set updated_at = now(),
      status = case
        when new.is_staff then 'Pending'    -- waiting for user reply
        else 'Open'                          -- user replied, needs attention
      end
  where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists trg_ticket_message_update on ticket_messages;
create trigger trg_ticket_message_update
  after insert on ticket_messages
  for each row execute function update_ticket_on_message();


-- ============================================================
-- 13. NOTIFICATIONS  (in-app notification feed)
-- ============================================================
create table if not exists notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete restrict,
  title           text not null,
  message         text,
  type            text not null default 'info'
                  check (type in ('info','booking','review','payment','system','support')),
  related_id      uuid,                 -- polymorphic: booking_id, review_id, ticket_id, etc.
  related_type    text,                 -- 'booking', 'review', 'ticket', 'property', etc.
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_notifications_user   on notifications(user_id);
create index if not exists idx_notifications_unread on notifications(user_id, is_read)
  where is_read = false;


-- ============================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update rating + review_count on properties
create or replace function update_property_rating()
returns trigger language plpgsql as $$
begin
  update properties
  set rating       = coalesce((select round(avg(rating),1) from reviews where property_id = coalesce(new.property_id, old.property_id)),0),
      review_count = (select count(*) from reviews where property_id = coalesce(new.property_id, old.property_id)),
      updated_at   = now()
  where id = coalesce(new.property_id, old.property_id);
  return new;
end;
$$;

drop trigger if exists trg_update_property_rating on reviews;
create trigger trg_update_property_rating
  after insert or update or delete on reviews
  for each row execute function update_property_rating();

-- Generic auto-set updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated
  before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_properties_updated on properties;
create trigger trg_properties_updated
  before update on properties
  for each row execute function set_updated_at();

drop trigger if exists trg_property_setup_updated on property_setup;
create trigger trg_property_setup_updated
  before update on property_setup
  for each row execute function set_updated_at();

drop trigger if exists trg_property_pricing_updated on property_pricing;
create trigger trg_property_pricing_updated
  before update on property_pricing
  for each row execute function set_updated_at();

drop trigger if exists trg_property_legal_updated on property_legal;
create trigger trg_property_legal_updated
  before update on property_legal
  for each row execute function set_updated_at();

drop trigger if exists trg_bookings_updated on bookings;
create trigger trg_bookings_updated
  before update on bookings
  for each row execute function set_updated_at();

drop trigger if exists trg_pets_updated on pets;
create trigger trg_pets_updated
  before update on pets
  for each row execute function set_updated_at();

drop trigger if exists trg_property_services_updated on property_services;
create trigger trg_property_services_updated
  before update on property_services
  for each row execute function set_updated_at();

drop trigger if exists trg_support_tickets_updated on support_tickets;
create trigger trg_support_tickets_updated
  before update on support_tickets
  for each row execute function set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table profiles          enable row level security;
alter table properties        enable row level security;
alter table property_setup    enable row level security;
alter table property_pricing  enable row level security;
alter table property_legal    enable row level security;
alter table amenities         enable row level security;
alter table property_amenities enable row level security;
alter table pets              enable row level security;
alter table pet_service_history enable row level security;
alter table property_services enable row level security;
alter table bookings          enable row level security;
alter table reviews           enable row level security;
alter table favorites         enable row level security;
alter table transactions      enable row level security;
alter table payouts           enable row level security;
alter table support_tickets   enable row level security;
alter table ticket_messages   enable row level security;
alter table notifications     enable row level security;


-- ── Profiles ──
create policy "Users read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins read all profiles" on profiles for select using (
  (select role from profiles where id = auth.uid()) in ('admin','superadmin')
);

-- ── Properties ──
create policy "Public read approved properties" on properties
  for select using (status = 'approved' and is_deleted = false);
create policy "Owners manage own properties"    on properties
  for all using (auth.uid() = owner_id);
create policy "Admins manage all properties"    on properties
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
  );

-- ── Amenities ──
create policy "Public read amenities" on amenities
  for select using (is_active = true);
create policy "Admins manage amenities" on amenities
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
  );

-- ── Property Amenities ──
create policy "Public read property amenities" on property_amenities
  for select using (
    exists (select 1 from properties where id = property_id and status = 'approved' and is_deleted = false)
  );
create policy "Owners manage property amenities" on property_amenities
  for all using (
    auth.uid() in (select owner_id from properties where id = property_id)
  );

-- ── Property Setup ──
create policy "Public read property setup" on property_setup
  for select using (
    exists (select 1 from properties where id = property_id and status = 'approved' and is_deleted = false)
  );
create policy "Owners manage own setup" on property_setup
  for all using (
    auth.uid() in (select owner_id from properties where id = property_id)
  );

-- ── Property Pricing ──
create policy "Public read property pricing" on property_pricing
  for select using (
    exists (select 1 from properties where id = property_id and status = 'approved' and is_deleted = false)
  );
create policy "Owners manage own pricing" on property_pricing
  for all using (
    auth.uid() in (select owner_id from properties where id = property_id)
  );

-- ── Property Legal  (owner + admin only) ──
create policy "Owners read own legal" on property_legal
  for all using (
    auth.uid() in (select owner_id from properties where id = property_id)
  );
create policy "Admins manage legal" on property_legal
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
  );

-- ── Pets ──
create policy "Users manage own pets" on pets
  for all using (auth.uid() = owner_id);

-- ── Pet Service History ──
create policy "Users read own pet history" on pet_service_history
  for select using (
    auth.uid() in (select owner_id from pets where id = pet_id)
  );
create policy "Property owners add pet history" on pet_service_history
  for insert with check (true);  -- validated at application layer

-- ── Property Services ──
create policy "Public read active services" on property_services
  for select using (is_active = true and is_deleted = false);
create policy "Owners manage own services" on property_services
  for all using (
    auth.uid() in (select owner_id from properties where id = property_id)
  );

-- ── Bookings ──
create policy "Users see own bookings" on bookings
  for select using (auth.uid() = user_id);
create policy "Owners see property bookings" on bookings
  for select using (
    auth.uid() in (select owner_id from properties where id = property_id)
  );
create policy "Users create bookings" on bookings
  for insert with check (auth.uid() = user_id);
create policy "Owners update booking status" on bookings
  for update using (
    auth.uid() in (select owner_id from properties where id = property_id)
  );

-- ── Reviews ──
create policy "Public read reviews" on reviews for select using (is_deleted = false);
create policy "Authors manage reviews" on reviews
  for all using (auth.uid() = user_id);
create policy "Owners reply to reviews" on reviews
  for update using (
    auth.uid() in (select owner_id from properties where id = property_id)
  );

-- ── Favorites ──
create policy "Users manage favorites" on favorites
  for all using (auth.uid() = user_id);

-- ── Transactions ──
create policy "Owners see own transactions" on transactions
  for select using (
    auth.uid() in (select owner_id from properties where id = property_id)
  );
create policy "Users see own transactions" on transactions
  for select using (auth.uid() = user_id);
create policy "Superadmins manage transactions" on transactions
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- ── Payouts ──
create policy "Owners see own payouts" on payouts
  for select using (auth.uid() = owner_id);
create policy "Superadmins manage payouts" on payouts
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- ── Support Tickets ──
create policy "Users manage own tickets" on support_tickets
  for all using (auth.uid() = user_id);
create policy "Superadmins manage all tickets" on support_tickets
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
  );

-- ── Ticket Messages ──
create policy "Ticket participants read messages" on ticket_messages
  for select using (
    auth.uid() in (select user_id from support_tickets where id = ticket_id)
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
  );
create policy "Users post messages to own tickets" on ticket_messages
  for insert with check (
    auth.uid() = sender_id
    and (auth.uid() in (select user_id from support_tickets where id = ticket_id)
         or exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin')))
  );

-- ── Notifications ──
create policy "Users read own notifications" on notifications
  for select using (auth.uid() = user_id);
create policy "Users update own notifications" on notifications
  for update using (auth.uid() = user_id);


-- ============================================================
-- STORAGE BUCKETS  (run separately in Supabase dashboard or via API)
-- ============================================================
-- insert into storage.buckets (id, name, public)
-- values
--   ('property-images',    'property-images',    true),
--   ('pet-photos',         'pet-photos',         true),
--   ('legal-documents',    'legal-documents',    false),
--   ('avatars',            'avatars',            true);
