-- ════════════════════════════════════════════════════════════════
-- BetterUs Coach OS (structured cards). Run after schema.sql.
-- Replaces the endless-chat model: each coach turn = a session that
-- produces typed cards, stored so they can live in dedicated panels.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  prompt text not null,
  created_at timestamptz not null default now()
);
create index if not exists coach_sessions_user_idx on public.coach_sessions (user_id, created_at desc);

create table if not exists public.coach_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  session_id uuid references public.coach_sessions (id) on delete cascade,
  type text not null check (type in ('insight', 'action', 'script', 'task', 'warning')),
  title text not null,
  body text not null,
  status text not null default 'open', -- open | done  (for task cards)
  created_at timestamptz not null default now()
);
create index if not exists coach_cards_user_type_idx on public.coach_cards (user_id, type, created_at desc);
create index if not exists coach_cards_session_idx on public.coach_cards (session_id);

alter table public.coach_sessions enable row level security;
alter table public.coach_cards enable row level security;

drop policy if exists "coach_sessions owner all" on public.coach_sessions;
create policy "coach_sessions owner all" on public.coach_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "coach_cards owner all" on public.coach_cards;
create policy "coach_cards owner all" on public.coach_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
