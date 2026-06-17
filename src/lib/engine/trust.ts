// ENGINE 2 — TRUST RISK ENGINE™
// Decomposes trust into five risk facets and produces an explainable index.

import { Answers } from "../scoring";
import { Facet, facetReading, pct, round } from "./core";

export type TrustRiskLevel = "Low" | "Moderate" | "High" | "Severe";

export interface TrustRiskResult {
  index: number; // 0..100, higher = more risk
  level: TrustRiskLevel;
  facets: { facet: string; risk: number; weight: number }[];
  drivers: string[]; // human explanations of *why* risk exists
}

// Facet → weight in the trust risk index. Broken trust and secrecy are the
// most corrosive, so they dominate.
const FACET_WEIGHTS: { facet: Facet; weight: number; label: string }[] = [
  { facet: "trust_broken", weight: 0.25, label: "Broken / unhealed trust" },
  { facet: "trust_secrecy", weight: 0.25, label: "Secrecy & suspicion" },
  { facet: "trust_insecurity", weight: 0.2, label: "Insecurity" },
  { facet: "trust_reliability", weight: 0.15, label: "Reliability gaps" },
  { facet: "trust_fearVuln", weight: 0.15, label: "Fear of vulnerability" },
];

const DRIVER_TEXT: Record<string, string> = {
  trust_broken:
    "Past conflicts still cast a shadow — old wounds haven't fully healed, which keeps trust fragile.",
  trust_secrecy:
    "There are signs of suspicion or perceived secrecy; transparency feels incomplete.",
  trust_insecurity:
    "A sense of insecurity about where the relationship stands is undermining felt safety.",
  trust_reliability:
    "Reliability is shaky — promises and follow-through don't always feel dependable.",
  trust_fearVuln:
    "Opening up feels unsafe, so emotional walls are limiting how deep trust can go.",
};

function riskLevel(index: number): TrustRiskLevel {
  if (index >= 75) return "Severe";
  if (index >= 50) return "High";
  if (index >= 25) return "Moderate";
  return "Low";
}

export function runTrustRisk(answers: Answers): TrustRiskResult {
  const facets = FACET_WEIGHTS.map(({ facet, weight, label }) => ({
    facet: label,
    key: facet,
    risk: facetReading(facet, answers).risk,
    weight,
  }));

  const index = round(pct(facets.reduce((acc, f) => acc + f.risk * f.weight, 0)));

  // Explain the top contributing facets (risk ≥ 0.45), strongest first.
  const drivers = facets
    .filter((f) => f.risk >= 0.45)
    .sort((a, b) => b.risk - a.risk)
    .map((f) => DRIVER_TEXT[f.key]);

  return {
    index,
    level: riskLevel(index),
    facets: facets.map(({ facet, risk, weight }) => ({ facet, risk: pct(risk), weight })),
    drivers: drivers.length ? drivers : ["Trust signals are broadly healthy with no dominant risk facet."],
  };
}
