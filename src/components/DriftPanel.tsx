import { runDrift, ScoreSnapshot } from "@/lib/engine";
import { EngineTag } from "./EngineBadge";
import { ENGINES } from "@/lib/brand";

const TREND_META: Record<string, { icon: string; color: string }> = {
  Improving: { icon: "↗", color: "#10b981" },
  Declining: { icon: "↘", color: "#ef4444" },
  Plateau: { icon: "→", color: "#f59e0b" },
  "Insufficient Data": { icon: "•", color: "#94a3b8" },
};

// Phase 6 — Emotional Drift Engine™: trend per dimension over retakes.
export function DriftPanel({ history }: { history: ScoreSnapshot[] }) {
  const drift = runDrift(history);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <EngineTag name={ENGINES.drift.name} className="mb-3" />
      <h2 className="font-semibold text-slate-900">Relationship momentum</h2>
      <p className="mt-1 text-sm text-slate-500">{drift.summary}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {drift.dimensions.map((d) => {
          const meta = TREND_META[d.trend] ?? TREND_META["Insufficient Data"];
          return (
            <div key={d.dimension} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {d.dimension}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-bold" style={{ color: meta.color }}>
                  {meta.icon} {d.latest}
                </span>
                {history.length > 1 && (
                  <span className="text-xs font-medium" style={{ color: meta.color }}>
                    {d.delta >= 0 ? "+" : ""}
                    {d.delta}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px]" style={{ color: meta.color }}>
                {d.trend}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
