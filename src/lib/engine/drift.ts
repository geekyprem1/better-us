// ENGINE 8 — EMOTIONAL DRIFT ENGINE™
// Tracks how each dimension moves across repeated assessments over time.
// Uses least-squares linear regression on the score history to get a robust
// slope (points per assessment), then classifies the trend.

export type Trend =
  | "Rapid Improvement"
  | "Improving"
  | "Plateau"
  | "Declining"
  | "Rapid Decline"
  | "Insufficient Data";

export interface DimensionDrift {
  dimension: string;
  first: number;
  latest: number;
  delta: number; // latest - first
  slope: number; // points per assessment (regression)
  trend: Trend;
}

export interface DriftResult {
  dimensions: DimensionDrift[];
  overallTrend: Trend;
  summary: string;
}

export interface ScoreSnapshot {
  trust: number;
  communication: number;
  connection: number;
  intimacy: number;
  overall: number;
}

const SLOPE_THRESHOLD = 1.5; // points/assessment to count as real movement
const RAPID_THRESHOLD = 5; // points/assessment = rapid movement

// Least-squares slope of y over index x = 0..n-1.
function slope(ys: number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (ys[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function classify(s: number, n: number): Trend {
  if (n < 2) return "Insufficient Data";
  if (s >= RAPID_THRESHOLD) return "Rapid Improvement";
  if (s >= SLOPE_THRESHOLD) return "Improving";
  if (s <= -RAPID_THRESHOLD) return "Rapid Decline";
  if (s <= -SLOPE_THRESHOLD) return "Declining";
  return "Plateau";
}

export function runDrift(history: ScoreSnapshot[]): DriftResult {
  const dims = ["trust", "communication", "connection", "intimacy", "overall"] as const;
  const labels: Record<(typeof dims)[number], string> = {
    trust: "Trust",
    communication: "Communication",
    connection: "Connection",
    intimacy: "Intimacy",
    overall: "Overall",
  };
  const n = history.length;

  const dimensions: DimensionDrift[] = dims.map((d) => {
    const series = history.map((h) => h[d]);
    const s = slope(series);
    return {
      dimension: labels[d],
      first: series[0] ?? 0,
      latest: series[n - 1] ?? 0,
      delta: n ? (series[n - 1] ?? 0) - (series[0] ?? 0) : 0,
      slope: Math.round(s * 10) / 10,
      trend: classify(s, n),
    };
  });

  const overall = dimensions.find((d) => d.dimension === "Overall")!;
  const summary =
    n < 2
      ? "Take the assessment again over time to unlock trend tracking."
      : overall.trend === "Improving" || overall.trend === "Rapid Improvement"
        ? `Your relationship is trending up — overall health has moved ${overall.delta >= 0 ? "+" : ""}${overall.delta} points since you started.`
        : overall.trend === "Declining" || overall.trend === "Rapid Decline"
          ? `Heads up: overall health has slipped ${overall.delta} points. Worth addressing the declining areas now.`
          : "Your scores are holding steady. Stability is fine — but deliberate effort is what creates upward movement.";

  return { dimensions, overallTrend: overall.trend, summary };
}
