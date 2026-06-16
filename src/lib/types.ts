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

export type SubscriptionStatus = "free" | "active" | "cancelled" | "past_due";
