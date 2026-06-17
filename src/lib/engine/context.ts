// Builds the "# BETTERUS INTELLIGENCE ENGINE INPUT" block for the coach prompt,
// filling every {{placeholder}} deterministically from the engine output.

import { RelationshipIntelligence } from "./index";

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
