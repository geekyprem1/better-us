// ENGINE 1 — RELATIONSHIP HEALTH ENGINE™
// Weighted, normalized 0..100 health per category and overall.

import { Answers } from "../scoring";
import { Category, CATEGORY_WEIGHTS, categoryScore, round } from "./core";

export type HealthBand = "thriving" | "healthy" | "needs_attention" | "at_risk" | "critical";

export interface HealthResult {
  trust: number;
  communication: number;
  connection: number;
  intimacy: number;
  overall: number;
  band: HealthBand;
  bandLabel: string;
}

// Spec bands: 90-100 Thriving, 75-89 Healthy, 60-74 Needs Attention,
// 40-59 At Risk, 0-39 Critical.
export function healthBand(score: number): HealthBand {
  if (score >= 90) return "thriving";
  if (score >= 75) return "healthy";
  if (score >= 60) return "needs_attention";
  if (score >= 40) return "at_risk";
  return "critical";
}

export const HEALTH_BAND_LABEL: Record<HealthBand, string> = {
  thriving: "Thriving",
  healthy: "Healthy",
  needs_attention: "Needs Attention",
  at_risk: "At Risk",
  critical: "Critical",
};

export function runHealth(answers: Answers): HealthResult {
  const cats: Category[] = ["trust", "communication", "connection", "intimacy"];
  const scores = Object.fromEntries(cats.map((c) => [c, categoryScore(c, answers)])) as Record<
    Category,
    number
  >;

  // overall = Σ categoryScore × categoryWeight  (weights sum to 1)
  const overall = round(
    cats.reduce((acc, c) => acc + scores[c] * CATEGORY_WEIGHTS[c], 0),
  );
  const band = healthBand(overall);

  return {
    trust: scores.trust,
    communication: scores.communication,
    connection: scores.connection,
    intimacy: scores.intimacy,
    overall,
    band,
    bandLabel: HEALTH_BAND_LABEL[band],
  };
}
