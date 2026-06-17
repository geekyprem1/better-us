// ════════════════════════════════════════════════════════════════
// BetterUs Relationship Intelligence Engine™ — ORCHESTRATOR
// One deterministic call turns 40 answers into the full intelligence
// profile. Engines 7 (Couple Sync) and 8 (Emotional Drift) need multiple
// inputs and are exported separately.
// ════════════════════════════════════════════════════════════════

import { Answers } from "../scoring";
import { answeredFraction, pct } from "./core";
import { runHealth, HealthResult } from "./health";
import { runTrustRisk, TrustRiskResult } from "./trust";
import { runCommunication, CommunicationResult } from "./communication";
import { runStage, StageResult } from "./stage";
import { runRecovery, RecoveryResult } from "./recovery";
import { runDNA, DNAResult } from "./dna";

export const ENGINE_VERSION = "1.0.0";

export interface RelationshipIntelligence {
  version: string;
  confidence: number; // 0..100, from answer completeness
  health: HealthResult;
  trustRisk: TrustRiskResult;
  communication: CommunicationResult;
  stage: StageResult;
  recovery: RecoveryResult;
  dna: DNAResult;
}

// The single entry point used after an assessment is submitted.
export function runIntelligence(answers: Answers): RelationshipIntelligence {
  const health = runHealth(answers);
  const trustRisk = runTrustRisk(answers);
  const communication = runCommunication(answers);
  const stage = runStage(health, trustRisk, communication);
  const recovery = runRecovery(answers, health, stage.stage);
  const dna = runDNA(answers);

  return {
    version: ENGINE_VERSION,
    confidence: pct(answeredFraction(answers)),
    health,
    trustRisk,
    communication,
    stage,
    recovery,
    dna,
  };
}

// Re-exports
export * from "./core";
export * from "./health";
export * from "./trust";
export * from "./communication";
export * from "./stage";
export * from "./recovery";
export * from "./dna";
export { runCoupleSync, type CoupleSyncResult, type CategoryGap, type GapSeverity } from "./sync";
export { runDrift, type DriftResult, type DimensionDrift, type Trend, type ScoreSnapshot } from "./drift";
export { runTrends, type TrendResult, type TrendPoint, type Momentum } from "./trends";
export { runMilestones, type Milestone } from "./milestones";
