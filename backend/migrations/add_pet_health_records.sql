create table if not exists public.pet_health_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  version integer not null,
  compiled_record jsonb not null,
  raw_extracted_json jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  source_file_name text,
  validation_status text not null check (validation_status in ('valid', 'incomplete', 'suspicious')),
  ocr_confidence_score numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (pet_id, version)
);

create index if not exists idx_pet_health_records_pet_owner_created
  on public.pet_health_records (pet_id, owner_id, created_at desc);
