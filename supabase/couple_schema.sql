-- ════════════════════════════════════════════════════════════════
-- BetterUs — Couple Mode (Phase 4). Run after schema.sql + engine_schema.sql.
-- Partner A creates an invite (from their latest assessment); Partner B opens
-- the link, takes the assessment, and we compute the perception gaps.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  inviter_user_id uuid not null references public.users (id) on delete cascade,
  inviter_assessment_id uuid references public.assessments (id) on delete set null,
  inviter_scores jsonb not null,
  partner_name text,
  partner_scores jsonb,
  sync jsonb,
  ai_explanation text,
  status text not null default 'pending', -- pending | completed
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists couple_invites_inviter_idx on public.couple_invites (inviter_user_id);
create index if not exists couple_invites_token_idx on public.couple_invites (token);

alter table public.couple_invites enable row level security;

-- Inviter can read their own invites. Partner B reads/writes via the service
-- role (the token is the shared secret), so no anonymous policy is needed.
drop policy if exists "couple_invites inviter read" on public.couple_invites;
create policy "couple_invites inviter read" on public.couple_invites
  for select using (auth.uid() = inviter_user_id);
