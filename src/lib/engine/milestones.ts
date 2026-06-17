// MILESTONE SYSTEM™ — deterministic relationship achievements that reward
// progress and reassessment (retention).

import { TrendPoint } from "./trends";

export interface Milestone {
  id: string;
  name: string;
  icon: string;
  description: string;
  achieved: boolean;
}

export function runMilestones(history: TrendPoint[]): Milestone[] {
  const points = [...history].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const n = points.length;
  const first = points[0];
  const last = points[n - 1];

  const lifeDelta = (k: keyof TrendPoint) =>
    n >= 2 ? (last[k] as number) - (first[k] as number) : 0;

  // Overall improved for 3 consecutive assessments.
  let recoveryMomentum = false;
  if (n >= 3) {
    const o = points.map((p) => p.overall);
    for (let i = 2; i < o.length; i++) {
      if (o[i] > o[i - 1] && o[i - 1] > o[i - 2]) recoveryMomentum = true;
    }
  }

  return [
    {
      id: "trust_rebuilder",
      name: "Trust Rebuilder™",
      icon: "🔒",
      description: "Trust improved by 10+ points.",
      achieved: lifeDelta("trust") >= 10,
    },
    {
      id: "communication_breakthrough",
      name: "Communication Breakthrough™",
      icon: "💬",
      description: "Communication improved by 15+ points.",
      achieved: lifeDelta("communication") >= 15,
    },
    {
      id: "connection_restored",
      name: "Connection Restored™",
      icon: "🤝",
      description: "Connection improved by 20+ points.",
      achieved: lifeDelta("connection") >= 20,
    },
    {
      id: "consistency_champion",
      name: "Consistency Champion™",
      icon: "🔥",
      description: "Completed 3 assessments.",
      achieved: n >= 3,
    },
    {
      id: "recovery_momentum",
      name: "Recovery Momentum™",
      icon: "🚀",
      description: "Overall score improved 3 assessments in a row.",
      achieved: recoveryMomentum,
    },
  ];
}
