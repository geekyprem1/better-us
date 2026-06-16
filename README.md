# BetterUs 💙

AI-powered relationship assessment & coaching platform. Couples take a 5-minute
assessment across **Trust · Communication · Connection · Intimacy**, get health
scores, an AI relationship analysis, and personalized 7 / 30 / 90-day recovery
plans — plus a 24/7 AI coach.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase ·
OpenAI · Razorpay · PostHog**, and ready to deploy on **Vercel**.

---

## ✨ Features

| Area | What it does |
|------|--------------|
| **Landing page** | Hero, benefits, how-it-works, testimonials, FAQ, CTA |
| **Assessment** | 40 questions (4×10), 1–5 scale, auto-advance, progress bar, anonymous-friendly |
| **Scoring engine** | 0–100 per category + overall, reverse-scored items, health bands |
| **AI analysis** | Summary, strengths, weaknesses, risk areas, recommendations |
| **Recovery plans** | 7 / 30 / 90-day plans: daily actions, conversation scripts, reflections, trust activities |
| **AI Coach** | Streaming chat, supportive coaching tone, communication scripts |
| **Dashboard** | Score cards, progress charts over time, recent AI insights |
| **Auth** | Email + Google login, protected routes |
| **Payments** | Razorpay subscriptions (₹499/mo), webhooks, premium gating |
| **Analytics** | PostHog funnel: visits → starts → completions → upgrades → purchases |

---

## 📁 Folder structure

```
betterus/
├── middleware.ts                 # Session refresh + protected-route guard
├── next.config.ts
├── postcss.config.mjs            # Tailwind v4
├── tsconfig.json
├── .env.example
├── supabase/
│   └── schema.sql                # Full DB schema + RLS + triggers
└── src/
    ├── app/
    │   ├── layout.tsx            # Root layout + analytics provider
    │   ├── globals.css           # Tailwind v4 theme + gradients
    │   ├── page.tsx              # Landing page
    │   ├── login/page.tsx
    │   ├── auth/callback/route.ts
    │   ├── assessment/page.tsx
    │   ├── results/[id]/page.tsx
    │   ├── dashboard/page.tsx
    │   ├── coach/page.tsx
    │   ├── pricing/page.tsx
    │   └── api/
    │       ├── assessment/submit/route.ts
    │       ├── report/generate/route.ts      # AI analysis + plans (premium)
    │       ├── coach/route.ts                 # Streaming AI coach (premium)
    │       └── razorpay/
    │           ├── subscription/route.ts      # Create subscription
    │           ├── verify/route.ts            # Verify checkout signature
    │           └── webhook/route.ts           # Lifecycle webhook
    ├── components/                # Navbar, Footer, FAQ, AssessmentFlow,
    │                              # ScoreCards, ReportSection, CoachChat,
    │                              # ProgressChart, UpgradeButton, etc.
    └── lib/
        ├── questions.ts          # Question bank
        ├── scoring.ts            # Scoring engine + bands
        ├── ai.ts                 # OpenAI prompts (analysis, plans, coach)
        ├── openai.ts             # Lazy OpenAI client
        ├── razorpay.ts           # Lazy Razorpay client + signature verify
        ├── analytics.ts          # PostHog events
        ├── entitlements.ts       # isPremium()
        ├── types.ts
        └── supabase/{client,server,middleware}.ts
```

---

## 🚀 Getting started (local)

### 1. Install

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in the values (see **Environment variables** below).

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   This creates all tables, the `handle_new_user` trigger, and Row-Level-Security policies.
3. **Auth → Providers**: enable **Email** and **Google** (add your Google OAuth client id/secret).
4. **Auth → URL Configuration**: add `http://localhost:3000` and your production domain to the
   redirect allow-list, and set the Site URL.

### 4. Run

```bash
npm run dev
# http://localhost:3000
```

---

## 🔐 Environment variables

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; your domain in prod |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (⚠️ server-only) |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `OPENAI_MODEL` | e.g. `gpt-4o-mini` (default) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay → Settings → API Keys |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | same |
| `RAZORPAY_PLAN_ID` | Razorpay → Subscriptions → Plans (create a ₹499/mo plan) |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay → Settings → Webhooks |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | PostHog → Project Settings |

---

## 💳 Razorpay setup

1. **Create a Plan**: Dashboard → Subscriptions → Plans → ₹499, monthly. Copy the
   `plan_xxx` id into `RAZORPAY_PLAN_ID`.
2. **Add a Webhook**: Dashboard → Settings → Webhooks → URL
   `https://YOUR_DOMAIN/api/razorpay/webhook`. Subscribe to:
   `subscription.activated`, `subscription.charged`, `subscription.cancelled`,
   `subscription.completed`, `subscription.halted`. Copy the signing secret into
   `RAZORPAY_WEBHOOK_SECRET`.
3. Test mode keys (`rzp_test_…`) work end-to-end with Razorpay's test cards.

**Flow:** `UpgradeButton` → `POST /api/razorpay/subscription` (creates subscription) →
Razorpay Checkout → `POST /api/razorpay/verify` (HMAC signature check, activates premium) →
webhook keeps status in sync on renewals/cancellations.

---

## 🤖 OpenAI integration

- `src/lib/ai.ts` holds the coaching persona and prompts.
- **Analysis & plans**: `POST /api/report/generate` (premium-gated) returns strict
  JSON, caches into `reports`.
- **Coach**: `POST /api/coach` streams tokens back to the client and persists the turn.
- Swap the model via `OPENAI_MODEL`. Defaults to `gpt-4o-mini` for cost; use a
  stronger model for richer reports.

---

## 📊 Analytics (PostHog)

Funnel events fired from the client (`src/lib/analytics.ts`):
`landing_page_view`, `assessment_start`, `assessment_complete`, `upgrade_view`,
`upgrade_click`, `subscription_purchase`, `coach_message_sent`. Auto pageviews are
enabled. If `NEXT_PUBLIC_POSTHOG_KEY` is unset, analytics no-op silently.

---

## ☁️ Deploy to Vercel

1. Push the repo to GitHub.
2. Import it in [vercel.com](https://vercel.com) → it auto-detects Next.js.
3. Add **all** environment variables from `.env.example` in
   Project → Settings → Environment Variables (set `NEXT_PUBLIC_SITE_URL` to your
   Vercel domain).
4. Deploy. Then:
   - Update Supabase Auth redirect URLs with your Vercel domain.
   - Point the Razorpay webhook at `https://YOUR_DOMAIN/api/razorpay/webhook`.

> The report/coach routes set `maxDuration = 60`. On Vercel Hobby the function
> limit is lower; the Pro plan is recommended for the AI report generation.

---

## 🧪 Notes & disclaimers

- BetterUs is a coaching / self-improvement tool, **not** a substitute for
  professional therapy or crisis services. The AI is prompted to escalate to
  professional help when it detects abuse, self-harm, or danger.
- All user data is protected with Supabase Row-Level Security — every row is
  owned by `auth.uid()`. The service-role key is only used server-side in
  webhooks/verification.

---

## Scripts

```bash
npm run dev     # local dev
npm run build   # production build
npm run start   # run the production build
```
