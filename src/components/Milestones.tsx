import { Milestone } from "@/lib/engine";

// MILESTONE SYSTEM™ — achievement badges that reward progress + reassessment.
export function Milestones({ milestones }: { milestones: Milestone[] }) {
  const achieved = milestones.filter((m) => m.achieved).length;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Milestones™</h2>
        <span className="text-xs font-semibold text-slate-400">
          {achieved} / {milestones.length} unlocked
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {milestones.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl border p-4 ${
              m.achieved ? "border-brand-200 bg-brand-50/50" : "border-slate-100 bg-slate-50 opacity-60"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-2xl ${m.achieved ? "" : "grayscale"}`}>{m.icon}</span>
              <span className="text-sm font-semibold text-slate-900">{m.name}</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{m.description}</p>
            {m.achieved && <p className="mt-1 text-xs font-bold text-brand-600">✓ Unlocked</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
