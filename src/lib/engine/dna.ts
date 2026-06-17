// ENGINE 6 — RELATIONSHIP DNA ENGINE™
// Builds a deterministic relationship profile: attachment, conflict,
// communication, and connection styles + love-language indicators.
// These are rule-based readings of the facet signals, each with a confidence
// derived from how many underlying questions were answered.

import { Answers } from "../scoring";
import { facetReading, questionHealth, mean, pct } from "./core";

export interface DNAResult {
  attachmentStyle: string;
  conflictStyle: string;
  communicationStyle: string;
  connectionStyle: string;
  loveLanguageIndicators: { language: string; strength: number }[];
}

function h(id: string, a: Answers) {
  return questionHealth(id, a) ?? 0.5;
}

export function runDNA(answers: Answers): DNAResult {
  const insecurity = facetReading("trust_insecurity", answers).risk;
  const fearVuln = facetReading("trust_fearVuln", answers).risk;
  const closeness = facetReading("conn_closeness", answers).health;

  const avoidance = facetReading("comm_avoidance", answers).risk;
  const escalation = facetReading("comm_escalation", answers).risk;
  const stonewalling = facetReading("comm_stonewalling", answers).risk;
  const defensiveness = facetReading("comm_defensiveness", answers).risk;
  const repair = facetReading("comm_repair", answers).health;

  // ── Attachment style ──────────────────────────────────────────
  let attachmentStyle: string;
  if (insecurity >= 0.5 && fearVuln >= 0.5) attachmentStyle = "Fearful-Avoidant (Disorganized)";
  else if (insecurity >= 0.5 && closeness >= 0.5) attachmentStyle = "Anxious-Preoccupied";
  else if (fearVuln >= 0.5 && closeness < 0.5) attachmentStyle = "Dismissive-Avoidant";
  else if (insecurity < 0.4 && fearVuln < 0.4) attachmentStyle = "Secure";
  else attachmentStyle = "Earning Secure (Mixed)";

  // ── Conflict style ────────────────────────────────────────────
  let conflictStyle: string;
  if (escalation >= 0.5 && defensiveness >= 0.45) conflictStyle = "Competitive / Volatile";
  else if (avoidance >= 0.5 || stonewalling >= 0.5) conflictStyle = "Avoidant / Withdrawing";
  else if (repair >= 0.6 && escalation < 0.4) conflictStyle = "Collaborative";
  else conflictStyle = "Accommodating";

  // ── Communication style ───────────────────────────────────────
  const expressSafely = h("c2", answers); // can express feelings without fear
  const goesSilent = facetReading("comm_stonewalling", answers).risk;
  let communicationStyle: string;
  if (expressSafely >= 0.6 && escalation < 0.5) communicationStyle = "Assertive";
  else if (escalation >= 0.5 && h("c10", answers) < 0.5) communicationStyle = "Aggressive";
  else if (avoidance >= 0.5 && escalation >= 0.4) communicationStyle = "Passive-Aggressive";
  else communicationStyle = "Passive";

  // ── Connection style ──────────────────────────────────────────
  const growthApart = facetReading("conn_growthApart", answers).risk;
  const companionship = facetReading("conn_companionship", answers).health;
  let connectionStyle: string;
  if (growthApart >= 0.5) connectionStyle = "Drifting";
  else if (companionship >= 0.65 && closeness >= 0.6) connectionStyle = "Companionate";
  else connectionStyle = "Independent";

  // ── Love-language indicators ──────────────────────────────────
  // Indicative, not definitive — surfaced by which channels score strongest.
  const candidates = [
    { language: "Quality Time", strength: h("n2", answers) },
    { language: "Physical Touch", strength: mean([h("i1", answers), h("i5", answers)]) },
    { language: "Words of Affirmation", strength: mean([h("i3", answers), h("c7", answers)]) },
    { language: "Acts of Service", strength: mean([h("t2", answers), h("t3", answers)]) },
    { language: "Emotional Presence", strength: mean([h("n7", answers), h("n1", answers)]) },
  ];
  const loveLanguageIndicators = candidates
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 2)
    .map((c) => ({ language: c.language, strength: pct(c.strength) }));

  return {
    attachmentStyle,
    conflictStyle,
    communicationStyle,
    connectionStyle,
    loveLanguageIndicators,
  };
}
