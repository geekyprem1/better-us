import { Category, CATEGORIES, QUESTIONS, QUESTIONS_BY_CATEGORY, Question } from "./questions";

export type Answers = Record<string, number>; // questionId -> 1..5

export interface CategoryScore {
  category: Category;
  label: string;
  score: number; // 0..100
  band: ScoreBand;
}

export interface ScoreResult {
  trust: number;
  communication: number;
  connection: number;
  intimacy: number;
  overall: number;
  categories: CategoryScore[];
}

export type ScoreBand = "critical" | "at-risk" | "stable" | "thriving";

// Convert a single 1..5 answer to a 0..1 health fraction, honoring reverse items.
function normalize(q: Question, raw: number): number {
  const v = q.reverse ? 6 - raw : raw;
  return (v - 1) / 4; // 1->0, 5->1
}

export function scoreCategory(category: Category, answers: Answers): number {
  const qs = QUESTIONS_BY_CATEGORY[category];
  const vals = qs
    .map((q) => (typeof answers[q.id] === "number" ? normalize(q, answers[q.id]) : null))
    .filter((v): v is number => v !== null);
  if (vals.length === 0) return 0;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round(avg * 100);
}

export function bandFor(score: number): ScoreBand {
  if (score < 40) return "critical";
  if (score < 60) return "at-risk";
  if (score < 80) return "stable";
  return "thriving";
}

export const BAND_META: Record<ScoreBand, { label: string; color: string; text: string }> = {
  critical: { label: "Needs urgent attention", color: "#ef4444", text: "text-red-600" },
  "at-risk": { label: "At risk", color: "#f59e0b", text: "text-amber-600" },
  stable: { label: "Stable", color: "#3366ff", text: "text-brand-600" },
  thriving: { label: "Thriving", color: "#10b981", text: "text-emerald-600" },
};

export function computeScores(answers: Answers): ScoreResult {
  const trust = scoreCategory("trust", answers);
  const communication = scoreCategory("communication", answers);
  const connection = scoreCategory("connection", answers);
  const intimacy = scoreCategory("intimacy", answers);
  const overall = Math.round((trust + communication + connection + intimacy) / 4);

  const categories: CategoryScore[] = CATEGORIES.map((c) => {
    const score = { trust, communication, connection, intimacy }[c.key];
    return { category: c.key, label: c.label, score, band: bandFor(score) };
  });

  return { trust, communication, connection, intimacy, overall, categories };
}

// True when every question has a valid 1..5 answer.
export function isComplete(answers: Answers): boolean {
  return QUESTIONS.every((q) => {
    const v = answers[q.id];
    return typeof v === "number" && v >= 1 && v <= 5;
  });
}
