import { CoachSnapshot } from "@/lib/engine/context";

// Relationship Snapshot™ — at-a-glance status card under the overall score.
export function RelationshipSnapshot({ snapshot }: { snapshot: CoachSnapshot }) {
  const items: [string, string][] = [
    ["Stage", snapshot.stage],
    ["Recovery Potential", `${snapshot.recovery}%`],
    ["Trust Risk", snapshot.trustRisk],
    ["Current Focus", snapshot.currentFocus],
    ["Next Goal", snapshot.nextMilestone],
  ];
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">Relationship Snapshot™</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
