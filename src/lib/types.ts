import { ScoreResult } from "./scoring";

export interface AIAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  riskAreas: string[];
  recommendations: string[];
}

export interface PlanDay {
  day: number;
  title: string;
  dailyAction: string;
  conversationExercise: string;
  reflection: string;
  trustActivity: string;
}

export interface RecoveryPlan {
  horizon: 7 | 30 | 90;
  focus: string;
  days: PlanDay[];
}

export interface RecoveryPlans {
  sevenDay: RecoveryPlan;
  thirtyDay: RecoveryPlan;
  ninetyDay: RecoveryPlan;
}

export interface ReportPayload {
  scores: ScoreResult;
  analysis: AIAnalysis;
  plans?: RecoveryPlans;
}

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Coach OS: structured card outputs ─────────────────────
export type CoachCardType = "insight" | "action" | "script" | "task" | "warning";

export interface CoachCard {
  type: CoachCardType;
  title: string;
  body: string;
}

// Persisted card (with db id + task status), used by the workspace panels.
export interface StoredCoachCard extends CoachCard {
  id: string;
  session_id: string | null;
  status: "open" | "done";
  created_at: string;
}

export interface CoachSession {
  id: string;
  prompt: string;
  created_at: string;
}

export interface CoachResponse {
  cards: CoachCard[];
  question?: string;
}

export type SubscriptionStatus = "free" | "active" | "cancelled" | "past_due";
