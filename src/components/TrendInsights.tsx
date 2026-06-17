import { TrendResult } from "@/lib/engine";
import { EngineTag } from "./EngineBadge";
import { ENGINES } from "@/lib/brand";

// TREND INSIGHTS™ — deterministic prose + windowed momentum stats.
export function TrendInsights({ trends }: { trends: TrendResult }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <EngineTag name="Trend Analytics Engine™" className="mb-3" />
      <h2 className="font-semibold text-slate-900">Trend Insights™</h2>

      {trends.count < 2 ? (
        <p className="mt-2 text-sm text-slate-500">
          Retake the assessment to unlock trend insights and your Relationship Momentum™.
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-600">
            {trends.insights.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand-500">✦</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
            {[
              { l: "30-day", v: trends.thirtyDay },
              { l: "90-day", v: trends.ninetyDay },
              { l: "Lifetime", v: trends.lifetime },
              { l: "Fastest gain", v: trends.fastestImprovement, abs: true },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-slate-50 py-3">
                <div
                  className="font-bold"
                  style={{ color: s.v >= 0 ? "#10b981" : "#ef4444" }}
                >
                  {s.abs ? "" : s.v >= 0 ? "+" : ""}
                  {s.v}
                </div>
                <div className="text-slate-400">{s.l}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
