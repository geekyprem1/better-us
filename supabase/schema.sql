-- ════════════════════════════════════════════════════════════════
-- BetterUs — Supabase schema
-- Run this in the Supabase SQL Editor (or via the CLI: supabase db push).
-- Auth users live in auth.users; we mirror profile data in public.users.
-- ════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────
do $$ begin
  create type subscription_status as enum ('free', 'active', 'cancelled', 'past_due');
exception when duplicate_object then null; end $$;

do $$ begin
  create type assessment_status as enum ('in_progress', 'completed');
exception when duplicate_object then null; end $$;

-- ── users (profile mirror of auth.users) ────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── subscriptions ───────────────────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  razorpay_subscription_id text unique,
  razorpay_customer_id text,
  plan_id text,
  status subscription_status not null default 'free',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

-- ── assessments ─────────────────────────────────────────────────
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  status assessment_status not null default 'in_progress',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists assessments_user_idx on public.assessments (user_id);

-- ── assessment_answers (one row per question) ───────────────────
create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  question_id text not null,
  category text not null,
  value smallint not null check (value between 1 and 5),
  created_at timestamptz not null default now(),
  unique (assessment_id, question_id)
);
create index if not exists answers_assessment_idx on public.assessment_answers (assessment_id);

-- ── scores ──────────────────────────────────────────────────────
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  trust int not null,
  communication int not null,
  connection int not null,
  intimacy int not null,
  overall int not null,
  created_at timestamptz not null default now()
);
create index if not exists scores_user_idx on public.scores (user_id);
create index if not exists scores_assessment_idx on public.scores (assessment_id);

-- ── reports (AI analysis + recovery plans, stored as JSONB) ──────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  analysis jsonb,
  plans jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id)
);
create index if not exists reports_user_idx on public.reports (user_id);

-- ── coach_chats (conversation history with the AI coach) ─────────
create table if not exists public.coach_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists coach_chats_user_idx on public.coach_chats (user_id, created_at);

-- ════════════════════════════════════════════════════════════════
-- Auto-provision a public.users row when an auth user signs up.
-- ════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════
-- Row Level Security — every row is owned by a user.
-- ════════════════════════════════════════════════════════════════
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.scores enable row level security;
alter table public.reports enable row level security;
alter table public.coach_chats enable row level security;

-- users
drop policy if exists "users self read" on public.users;
create policy "users self read" on public.users
  for select using (auth.uid() = id);
drop policy if exists "users self update" on public.users;
create policy "users self update" on public.users
  for update using (auth.uid() = id);

-- subscriptions (read-only to the user; writes happen via service role in webhooks)
drop policy if exists "subscriptions self read" on public.subscriptions;
create policy "subscriptions self read" on public.subscriptions
  for select using (auth.uid() = user_id);

-- assessments
drop policy if exists "assessments owner all" on public.assessments;
create policy "assessments owner all" on public.assessments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- assessment_answers (ownership derived via parent assessment)
drop policy if exists "answers owner all" on public.assessment_answers;
create policy "answers owner all" on public.assessment_answers
  for all using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_id and a.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_id and a.user_id = auth.uid()
    )
  );

-- scores
drop policy if exists "scores owner all" on public.scores;
create policy "scores owner all" on public.scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reports
drop policy if exists "reports owner all" on public.reports;
create policy "reports owner all" on public.reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- coach_chats
drop policy if exists "coach owner all" on public.coach_chats;
create policy "coach owner all" on public.coach_chats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
