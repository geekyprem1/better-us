// ENGINE 3 — COMMUNICATION BREAKDOWN ENGINE™
// Detects the dominant dysfunctional communication pattern and classifies
// the couple's overall communication "type".

import { Answers } from "../scoring";
import { Facet, facetReading, pct, round } from "./core";

export type CommRiskLevel = "Low" | "Moderate" | "High" | "Severe";

export type CommType =
  | "Open & Constructive"
  | "Conflict-Avoidant"
  | "Volatile"
  | "Passionate but Reparative"
  | "Inconsistent / Mixed";

export interface CommunicationResult {
  index: number; // 0..100 risk
  level: CommRiskLevel;
  type: CommType;
  primaryFailure: string; // dominant breakdown pattern (or "None significant")
  patterns: { pattern: string; risk: number }[];
  repairCapacity: number; // 0..100 — ability to apologize & recover
}

const PATTERNS: { facet: Facet; label: string; weight: number }[] = [
  { facet: "comm_stonewalling", label: "Stonewalling / shutting down", weight: 0.22 },
  { facet: "comm_escalation", label: "Escalation", weight: 0.22 },
  { facet: "comm_avoidance", label: "Avoidance", weight: 0.2 },
  { facet: "comm_defensiveness", label: "Defensiveness", weight: 0.18 },
  { facet: "comm_fatigue", label: "Conflict fatigue", weight: 0.18 },
];

function riskLevel(index: number): CommRiskLevel {
  if (index >= 75) return "Severe";
  if (index >= 50) return "High";
  if (index >= 25) return "Moderate";
  return "Low";
}

export function runCommunication(answers: Answers): CommunicationResult {
  const patterns = PATTERNS.map((p) => ({
    ...p,
    risk: facetReading(p.facet, answers).risk,
  }));
  const byKey = Object.fromEntries(patterns.map((p) => [p.facet, p.risk])) as Record<Facet, number>;

  const index = round(pct(patterns.reduce((acc, p) => acc + p.risk * p.weight, 0)));
  const repairHealth = facetReading("comm_repair", answers).health;

  // Dominant failure = highest-risk pattern, if it clears a materiality floor.
  const top = [...patterns].sort((a, b) => b.risk - a.risk)[0];
  const primaryFailure = top.risk >= 0.4 ? top.label : "None significant";

  const av = byKey.comm_avoidance;
  const st = byKey.comm_stonewalling;
  const es = byKey.comm_escalation;
  const de = byKey.comm_defensiveness;

  let type: CommType;
  if (es < 0.35 && av < 0.35 && st < 0.35 && de < 0.35) {
    type = "Open & Constructive";
  } else if (es >= 0.5 && repairHealth >= 0.6) {
    type = "Passionate but Reparative";
  } else if (es >= 0.5 && de >= 0.45) {
    type = "Volatile";
  } else if ((av >= 0.5 || st >= 0.5) && es < 0.5) {
    type = "Conflict-Avoidant";
  } else {
    type = "Inconsistent / Mixed";
  }

  return {
    index,
    level: riskLevel(index),
    type,
    primaryFailure,
    patterns: patterns
      .map((p) => ({ pattern: p.label, risk: pct(p.risk) }))
      .sort((a, b) => b.risk - a.risk),
    repairCapacity: pct(repairHealth),
  };
}
