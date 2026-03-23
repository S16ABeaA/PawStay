-- Extensions
create extension if not exists pgcrypto;
create extension if not exists vector;

-- Trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- owns_pet only (chat_sessions doesn't exist yet)
create or replace function public.owns_pet(p_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  -- auth.uid() is safe here: Supabase injects it per request via JWT
  select exists (
    select 1
    from public.pets p
    where p.id        = p_pet_id
      and p.owner_id  = auth.uid()
      and coalesce(p.is_deleted, false) = false
  );
$$;

create table if not exists public.pet_health_summaries (
  id             uuid        primary key default gen_random_uuid(),
  pet_id         uuid        not null references public.pets(id) on delete restrict,
  source_type    text        not null check (source_type in ('image', 'medical_record', 'manual')),
  file_url       text,
  extracted_data jsonb       not null default '{}'::jsonb,
  -- shape: { weight_kg, conditions, medications, diet_notes, vet_notes, next_vet_date }
  created_at     timestamptz not null default now()
);

create table if not exists public.pet_embeddings (
  id           uuid        primary key default gen_random_uuid(),
  pet_id       uuid        not null references public.pets(id) on delete restrict,
  source_id    uuid,
  source_table text        check (source_table in (
                              'pet_health_summaries',
                              'pet_service_history',
                              'pet_recommendations'
                            )),
  content      text        not null,
  embedding    vector(768),
  created_at   timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references public.profiles(id) on delete restrict,
  pet_id              uuid        not null references public.pets(id) on delete restrict,
  title               text,
  summary             text,
  last_summarized_at  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id         uuid        primary key default gen_random_uuid(),
  session_id uuid        not null references public.chat_sessions(id) on delete cascade,
  pet_id     uuid        not null references public.pets(id) on delete restrict,
  role       text        not null check (role in ('user', 'assistant', 'system')),
  content    text        not null,
  metadata   jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pet_recommendations (
  id                  uuid         primary key default gen_random_uuid(),
  pet_id              uuid         not null references public.pets(id) on delete restrict,
  session_id          uuid         references public.chat_sessions(id) on delete set null,
  recommendation_type text         not null check (
                                     recommendation_type in (
                                       'diet', 'medication_followup', 'exercise',
                                       'grooming', 'vet_visit', 'general'
                                     )
                                   ),
  content             text         not null,
  rationale           text,
  confidence          numeric(4,3) check (confidence is null or (confidence between 0 and 1)),
  model               text         not null,
  model_version       text,
  based_on_ids        jsonb        not null default '[]'::jsonb,
  disclaimer          text         not null default
                                     'AI-generated guidance; not a substitute for professional veterinary advice.',
  expires_at          timestamptz,
  status              text         not null default 'active'
                                     check (status in ('active', 'superseded', 'revoked', 'expired')),
  revoked_at          timestamptz,
  revoked_reason      text,
  metadata            jsonb        not null default '{}'::jsonb,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now()
);


-- owns_chat_session (now safe — chat_sessions exists)
create or replace function public.owns_chat_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  -- auth.uid() is safe here: Supabase injects it per request via JWT
  select exists (
    select 1
    from public.chat_sessions s
    where s.id      = p_session_id
      and s.user_id = auth.uid()
  );
$$;

-- Composite unique constraint on chat_sessions (needed before chat_messages FK)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'uq_chat_sessions_id_pet'
  ) then
    alter table public.chat_sessions
      add constraint uq_chat_sessions_id_pet unique (id, pet_id);
  end if;
end $$;

-- Composite FK on chat_messages enforcing message pet == session pet
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fk_chat_messages_session_pet'
  ) then
    alter table public.chat_messages
      add constraint fk_chat_messages_session_pet
      foreign key (session_id, pet_id)
      references public.chat_sessions(id, pet_id)
      on delete cascade;
  end if;
end $$;

-- Triggers
drop trigger if exists set_updated_at_chat_sessions on public.chat_sessions;
create trigger set_updated_at_chat_sessions
  before update on public.chat_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_pet_recommendations on public.pet_recommendations;
create trigger set_updated_at_pet_recommendations
  before update on public.pet_recommendations
  for each row execute function public.set_updated_at();

-- RLS enable
alter table public.pet_health_summaries  enable row level security;
alter table public.pet_embeddings        enable row level security;
alter table public.chat_sessions         enable row level security;
alter table public.chat_messages         enable row level security;
alter table public.pet_recommendations   enable row level security;

-- Drop old policies (safe)
drop policy if exists "health summaries: own pets only"  on public.pet_health_summaries;
drop policy if exists "embeddings: own pets only"        on public.pet_embeddings;
drop policy if exists "chat sessions: own sessions"      on public.chat_sessions;
drop policy if exists "chat messages: own sessions only" on public.chat_messages;

drop policy if exists pet_health_summaries_select_own     on public.pet_health_summaries;
drop policy if exists pet_health_summaries_insert_own     on public.pet_health_summaries;
drop policy if exists pet_health_summaries_insert_service on public.pet_health_summaries;
drop policy if exists pet_health_summaries_update_own     on public.pet_health_summaries;
drop policy if exists pet_health_summaries_delete_own     on public.pet_health_summaries;

drop policy if exists pet_embeddings_select_own     on public.pet_embeddings;
drop policy if exists pet_embeddings_insert_own     on public.pet_embeddings;
drop policy if exists pet_embeddings_insert_service on public.pet_embeddings;
drop policy if exists pet_embeddings_update_own     on public.pet_embeddings;
drop policy if exists pet_embeddings_delete_own     on public.pet_embeddings;

drop policy if exists chat_sessions_select_own     on public.chat_sessions;
drop policy if exists chat_sessions_insert_own     on public.chat_sessions;
drop policy if exists chat_sessions_insert_service on public.chat_sessions;
drop policy if exists chat_sessions_update_own     on public.chat_sessions;
drop policy if exists chat_sessions_delete_own     on public.chat_sessions;

drop policy if exists chat_messages_select_own     on public.chat_messages;
drop policy if exists chat_messages_insert_own     on public.chat_messages;
drop policy if exists chat_messages_insert_service on public.chat_messages;
drop policy if exists chat_messages_update_own     on public.chat_messages;
drop policy if exists chat_messages_delete_own     on public.chat_messages;

drop policy if exists pet_recommendations_select_own     on public.pet_recommendations;
drop policy if exists pet_recommendations_insert_own     on public.pet_recommendations;
drop policy if exists pet_recommendations_insert_service on public.pet_recommendations;
drop policy if exists pet_recommendations_update_own     on public.pet_recommendations;
drop policy if exists pet_recommendations_delete_own     on public.pet_recommendations;

-- RLS policies

-- pet_health_summaries
create policy pet_health_summaries_select_own
  on public.pet_health_summaries for select
  using (public.owns_pet(pet_id));

create policy pet_health_summaries_insert_own
  on public.pet_health_summaries for insert
  with check (public.owns_pet(pet_id));

create policy pet_health_summaries_insert_service
  on public.pet_health_summaries for insert
  to service_role
  with check (true);

create policy pet_health_summaries_update_own
  on public.pet_health_summaries for update
  using  (public.owns_pet(pet_id))
  with check (public.owns_pet(pet_id));

create policy pet_health_summaries_delete_own
  on public.pet_health_summaries for delete
  using (public.owns_pet(pet_id));

-- pet_embeddings
create policy pet_embeddings_select_own
  on public.pet_embeddings for select
  using (public.owns_pet(pet_id));

create policy pet_embeddings_insert_own
  on public.pet_embeddings for insert
  with check (public.owns_pet(pet_id));

create policy pet_embeddings_insert_service
  on public.pet_embeddings for insert
  to service_role
  with check (true);

create policy pet_embeddings_update_own
  on public.pet_embeddings for update
  using  (public.owns_pet(pet_id))
  with check (public.owns_pet(pet_id));

create policy pet_embeddings_delete_own
  on public.pet_embeddings for delete
  using (public.owns_pet(pet_id));

-- chat_sessions
create policy chat_sessions_select_own
  on public.chat_sessions for select
  using (user_id = auth.uid());

create policy chat_sessions_insert_own
  on public.chat_sessions for insert
  with check (user_id = auth.uid() and public.owns_pet(pet_id));

create policy chat_sessions_insert_service
  on public.chat_sessions for insert
  to service_role
  with check (true);

create policy chat_sessions_update_own
  on public.chat_sessions for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid() and public.owns_pet(pet_id));

create policy chat_sessions_delete_own
  on public.chat_sessions for delete
  using (user_id = auth.uid());

-- chat_messages
create policy chat_messages_select_own
  on public.chat_messages for select
  using (public.owns_chat_session(session_id) and public.owns_pet(pet_id));

create policy chat_messages_insert_own
  on public.chat_messages for insert
  with check (public.owns_chat_session(session_id) and public.owns_pet(pet_id));

create policy chat_messages_insert_service
  on public.chat_messages for insert
  to service_role
  with check (true);

create policy chat_messages_update_own
  on public.chat_messages for update
  using  (public.owns_chat_session(session_id) and public.owns_pet(pet_id))
  with check (public.owns_chat_session(session_id) and public.owns_pet(pet_id));

create policy chat_messages_delete_own
  on public.chat_messages for delete
  using (public.owns_chat_session(session_id) and public.owns_pet(pet_id));

-- pet_recommendations
create policy pet_recommendations_select_own
  on public.pet_recommendations for select
  using (public.owns_pet(pet_id));

create policy pet_recommendations_insert_own
  on public.pet_recommendations for insert
  with check (
    public.owns_pet(pet_id)
    and (session_id is null or public.owns_chat_session(session_id))
  );

create policy pet_recommendations_insert_service
  on public.pet_recommendations for insert
  to service_role
  with check (true);

create policy pet_recommendations_update_own
  on public.pet_recommendations for update
  using  (public.owns_pet(pet_id))
  with check (
    public.owns_pet(pet_id)
    and (session_id is null or public.owns_chat_session(session_id))
  );

create policy pet_recommendations_delete_own
  on public.pet_recommendations for delete
  using (public.owns_pet(pet_id));

-- Indexes
create unique index if not exists idx_pet_embeddings_unique
  on public.pet_embeddings(pet_id, source_id, source_table)
  where source_id is not null and source_table is not null;

drop index if exists idx_chat_messages_session;

create index if not exists idx_chat_messages_session_desc
  on public.chat_messages(session_id, created_at desc);

create index if not exists idx_pet_recommendations_expiry
  on public.pet_recommendations(expires_at)
  where status = 'active' and expires_at is not null;

create index if not exists idx_pet_recommendations_based_on
  on public.pet_recommendations using gin (based_on_ids);

-- chat_sessions summary default
alter table public.chat_sessions
  alter column summary set default '';

update public.chat_sessions
  set summary = ''
  where summary is null;

-- supersedes_id on pet_recommendations
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'pet_recommendations'
      and column_name  = 'supersedes_id'
  ) then
    alter table public.pet_recommendations
      add column supersedes_id uuid
        references public.pet_recommendations(id)
        on delete set null;
  end if;
end $$;

create index if not exists idx_pet_recommendations_supersedes
  on public.pet_recommendations(supersedes_id)
  where supersedes_id is not null;

-- supersede trigger (BEFORE INSERT so new.supersedes_id can be set)
create or replace function public.supersede_previous_recommendations()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_old_id uuid;
begin
  select id into v_old_id
  from public.pet_recommendations
  where pet_id              = new.pet_id
    and recommendation_type = new.recommendation_type
    and status              = 'active'
    and id                 != new.id
  order by created_at desc
  limit 1;

  if v_old_id is not null then
    update public.pet_recommendations
      set status     = 'superseded',
          updated_at = now()
    where id = v_old_id;

    new.supersedes_id = v_old_id;
  end if;

  return new;
end;
$$;

drop trigger if exists supersede_on_new_recommendation on public.pet_recommendations;
create trigger supersede_on_new_recommendation
  before insert on public.pet_recommendations
  for each row execute function public.supersede_previous_recommendations();

-- get_pet_context (final version)
create or replace function public.get_pet_context(
  p_pet_id               uuid,
  p_session_id           uuid  default null,
  p_message_limit        int   default 10,
  p_health_limit         int   default 5,
  p_service_limit        int   default 5,
  p_recommendation_limit int   default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
-- NOTE: auth.uid() is safe here: Supabase injects it per request via JWT
declare
  v_result jsonb;
begin
  if not public.owns_pet(p_pet_id) then
    raise exception 'unauthorized';
  end if;

  if p_session_id is not null and not public.owns_chat_session(p_session_id) then
    raise exception 'unauthorized_session';
  end if;

  select jsonb_build_object(

    'pet', (
      select jsonb_build_object(
        'id',       p.id,
        'name',     p.name,
        'species',  p.species,
        'breed',    p.breed,
        'birthday', p.birthday,
        'weight',   p.weight,
        'notes',    p.notes
      )
      from public.pets p
      where p.id = p_pet_id
        and coalesce(p.is_deleted, false) = false
    ),

    'health_summaries', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id',             h.id,
          'source_type',    h.source_type,
          'extracted_data', h.extracted_data,
          'date',           h.created_at
        ) order by h.created_at desc
      ), '[]'::jsonb)
      from (
        select *
        from public.pet_health_summaries
        where pet_id                    = p_pet_id
          and coalesce(is_deleted, false) = false
        order by created_at desc
        limit p_health_limit
      ) h
    ),

    'service_history', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'service_type', s.service_type,
          'service_name', s.service_name,
          'notes',        s.notes,
          'date',         s.performed_at
        ) order by s.performed_at desc
      ), '[]'::jsonb)
      from (
        select *
        from public.pet_service_history
        where pet_id = p_pet_id
        order by performed_at desc
        limit p_service_limit
      ) s
    ),

    'recommendations', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id',            r.id,
          'type',          r.recommendation_type,
          'content',       r.content,
          'confidence',    r.confidence,
          'model',         r.model,
          'model_version', r.model_version,
          'expires_at',    r.expires_at,
          'status',        r.status,
          'created_at',    r.created_at
        ) order by r.created_at desc
      ), '[]'::jsonb)
      from (
        select *
        from public.pet_recommendations
        where pet_id   = p_pet_id
          and status   = 'active'
          and (expires_at is null or expires_at > now())
        order by created_at desc
        limit p_recommendation_limit
      ) r
    ),

    'chat', (
      case
        when p_session_id is null then
          jsonb_build_object('summary', ''::text, 'messages', '[]'::jsonb)
        else (
          select jsonb_build_object(
            'summary',  coalesce(cs.summary, ''),
            'messages', (
              select coalesce(jsonb_agg(
                jsonb_build_object(
                  'role',       m.role,
                  'content',    m.content,
                  'created_at', m.created_at
                ) order by m.created_at asc
              ), '[]'::jsonb)
              from (
                select * from (
                  select *
                  from public.chat_messages
                  where session_id = p_session_id
                  order by created_at desc
                  limit p_message_limit
                ) recent
                order by created_at asc
              ) m
            )
          )
          from public.chat_sessions cs
          where cs.id       = p_session_id
            and cs.pet_id  = p_pet_id
            and cs.user_id = auth.uid()
        )
      end
    )

  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

-- expire_stale_recommendations helper
create or replace function public.expire_stale_recommendations()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count int;
begin
  update public.pet_recommendations
    set status     = 'expired',
        updated_at = now()
  where status     = 'active'
    and expires_at is not null
    and expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- Semantic similarity search for pet health summaries
-- Returns the top N embeddings most similar to the query vector
create or replace function public.match_pet_embeddings(
  p_pet_id        uuid,
  p_query_vector  vector(768),
  p_match_count   int default 3
)
returns table (
  id           uuid,
  pet_id       uuid,
  source_id    uuid,
  source_table text,
  content      text,
  similarity   float
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- auth.uid() is safe here: Supabase injects it per request via JWT
  if not public.owns_pet(p_pet_id) then
    raise exception 'unauthorized';
  end if;

  return query
  select
    e.id,
    e.pet_id,
    e.source_id,
    e.source_table,
    e.content,
    1 - (e.embedding <=> p_query_vector) as similarity
  from public.pet_embeddings e
  where e.pet_id        = p_pet_id
    and e.embedding     is not null
  order by e.embedding <=> p_query_vector
  limit p_match_count;
end;
$$;