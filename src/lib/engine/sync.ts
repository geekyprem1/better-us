// ENGINE 7 — COUPLE SYNC ENGINE™
// Compares two partners' assessments and surfaces *perception gaps*. A large
// gap means the partners experience the relationship very differently — often
// a bigger predictor of conflict than either partner's absolute scores.

export type GapSeverity = "Minor" | "Moderate" | "Major" | "Critical";

export interface CategoryGap {
  category: string;
  partnerA: number;
  partnerB: number;
  gap: number; // absolute difference
  severity: GapSeverity;
  lowerPartner: "A" | "B" | "Even";
}

export interface CoupleSyncResult {
  categoryGaps: CategoryGap[];
  perceptionGap: number; // |overallA - overallB|
  perceptionSeverity: GapSeverity;
  alignmentScore: number; // 0..100, 100 = perfectly aligned
  summary: string;
}

interface PartnerScores {
  trust: number;
  communication: number;
  connection: number;
  intimacy: number;
  overall: number;
}

export function gapSeverity(gap: number): GapSeverity {
  if (gap >= 30) return "Critical";
  if (gap >= 20) return "Major";
  if (gap >= 10) return "Moderate";
  return "Minor";
}

export function runCoupleSync(a: PartnerScores, b: PartnerScores): CoupleSyncResult {
  const cats = ["trust", "communication", "connection", "intimacy"] as const;
  const labels: Record<(typeof cats)[number], string> = {
    trust: "Trust",
    communication: "Communication",
    connection: "Connection",
    intimacy: "Intimacy",
  };

  const categoryGaps: CategoryGap[] = cats.map((c) => {
    const gap = Math.abs(a[c] - b[c]);
    return {
      category: labels[c],
      partnerA: a[c],
      partnerB: b[c],
      gap,
      severity: gapSeverity(gap),
      lowerPartner: a[c] === b[c] ? "Even" : a[c] < b[c] ? "A" : "B",
    };
  });

  const perceptionGap = Math.abs(a.overall - b.overall);
  const avgGap =
    categoryGaps.reduce((acc, g) => acc + g.gap, 0) / categoryGaps.length;
  const alignmentScore = Math.round(Math.max(0, 100 - avgGap * 2)); // 50-pt gap → 0

  const biggest = [...categoryGaps].sort((x, y) => y.gap - x.gap)[0];
  const summary =
    biggest.gap < 10
      ? "You two see the relationship very similarly — strong shared perception."
      : `Your biggest perception gap is in ${biggest.category} (${biggest.gap} points). Partner ${biggest.lowerPartner} feels it more acutely — that's the conversation to have first.`;

  return {
    categoryGaps,
    perceptionGap,
    perceptionSeverity: gapSeverity(perceptionGap),
    alignmentScore,
    summary,
  };
}
