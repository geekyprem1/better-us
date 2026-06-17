// ════════════════════════════════════════════════════════════════
// BetterUs Relationship Intelligence Engine™ — CORE
// Deterministic, explainable signal math shared by all 8 engines.
//
// Design principle: every question maps to one or more *facets*. A facet's
// "health" is the reverse-aware mean of its question answers in [0,1] where
// 1 = healthy. A facet's "risk" is simply 1 - health. This uniform convention
// means no engine ever has to reason about question polarity — the signal map
// already encodes it.
// ════════════════════════════════════════════════════════════════

import { QUESTIONS, Category, CATEGORIES } from "../questions";
import { Answers } from "../scoring";

// ── Facet taxonomy ──────────────────────────────────────────────
// Each facet measures one latent dimension. High facet-health = good.
export type Facet =
  // Trust
  | "trust_insecurity"
  | "trust_secrecy"
  | "trust_broken"
  | "trust_fearVuln"
  | "trust_reliability"
  // Communication
  | "comm_avoidance"
  | "comm_defensiveness"
  | "comm_escalation"
  | "comm_stonewalling"
  | "comm_fatigue"
  | "comm_repair"
  // Connection
  | "conn_closeness"
  | "conn_meaning"
  | "conn_companionship"
  | "conn_growthApart"
  // Intimacy
  | "int_affection"
  | "int_desire"
  | "int_vulnerability"
  | "int_sexComm";

// Question → facets it feeds. A question may inform several facets.
export const SIGNAL_MAP: Record<string, Facet[]> = {
  // Trust
  t1: ["trust_insecurity"],
  t2: ["trust_reliability"],
  t3: ["trust_reliability"],
  t4: ["trust_secrecy"],
  t5: ["trust_secrecy"],
  t6: ["trust_insecurity"],
  t7: ["trust_secrecy", "trust_insecurity"],
  t8: ["trust_reliability"],
  t9: ["trust_insecurity"],
  t10: ["trust_broken"],
  // Communication
  c1: ["comm_repair", "comm_fatigue"],
  c2: ["comm_defensiveness"],
  c3: ["comm_stonewalling"],
  c4: ["comm_avoidance"],
  c5: ["comm_escalation"],
  c6: ["comm_repair", "comm_fatigue"],
  c7: ["comm_stonewalling"],
  c8: ["comm_avoidance"],
  c9: ["comm_stonewalling"],
  c10: ["comm_escalation", "comm_defensiveness"],
  // Connection
  n1: ["conn_closeness"],
  n2: ["conn_companionship"],
  n3: ["conn_closeness"],
  n4: ["conn_growthApart"],
  n5: ["conn_meaning"],
  n6: ["conn_closeness"],
  n7: ["conn_companionship"],
  n8: ["conn_companionship"],
  n9: ["conn_growthApart"],
  n10: ["conn_meaning"],
  // Intimacy
  i1: ["int_affection"],
  i2: ["int_vulnerability", "trust_fearVuln"],
  i3: ["int_desire"],
  i4: ["int_affection"],
  i5: ["int_affection"],
  i6: ["int_desire"],
  i7: ["int_sexComm"],
  i8: ["int_vulnerability", "trust_fearVuln"],
  i9: ["int_desire", "int_affection"],
  i10: ["int_desire"],
};

// Diagnostic weight per question for the weighted health score.
// Red-flag / anchor items count more because they carry more variance.
const RED_FLAG = ["t5", "t7", "t10", "c4", "c5", "c9", "n4", "n6", "n9", "i4", "i9"];
const ANCHOR = ["t1", "c1", "n1", "i1"];
export function questionWeight(id: string): number {
  if (RED_FLAG.includes(id)) return 1.4;
  if (ANCHOR.includes(id)) return 1.3;
  return 1.0;
}

// Category weights for the overall score. Trust & communication are the
// load-bearing foundations (Gottman): weaken them and everything else follows.
export const CATEGORY_WEIGHTS: Record<Category, number> = {
  trust: 0.28,
  communication: 0.28,
  connection: 0.22,
  intimacy: 0.22,
};

// ── Primitive helpers ───────────────────────────────────────────
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const round = (x: number) => Math.round(x);
export const pct = (x01: number) => round(clamp01(x01) * 100);
export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const REVERSE = new Map(QUESTIONS.map((q) => [q.id, !!q.reverse]));

// Reverse-aware health of a single answer in [0,1]; null if unanswered.
export function questionHealth(id: string, answers: Answers): number | null {
  const raw = answers[id];
  if (typeof raw !== "number") return null;
  const v = REVERSE.get(id) ? 6 - raw : raw;
  return clamp01((v - 1) / 4);
}

// Build the list of question ids feeding a given facet.
const FACET_QUESTIONS = (() => {
  const map = {} as Record<Facet, string[]>;
  for (const [qid, facets] of Object.entries(SIGNAL_MAP)) {
    for (const f of facets) (map[f] ??= []).push(qid);
  }
  return map;
})();

export interface FacetReading {
  health: number; // 0..1, 1 = healthy
  risk: number; // 0..1, 1 = problematic
  answered: number; // how many of the facet's questions were answered
}

// Facet health = mean reverse-aware health of answered questions.
// Unanswered facet → neutral 0.5 with answered=0 (callers can down-weight).
export function facetReading(facet: Facet, answers: Answers): FacetReading {
  const ids = FACET_QUESTIONS[facet] ?? [];
  const vals = ids.map((id) => questionHealth(id, answers)).filter((v): v is number => v !== null);
  const health = vals.length ? mean(vals) : 0.5;
  return { health, risk: clamp01(1 - health), answered: vals.length };
}

// Convenience: read several facets' risks at once.
export function risks<T extends Facet>(answers: Answers, facets: T[]): Record<T, number> {
  const out = {} as Record<T, number>;
  for (const f of facets) out[f] = facetReading(f, answers).risk;
  return out;
}

// Weighted 0..100 score for one category.
export function categoryScore(category: Category, answers: Answers): number {
  const qs = QUESTIONS.filter((q) => q.category === category);
  let wsum = 0;
  let acc = 0;
  for (const q of qs) {
    const h = questionHealth(q.id, answers);
    if (h === null) continue;
    const w = questionWeight(q.id);
    acc += w * h;
    wsum += w;
  }
  return wsum ? pct(acc / wsum) : 0;
}

// Fraction of the assessment that was actually answered (data confidence).
export function answeredFraction(answers: Answers): number {
  const n = QUESTIONS.filter((q) => questionHealth(q.id, answers) !== null).length;
  return clamp01(n / QUESTIONS.length);
}

export { CATEGORIES, type Category };
