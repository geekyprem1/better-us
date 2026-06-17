-- ════════════════════════════════════════════════════════════════
-- BetterUs Relationship Intelligence Engine™ — storage
-- Run AFTER schema.sql. Stores the deterministic engine output per
-- assessment. The full profile lives in `data` (JSONB); key fields are
-- promoted into columns so we can query/segment without unpacking JSON.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.relationship_intelligence (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  engine_version text not null,
  -- promoted, queryable fields
  health_overall int not null,
  health_band text not null,
  trust_risk_index int not null,
  trust_risk_level text not null,
  communication_index int not null,
  communication_type text not null,
  relationship_stage text not null,
  recovery_score int not null,
  recovery_band text not null,
  -- full RelationshipIntelligence object
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (assessment_id)
);
create index if not exists ri_user_idx on public.relationship_intelligence (user_id, created_at);
create index if not exists ri_stage_idx on public.relationship_intelligence (relationship_stage);

-- Couple Sync results (Engine 7): links two assessments.
create table if not exists public.couple_sync (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  assessment_a uuid not null references public.assessments (id) on delete cascade,
  assessment_b uuid not null references public.assessments (id) on delete cascade,
  alignment_score int not null,
  perception_gap int not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists couple_sync_user_idx on public.couple_sync (user_id);

-- ── RLS ─────────────────────────────────────────────────────────
alter table public.relationship_intelligence enable row level security;
alter table public.couple_sync enable row level security;

drop policy if exists "ri owner all" on public.relationship_intelligence;
create policy "ri owner all" on public.relationship_intelligence
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "couple_sync owner all" on public.couple_sync;
create policy "couple_sync owner all" on public.couple_sync
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
