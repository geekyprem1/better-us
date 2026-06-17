// ENGINE 5 — RECOVERY POTENTIAL ENGINE™
// Predicts how likely the relationship is to improve. The core insight from
// relationship research: recovery is driven less by the *absence* of problems
// and more by REPAIR CAPACITY + RESIDUAL POSITIVE CONNECTION. A struggling
// couple that can still apologize and shares warmth often out-recovers a
// "average" couple stuck in contempt. So this score intentionally diverges
// from raw health.

import { Answers } from "../scoring";
import { facetReading, questionHealth, clamp01, pct, mean } from "./core";
import { HealthResult } from "./health";
import { Stage } from "./stage";

export type RecoveryBand = "Very Low" | "Low" | "Moderate" | "High" | "Very High";

export interface RecoveryResult {
  score: number; // 0..100
  band: RecoveryBand;
  components: {
    repairCapacity: number;
    residualConnection: number;
    foundationTrust: number;
    conflictContainment: number;
    stageFactor: number;
  };
  summary: string;
}

const STAGE_FACTOR: Record<Stage, number> = {
  Thriving: 1.0,
  Stable: 0.9,
  Disconnected: 0.6,
  "Emotionally Distanced": 0.55,
  "At Risk": 0.4,
  "Collapse Risk": 0.25,
};

export function recoveryBand(score: number): RecoveryBand {
  if (score >= 80) return "Very High";
  if (score >= 60) return "High";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Low";
  return "Very Low";
}

function avgHealth(ids: string[], answers: Answers): number {
  const vals = ids.map((id) => questionHealth(id, answers)).filter((v): v is number => v !== null);
  return vals.length ? mean(vals) : 0.5;
}

export function runRecovery(
  answers: Answers,
  health: HealthResult,
  stage: Stage,
): RecoveryResult {
  // 1. Repair capacity — can they apologize, stay respectful, speak safely?
  const repair = avgHealth(["c6", "c10", "c2", "c1"], answers);

  // 2. Residual connection — warmth that survives the conflict.
  const residual = mean([
    facetReading("conn_companionship", answers).health,
    facetReading("int_vulnerability", answers).health,
    avgHealth(["n8", "n1"], answers),
  ]);

  // 3. Foundation trust — trust score, penalized by *unhealed* broken trust.
  const brokenRisk = facetReading("trust_broken", answers).risk;
  const foundation = clamp01(health.trust / 100 - 0.5 * brokenRisk);

  // 4. Conflict containment — inverse of how explosive/corrosive conflict is.
  const conflictSeverity = mean([
    facetReading("comm_escalation", answers).risk,
    facetReading("trust_broken", answers).risk,
  ]);
  const containment = clamp01(1 - conflictSeverity);

  // 5. Stage factor.
  const stageFactor = STAGE_FACTOR[stage];

  const score = pct(
    clamp01(
      0.3 * repair +
        0.25 * residual +
        0.2 * foundation +
        0.15 * containment +
        0.1 * stageFactor,
    ),
  );
  const band = recoveryBand(score);

  const summary =
    band === "Very High" || band === "High"
      ? "Strong recovery potential: the capacity to repair and the warmth between you are still very much alive."
      : band === "Moderate"
        ? "Real recovery is possible. The building blocks exist, but they need consistent, deliberate effort to compound."
        : "Recovery is harder from here — but not impossible. The priority is rebuilding the ability to repair before anything else.";

  return {
    score,
    band,
    components: {
      repairCapacity: pct(repair),
      residualConnection: pct(residual),
      foundationTrust: pct(foundation),
      conflictContainment: pct(containment),
      stageFactor: pct(stageFactor),
    },
    summary,
  };
}
