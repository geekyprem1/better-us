// TREND ANALYTICS ENGINE™ — windowed momentum + deterministic Trend Insights™.
// Works off the user's dated score history (no LLM cost).

export interface TrendPoint {
  date: string; // ISO
  overall: number;
  trust: number;
  communication: number;
  connection: number;
  intimacy: number;
}

export type Momentum = "Building" | "Steady" | "Slipping";

export interface TrendResult {
  count: number;
  thirtyDay: number; // overall delta over last 30 days
  ninetyDay: number;
  lifetime: number;
  best: number;
  worst: number;
  fastestImprovement: number; // biggest single jump between consecutive assessments
  longestDecline: number; // longest run of consecutive declines
  momentum: Momentum;
  insights: string[]; // Trend Insights™ (deterministic prose)
}

const CATS = ["trust", "communication", "connection", "intimacy"] as const;
const CAT_LABEL: Record<(typeof CATS)[number], string> = {
  trust: "Trust",
  communication: "Communication",
  connection: "Connection",
  intimacy: "Intimacy",
};

// Overall delta = latest minus the earliest point within `days` of now.
function windowDelta(points: TrendPoint[], days: number): number {
  if (points.length < 2) return 0;
  const cutoff = Date.now() - days * 86400000;
  const within = points.filter((p) => +new Date(p.date) >= cutoff);
  const base = within.length >= 2 ? within[0] : points[0];
  return points[points.length - 1].overall - base.overall;
}

function catDelta(points: TrendPoint[], cat: (typeof CATS)[number], days: number): number {
  if (points.length < 2) return 0;
  const cutoff = Date.now() - days * 86400000;
  const within = points.filter((p) => +new Date(p.date) >= cutoff);
  const base = within.length >= 2 ? within[0] : points[0];
  return points[points.length - 1][cat] - base[cat];
}

export function runTrends(history: TrendPoint[]): TrendResult {
  // history is chronological (oldest → newest).
  const points = [...history].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const n = points.length;
  const overalls = points.map((p) => p.overall);

  let fastestImprovement = 0;
  let longestDecline = 0;
  let curDecline = 0;
  for (let i = 1; i < n; i++) {
    const diff = overalls[i] - overalls[i - 1];
    if (diff > fastestImprovement) fastestImprovement = diff;
    if (diff < 0) {
      curDecline += 1;
      longestDecline = Math.max(longestDecline, curDecline);
    } else curDecline = 0;
  }

  // Momentum: direction of the last 3 assessments.
  let momentum: Momentum = "Steady";
  if (n >= 3) {
    const [a, b, c] = overalls.slice(-3);
    if (c > b && b > a) momentum = "Building";
    else if (c < b && b < a) momentum = "Slipping";
  }

  // ── Trend Insights™ (deterministic) ──
  const insights: string[] = [];
  if (n >= 2) {
    // Strongest mover over the last 30 days.
    const moves = CATS.map((c) => ({ cat: c, d: catDelta(points, c, 30) })).sort(
      (x, y) => Math.abs(y.d) - Math.abs(x.d),
    );
    const top = moves[0];
    if (Math.abs(top.d) >= 2) {
      insights.push(
        `Your ${CAT_LABEL[top.cat]} Score™ has ${top.d > 0 ? "improved" : "declined"} by ${Math.abs(top.d)} points over the past month.`,
      );
    }
    // Weakest pillar now.
    const latest = points[n - 1];
    const weakest = CATS.map((c) => ({ c, v: latest[c] })).sort((x, y) => x.v - y.v)[0];
    insights.push(
      `${CAT_LABEL[weakest.c]} remains your weakest pillar (${weakest.v}/100) and continues to limit overall relationship health.`,
    );
    // Divergence: communication up but connection down (classic pattern).
    const commD = catDelta(points, "communication", 30);
    const connD = catDelta(points, "connection", 30);
    if (commD >= 3 && connD <= -3) {
      insights.push(
        "Connection has declined despite stronger communication — conversations may be improving, but emotional closeness hasn't caught up yet.",
      );
    }
  }

  return {
    count: n,
    thirtyDay: windowDelta(points, 30),
    ninetyDay: windowDelta(points, 90),
    lifetime: n >= 2 ? overalls[n - 1] - overalls[0] : 0,
    best: n ? Math.max(...overalls) : 0,
    worst: n ? Math.min(...overalls) : 0,
    fastestImprovement,
    longestDecline,
    momentum,
    insights,
  };
}
