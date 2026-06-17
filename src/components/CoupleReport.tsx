import { CoupleSyncResult } from "@/lib/engine";

const SEVERITY_COLOR: Record<string, string> = {
  Minor: "#10b981",
  Moderate: "#3366ff",
  Major: "#f59e0b",
  Critical: "#ef4444",
};

export function CoupleReport({
  sync,
  aiExplanation,
  inviterName,
  partnerName,
}: {
  sync: CoupleSyncResult;
  aiExplanation?: string;
  inviterName: string;
  partnerName: string;
}) {
  return (
    <div className="space-y-8">
      {/* Alignment hero */}
      <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-center text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Couple alignment</p>
        <p className="mt-1 text-5xl font-extrabold">{sync.alignmentScore}/100</p>
        <p className="mx-auto mt-3 max-w-lg text-sm text-brand-100">{sync.summary}</p>
      </div>

      {/* Gaps */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Where you each stand</h2>
        {sync.categoryGaps.map((g) => {
          const color = SEVERITY_COLOR[g.severity] || "#64748b";
          return (
            <div key={g.category} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{g.category}</span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: `${color}1a`, color }}>
                  {g.gap} pt gap · {g.severity}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { who: inviterName, val: g.partnerA },
                  { who: partnerName, val: g.partnerB },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-xs font-medium text-slate-500">{p.who}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${p.val}%`, backgroundColor: i === 0 ? "#1f49f5" : "#f4567c" }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-bold text-slate-700">{p.val}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI explanation */}
      {aiExplanation && (
        <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
          <h2 className="font-semibold text-slate-900">What this means for you two</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">{aiExplanation}</p>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Perception gap: {sync.perceptionGap} points ({sync.perceptionSeverity}). A gap reflects
        different experiences of the same relationship — not who is "right".
      </p>
    </div>
  );
}
