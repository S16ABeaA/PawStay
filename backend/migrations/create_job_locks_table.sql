-- ============================================================
-- JOB LOCKS TABLE  (distributed background-job coordination)
-- ============================================================
-- Prevents duplicate execution of scheduled background jobs
-- when multiple server instances run simultaneously.
-- The backend service role bypasses RLS, so no policies are needed.
-- ============================================================

create table if not exists job_locks (
  job_name    text        primary key,
  locked_at   timestamptz not null default now(),
  instance_id text        not null,
  token       uuid        not null
);
