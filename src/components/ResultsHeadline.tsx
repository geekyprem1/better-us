import { RelationshipIntelligence } from "@/lib/engine";
import { relationshipHeadline } from "@/lib/engine/context";

// Phase 1 — the high-converting summary banner at the top of results.
export function ResultsHeadline({ intel }: { intel: RelationshipIntelligence }) {
  const h = relationshipHeadline(intel);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      {/* Status hero */}
      <div className="flex flex-col items-center gap-4 px-8 py-9 text-center sm:flex-row sm:text-left">
        <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(${h.statusColor} ${h.healthScore * 3.6}deg, #eef2f7 0deg)` }}>
          <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-white">
            <div>
              <div className="text-2xl font-extrabold text-slate-900">{h.healthScore}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">/ 100</div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Relationship Health
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <span className="text-3xl font-extrabold text-slate-900">{h.status}</span>
            <span
              className="rounded-full px-3 py-1 text-sm font-bold"
              style={{ backgroundColor: `${h.statusColor}1a`, color: h.statusColor }}
            >
              Recovery Potential: {h.recoveryLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Key stat strip */}
      <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 text-center md:grid-cols-4">
        {[
          { label: "Stability Score", value: `${h.stabilityScore}/100` },
          { label: "Recovery Potential", value: `${h.recoveryScore}/100` },
          { label: "Main Problem", value: h.mainProblem },
          { label: "Priority Focus", value: h.priorityFocus },
        ].map((s, i) => (
          <div key={i} className="px-4 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
