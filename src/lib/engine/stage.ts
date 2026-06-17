// ENGINE 4 — RELATIONSHIP STAGE ENGINE™
// Classifies the relationship into one of six stages using a deterministic
// cascade over health + risk signals, and explains what moves it up or down.

import { HealthResult } from "./health";
import { TrustRiskResult } from "./trust";
import { CommunicationResult } from "./communication";

export type Stage =
  | "Thriving"
  | "Healthy"
  | "Needs Attention"
  | "Emotionally Distanced"
  | "At Risk"
  | "Collapse Risk";

export interface StageResult {
  stage: Stage;
  rationale: string;
  toImprove: string; // what must change to move up a stage
  warning?: string; // what would drop it to a worse stage
}

const ORDER: Stage[] = [
  "Collapse Risk",
  "At Risk",
  "Emotionally Distanced",
  "Needs Attention",
  "Healthy",
  "Thriving",
];

export function runStage(
  health: HealthResult,
  trust: TrustRiskResult,
  comm: CommunicationResult,
): StageResult {
  const { overall, trust: t, communication: c, connection: n, intimacy: i } = health;
  const minCat = Math.min(t, c, n, i);

  let stage: Stage;
  let rationale: string;

  // Cascade from most to least severe — first match wins.
  if (overall < 40 || (t < 35 && c < 35) || trust.level === "Severe") {
    stage = "Collapse Risk";
    rationale =
      "Foundational trust and communication are critically low. Without intervention, the relationship is at high risk of ending.";
  } else if (overall < 55 || trust.level === "High" || comm.level === "Severe") {
    stage = "At Risk";
    rationale =
      "Multiple core areas are strained at once. The relationship is functioning but under real pressure.";
  } else if (n < 45 && i < 45) {
    stage = "Emotionally Distanced";
    rationale =
      "Trust may be intact, but emotional and physical closeness have faded — the warmth is missing.";
  } else if (n < 55 || overall < 68) {
    stage = "Needs Attention";
    rationale =
      "The basics are holding, but connection has thinned. You're coexisting more than truly engaging.";
  } else if (overall >= 85 && minCat >= 75) {
    stage = "Thriving";
    rationale = "All four pillars are strong and mutually reinforcing. This is a flourishing relationship.";
  } else {
    stage = "Healthy";
    rationale = "The relationship is fundamentally solid, with room to deepen in specific areas.";
  }

  // What it takes to move up / what would drop it down.
  const idx = ORDER.indexOf(stage);
  const up = idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
  const down = idx > 0 ? ORDER[idx - 1] : null;

  const weakest = ([
    ["Trust", t],
    ["Communication", c],
    ["Connection", n],
    ["Intimacy", i],
  ] as [string, number][]).sort((a, b) => a[1] - b[1])[0][0];

  return {
    stage,
    rationale,
    toImprove: up
      ? `Lift your weakest pillar (${weakest}) — moving it and overall health upward shifts you toward "${up}".`
      : "You're at the top stage — focus on protecting what's working.",
    warning: down
      ? `A drop in ${weakest} or a spike in conflict could slide you toward "${down}".`
      : undefined,
  };
}
