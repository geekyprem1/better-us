-- ════════════════════════════════════════════════════════════════
-- BetterUs — Production hardening migration.
-- Run after the other schema files. Adds rate limiting, webhook
-- idempotency, and tightens RLS. Idempotent (safe to re-run).
-- ════════════════════════════════════════════════════════════════

-- ── Rate limiting (DB-backed; works on serverless) ──────────────
create table if not exists public.rate_limits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limits_key_idx on public.rate_limits (key, created_at desc);
alter table public.rate_limits enable row level security; -- no policy → service-role only

-- ── Webhook idempotency + audit (so a payment is never lost) ────
create table if not exists public.processed_webhooks (
  webhook_id text primary key,
  provider text not null default 'dodo',
  event_type text,
  user_id uuid,
  status text,                 -- processed | unmatched | error
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists processed_webhooks_status_idx on public.processed_webhooks (status, created_at desc);
alter table public.processed_webhooks enable row level security; -- service-role only

-- ── Tighten RLS: users must NOT be able to mutate premium state ──
-- Profile fields are set by the signup trigger; premium is set only by
-- the payment webhook (service role). So no client UPDATE is needed.
drop policy if exists "users self update" on public.users;

-- (users self read stays — users may read their own row.)
