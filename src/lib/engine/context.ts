// Builds the "# BETTERUS INTELLIGENCE ENGINE INPUT" block for the coach prompt,
// filling every {{placeholder}} deterministically from the engine output.

import { RelationshipIntelligence } from "./index";

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
Primary Issue: ${primaryIssue}
Secondary Issue: ${secondaryIssue}
Relationship DNA: ${relationshipDna}
Conflict Style: ${dna.conflictStyle}
Attachment Style: ${dna.attachmentStyle}
Recovery Path: ${recoveryPath}
Assessment Summary: ${assessmentSummary}`;

  return { input, primaryIssue, secondaryIssue };
}
