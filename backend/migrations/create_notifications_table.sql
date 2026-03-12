-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,

  -- Notification type enum
  type          text not null default 'info'
                check (type in (
                  'booking_confirmed',
                  'booking_cancelled',
                  'booking_reminder',
                  'booking_completed',
                  'payment_received',
                  'property_approved',
                  'property_rejected',
                  'review_received',
                  'system',
                  'info'
                )),

  title         text not null,
  message       text not null,

  -- Optional link to navigate to when clicked
  link          text,

  -- Optional reference to a related entity
  reference_id  uuid,
  reference_type text check (reference_type in ('booking', 'property', 'review', null)),

  is_read       boolean not null default false,
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Indexes
create index if not exists idx_notifications_user
  on notifications (user_id);
create index if not exists idx_notifications_user_unread
  on notifications (user_id) where is_read = false and is_deleted = false;
create index if not exists idx_notifications_created
  on notifications (created_at desc);

-- Helper function: create a notification for a user
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text default null,
  p_reference_id uuid default null,
  p_reference_type text default null
) returns uuid language plpgsql security definer as $$
declare
  v_id uuid;
begin
  insert into notifications (user_id, type, title, message, link, reference_id, reference_type)
  values (p_user_id, p_type, p_title, p_message, p_link, p_reference_id, p_reference_type)
  returning id into v_id;
  return v_id;
end;
$$;
