// Builds the "# BETTERUS INTELLIGENCE ENGINE INPUT" block for the coach prompt,
// filling every {{placeholder}} deterministically from the engine output.

import { RelationshipIntelligence } from "./index";

// ── Coach snapshot + recovery journey + critical insights ───────
export interface CoachSnapshot {
  stage: string;
  recovery: number;
  trustRisk: string;
  currentFocus: string;
  nextMilestone: string;
}

export interface RecoveryJourney {
  currentStage: string;
  nextStage: string | null;
  progress: number; // 0..100 toward next stage
  recovery: number;
  needs: { label: string; needed: number }[];
}

export interface CriticalInsight {
  icon: string;
  text: string;
  severity: number;
}

// Stage ladder + approximate overall floors for the motivational journey bar.
const LADDER = ["Collapse Risk", "At Risk", "Emotionally Distanced", "Needs Attention", "Healthy", "Thriving"];
const FLOOR: Record<string, number> = {
  "Collapse Risk": 0,
  "At Risk": 40,
  "Emotionally Distanced": 48,
  "Needs Attention": 55,
  Healthy: 68,
  Thriving: 85,
};

export function coachSnapshot(intel: RelationshipIntelligence): CoachSnapshot {
  const h = relationshipHeadline(intel);
  const pillars = [
    ["Trust", intel.health.trust],
    ["Communication", intel.health.communication],
    ["Connection", intel.health.connection],
    ["Intimacy", intel.health.intimacy],
  ].sort((a, b) => (a[1] as number) - (b[1] as number));
  const weak = pillars[0];
  const nextMilestone = `${weak[0]} Score ${Math.ceil(((weak[1] as number) + 1) / 10) * 10}+`;
  return {
    stage: intel.stage.stage,
    recovery: intel.recovery.score,
    trustRisk: intel.trustRisk.level,
    currentFocus: h.priorityFocus,
    nextMilestone,
  };
}

export function recoveryJourney(intel: RelationshipIntelligence): RecoveryJourney {
  const overall = intel.health.overall;
  const current = intel.stage.stage;
  const idx = LADDER.indexOf(current);
  const nextStage = idx >= 0 && idx < LADDER.length - 1 ? LADDER[idx + 1] : null;

  let progress = 100;
  const needs: { label: string; needed: number }[] = [];
  if (nextStage) {
    const floor = FLOOR[current] ?? 0;
    const target = FLOOR[nextStage] ?? 100;
    progress = Math.max(0, Math.min(100, Math.round(((overall - floor) / (target - floor)) * 100)));
    // The two lowest pillars are the levers to reach the next stage.
    const pillars = [
      ["Trust", intel.health.trust],
      ["Communication", intel.health.communication],
      ["Connection", intel.health.connection],
      ["Intimacy", intel.health.intimacy],
    ].sort((a, b) => (a[1] as number) - (b[1] as number));
    for (const [label, score] of pillars.slice(0, 2)) {
      const needed = Math.max(0, target - (score as number));
      if (needed > 0) needs.push({ label: label as string, needed });
    }
  }

  return { currentStage: current, nextStage, progress, recovery: intel.recovery.score, needs };
}

// RECOVERY FORECAST™ — deterministic stage projection with vs. without action.
// Ladder is best → worst for projection math.
const FORECAST_LADDER = [
  "Thriving",
  "Healthy",
  "Needs Attention",
  "At Risk",
  "Emotionally Distanced",
  "Collapse Risk",
];

export interface RecoveryForecast {
  withoutAction: { d30: string; d60: string; d90: string };
  withAction: { d30: string; d60: string; d90: string };
}

export function recoveryForecast(intel: RelationshipIntelligence): RecoveryForecast {
  const found = FORECAST_LADDER.indexOf(intel.stage.stage);
  const i = found < 0 ? 3 : found;
  const at = (n: number) => FORECAST_LADDER[Math.max(0, Math.min(FORECAST_LADDER.length - 1, n))];
  // High recovery potential softens the decline / accelerates the gains.
  const fast = intel.recovery.score >= 60;
  return {
    withoutAction: { d30: at(i + (fast ? 0 : 1)), d60: at(i + 1), d90: at(i + 2) },
    // Never project below "Healthy" (index 1) so we don't over-promise Thriving.
    withAction: { d30: at(Math.max(1, i - 1)), d60: at(Math.max(1, i - 2)), d90: at(Math.max(1, i - 3)) },
  };
}

export function criticalInsights(intel: RelationshipIntelligence): CriticalInsight[] {
  const { health, trustRisk, communication, stage } = intel;
  const out: CriticalInsight[] = [];

  const pillars = [
    ["Trust", health.trust],
    ["Communication", health.communication],
    ["Connection", health.connection],
    ["Intimacy", health.intimacy],
  ].sort((a, b) => (a[1] as number) - (b[1] as number));
  const weak = pillars[0];
  out.push({
    icon: (weak[1] as number) < 40 ? "🔥" : "⚠",
    text: `${weak[0]} is your weakest pillar (${weak[1]}/100)`,
    severity: 100 - (weak[1] as number),
  });

  if (trustRisk.level === "High" || trustRisk.level === "Severe") {
    out.push({ icon: "🔥", text: `Trust Risk™ is ${trustRisk.level}`, severity: trustRisk.index });
  }
  if (communication.primaryFailure !== "None significant") {
    out.push({ icon: "⚠", text: `${communication.primaryFailure} is hurting communication`, severity: communication.index });
  }
  if (["At Risk", "Collapse Risk", "Emotionally Distanced"].includes(stage.stage)) {
    out.push({ icon: "🔥", text: `Relationship Stage™: ${stage.stage}`, severity: 90 });
  }

  return out.sort((a, b) => b.severity - a.severity);
}

// ── Conversion-grade headline (Phase 1) ─────────────────────────
// Turns the engine output into the punchy, high-converting summary shown
// at the top of the results page.
export interface RelationshipHeadline {
  status: string; // Strong | Healthy | Needs Attention | At Risk | Critical
  statusColor: string;
  healthScore: number;
  stabilityScore: number;
  recoveryLabel: string;
  recoveryScore: number;
  mainProblem: string;
  priorityFocus: string;
}

const STATUS_FROM_BAND: Record<string, { label: string; color: string }> = {
  thriving: { label: "Strong", color: "#10b981" },
  healthy: { label: "Healthy", color: "#3366ff" },
  needs_attention: { label: "Needs Attention", color: "#f59e0b" },
  at_risk: { label: "At Risk", color: "#f97316" },
  critical: { label: "Critical", color: "#ef4444" },
};

const PROBLEM_LABEL: Record<string, string> = {
  Communication: "Communication Breakdown",
  Trust: "Trust Erosion",
  Connection: "Emotional Disconnection",
  Intimacy: "Intimacy Decline",
};

const FOCUS_LABEL: Record<string, string> = {
  Communication: "Communication Repair",
  Trust: "Trust Rebuilding",
  Connection: "Reconnection",
  Intimacy: "Rebuilding Closeness",
};

export function relationshipHeadline(intel: RelationshipIntelligence): RelationshipHeadline {
  const { health, trustRisk, communication, recovery } = intel;
  const status = STATUS_FROM_BAND[health.band] ?? STATUS_FROM_BAND.needs_attention;

  // Stability = how solid/steady the foundation feels right now: trust +
  // communication minus volatility (communication risk index).
  const stabilityScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(0.45 * health.trust + 0.3 * health.communication + 0.25 * (100 - communication.index)),
    ),
  );

  // Rank dimensions by risk to name the main problem.
  const dims = [
    { key: "Communication", risk: communication.index },
    { key: "Trust", risk: trustRisk.index },
    { key: "Connection", risk: 100 - health.connection },
    { key: "Intimacy", risk: 100 - health.intimacy },
  ].sort((a, b) => b.risk - a.risk);
  const topKey = dims[0].key;

  // Priority focus: trust takes precedence when trust risk is high.
  const priorityFocus =
    trustRisk.level === "High" || trustRisk.level === "Severe"
      ? "Trust Rebuilding"
      : FOCUS_LABEL[topKey];

  return {
    status: status.label,
    statusColor: status.color,
    healthScore: health.overall,
    stabilityScore,
    recoveryLabel: recovery.band,
    recoveryScore: recovery.score,
    mainProblem: PROBLEM_LABEL[topKey],
    priorityFocus,
  };
}

// Risk level from a 0..100 health score (inverse of the health bands).
function riskFromScore(score: number): string {
  if (score < 40) return "Severe";
  if (score < 60) return "High";
  if (score < 75) return "Moderate";
  return "Low";
}

export interface CoachContext {
  input: string; // the filled engine-input block
  primaryIssue: string;
  secondaryIssue: string;
}

export function engineCoachContext(intel: RelationshipIntelligence): CoachContext {
  const { health, trustRisk, communication, stage, recovery, dna } = intel;

  // Rank the four dimensions by risk to derive primary/secondary issues.
  const dims = [
    { key: "Communication", risk: communication.index, detail: communication.primaryFailure },
    { key: "Trust", risk: trustRisk.index, detail: trustRisk.drivers[0] ?? "" },
    { key: "Connection", risk: 100 - health.connection, detail: "Emotional closeness has thinned" },
    { key: "Intimacy", risk: 100 - health.intimacy, detail: "Physical/affectionate closeness is low" },
  ].sort((a, b) => b.risk - a.risk);

  const primaryIssue = `${dims[0].key} — ${dims[0].detail}`;
  const secondaryIssue = `${dims[1].key} — ${dims[1].detail}`;

  const relationshipDna = `${dna.attachmentStyle} attachment · ${dna.conflictStyle} conflict · ${dna.communicationStyle} communicator · ${dna.connectionStyle} connection`;

  const assessmentSummary = `Stage: ${stage.stage}. Overall health ${health.overall}/100 (${health.bandLabel}). ` +
    `Recovery potential ${recovery.score}/100 (${recovery.band}). ${recovery.summary}`;

  const recoveryPath = `${recovery.band} recovery potential. ${stage.toImprove}`;

  const input = `Relationship Stage: ${stage.stage}
Overall Relationship Health: ${health.overall}/100 (${health.bandLabel})
Trust Score: ${health.trust}/100
Communication Score: ${health.communication}/100
Connection Score: ${health.connection}/100
Intimacy Score: ${health.intimacy}/100
Trust Risk: ${trustRisk.level} (index ${trustRisk.index}/100)
Communication Risk: ${communication.level} (type: ${communication.type}, primary failure: ${communication.primaryFailure})
Connection Risk: ${riskFromScore(health.connection)}
Intimacy Risk: ${riskFromScore(health.intimacy)}
Recovery Potential: ${recovery.band} (${recovery.score}/100)
Repair Capacity: ${communication.repairCapacity}/100
Primary Issue: ${primaryIssue}
Secondary Issue: ${secondaryIssue}
Relationship DNA: ${relationshipDna}
Conflict Style: ${dna.conflictStyle}
Communication Style: ${dna.communicationStyle}
Connection Style: ${dna.connectionStyle}
Attachment Style: ${dna.attachmentStyle}
Recovery Path: ${recoveryPath}
Assessment Summary: ${assessmentSummary}`;

  return { input, primaryIssue, secondaryIssue };
}
