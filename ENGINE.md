# BetterUs Relationship Intelligence Engine™ — Specification

> The proprietary, **deterministic** core of BetterUs. The AI coach is a layer
> *on top* of this engine — every score and label below is computed by explicit
> formulas, not by the LLM. Same input → same output, every time.

- **Code:** [`src/lib/engine/`](src/lib/engine/)
- **Version:** `1.0.0` (`ENGINE_VERSION`)
- **Entry point:** `runIntelligence(answers)` → `RelationshipIntelligence`
- **Storage:** [`supabase/engine_schema.sql`](supabase/engine_schema.sql)

---

## 0. Signal model (the foundation)

The 40 questions don't map 1:1 to categories — they map to **19 latent facets**.
This question→facet map ([`core.ts`](src/lib/engine/core.ts) `SIGNAL_MAP`) is what
makes the output proprietary and explainable.

**Normalization.** Each answer `raw ∈ [1,5]` becomes a reverse-aware *health*:

```
health(q) = ((reverse ? 6 - raw : raw) - 1) / 4        ∈ [0,1]   (1 = healthy)
```

**Facet reading.** A facet's health is the mean health of its questions;
its risk is the complement:

```
facetHealth(f) = mean( health(q) for q in facet f )
facetRisk(f)   = 1 - facetHealth(f)
```

Because polarity is baked into the map, **risk is always `1 - health`** — no engine
ever reasons about question direction.

| Group | Facets |
|-------|--------|
| Trust | insecurity, secrecy, broken, fearVuln, reliability |
| Communication | avoidance, defensiveness, escalation, stonewalling, fatigue, repair |
| Connection | closeness, meaning, companionship, growthApart |
| Intimacy | affection, desire, vulnerability, sexComm |

---

## ENGINE 1 — Relationship Health™

Weighted category scores + weighted overall.

```
categoryScore(c) = 100 · Σ_q( w_q · health(q) ) / Σ_q( w_q )
   w_q = 1.4 (red-flag items) | 1.3 (anchor items) | 1.0 (default)

overall = Σ_c( categoryScore(c) · W_c )
   W = { trust .28, communication .28, connection .22, intimacy .22 }
```

**Bands:** `≥90 Thriving · 75–89 Healthy · 60–74 Needs Attention · 40–59 At Risk · <40 Critical`

---

## ENGINE 2 — Trust Risk™

```
trustRiskIndex = 100 · Σ_f( facetRisk(f) · W_f )
   W = { broken .25, secrecy .25, insecurity .20, reliability .15, fearVuln .15 }
```

**Levels:** `<25 Low · 25–49 Moderate · 50–74 High · ≥75 Severe`
**Drivers:** every facet with `risk ≥ 0.45` emits a templated explanation, sorted by risk.

---

## ENGINE 3 — Communication Breakdown™

```
commRiskIndex = 100 · Σ_p( facetRisk(p) · W_p )
   W = { stonewalling .22, escalation .22, avoidance .20, defensiveness .18, fatigue .18 }

primaryFailure = argmax_p facetRisk(p)   if that max ≥ 0.40, else "None significant"
```

**Communication Type** (rule cascade on av/st/es/de + repair health):

| Condition | Type |
|-----------|------|
| all risks `< 0.35` | Open & Constructive |
| `es ≥ .5` & `repair ≥ .6` | Passionate but Reparative |
| `es ≥ .5` & `de ≥ .45` | Volatile |
| (`av ≥ .5` or `st ≥ .5`) & `es < .5` | Conflict-Avoidant |
| otherwise | Inconsistent / Mixed |

---

## ENGINE 4 — Relationship Stage™

Deterministic cascade (first match wins, most→least severe):

| # | Condition | Stage |
|---|-----------|-------|
| 1 | `overall<40` or (`trust<35` & `comm<35`) or TrustRisk=Severe | **Collapse Risk** |
| 2 | `overall<55` or TrustRisk=High or CommRisk=Severe | **At Risk** |
| 3 | `connection<45` & `intimacy<45` | **Emotionally Distanced** |
| 4 | `connection<55` or `overall<68` | **Disconnected** |
| 5 | `overall≥85` & `min(all)≥75` | **Thriving** |
| 6 | else | **Stable** |

**Movement** is explained relative to the weakest pillar (what lifts you up / what drops you down).

---

## ENGINE 5 — Recovery Potential™ (the predictive core)

Recovery is driven by **repair capacity + residual warmth**, not the absence of
problems. So this intentionally diverges from raw health.

```
repair       = mean health(c6 apologize, c10 respect, c2 safe-expression, c1 resolve)
residual     = mean( companionship, intimacy-vulnerability, mean(n8 fun, n1 closeness) )
foundation   = clamp( trust/100 − 0.5·brokenRisk )
containment  = 1 − mean( escalationRisk, brokenRisk )
stageFactor  = { Thriving 1.0, Stable .9, Disconnected .6, Distanced .55, AtRisk .4, Collapse .25 }

recovery = 100 · clamp(
   0.30·repair + 0.25·residual + 0.20·foundation + 0.15·containment + 0.10·stageFactor )
```

**Bands:** `<20 Very Low · 20–39 Low · 40–59 Moderate · 60–79 High · ≥80 Very High`

---

## ENGINE 6 — Relationship DNA™

Rule-based profile from facet signals:

- **Attachment** — from `insecurity`, `fearVuln`, `closeness`: Secure / Anxious-Preoccupied /
  Dismissive-Avoidant / Fearful-Avoidant / Earning Secure.
- **Conflict** — Competitive·Volatile / Avoidant·Withdrawing / Collaborative / Accommodating.
- **Communication** — Assertive / Aggressive / Passive-Aggressive / Passive.
- **Connection** — Companionate / Drifting / Independent.
- **Love-language indicators** — top-2 of {Quality Time, Physical Touch, Words of Affirmation,
  Acts of Service, Emotional Presence}. *Indicative, not definitive.*

---

## ENGINE 7 — Couple Sync™

Two partners' scores → perception gaps.

```
gap(c)          = |A.c − B.c|
perceptionGap   = |A.overall − B.overall|
alignmentScore  = max(0, 100 − meanGap·2)
```

**Gap severity:** `<10 Minor · 10–19 Moderate · 20–29 Major · ≥30 Critical`.
Also reports which partner rates each area lower (often the one feeling the pain).

---

## ENGINE 8 — Emotional Drift™

Least-squares regression slope over the score history (points / assessment).

```
slope(series) = Σ(i−ī)(yᵢ−ȳ) / Σ(i−ī)²
trend = Improving (slope ≥ +1.5) | Declining (≤ −1.5) | Plateau | Insufficient Data (n<2)
```

---

## Architecture & API

```
runIntelligence(answers)        // Engines 1–6, single assessment  → stored on submit
runCoupleSync(scoresA, scoresB) // Engine 7
runDrift(scoreHistory[])        // Engine 8
```

- Computed server-side in [`/api/assessment/submit`](src/app/api/assessment/submit/route.ts),
  persisted to `relationship_intelligence`, rendered by
  [`IntelligencePanel`](src/components/IntelligencePanel.tsx) on the results page.
- **Free** tier sees the full deterministic intelligence (the hook). **Premium** adds the
  LLM-written narrative + recovery plans + coach — grounded on this engine's output.

## Database

`relationship_intelligence` (full JSONB + promoted columns: stage, recovery_score,
trust_risk_level, …) and `couple_sync`. Both RLS-protected per user. See
[`engine_schema.sql`](supabase/engine_schema.sql).

## Edge cases

| Case | Behavior |
|------|----------|
| Unanswered facet | health defaults to `0.5` (neutral); `confidence` reflects completeness |
| Partial assessment | `confidence = answered/40 · 100` surfaced on the profile |
| All-neutral (all 3s) | everything ~50 → "Needs Attention / Stable", balanced risks |
| Single assessment | Drift returns "Insufficient Data" until a 2nd retake |
| Determinism | verified by `scripts/engine-demo.ts` (re-run produces identical JSON) |

## Verify

```bash
npx tsx scripts/engine-demo.ts   # prints 4 example profiles + Couple Sync + Drift
```
