import { HistoryItem, bandColor } from "@/lib/history";
import { TrendResult } from "@/lib/engine";

// RELATIONSHIP JOURNEY™ — visual vertical timeline of overall scores.
export function RelationshipJourney({
  items,
  trends,
}: {
  items: HistoryItem[]; // newest first
  trends: TrendResult;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Relationship Journey™</h2>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            backgroundColor: trends.thirtyDay >= 0 ? "#10b98119" : "#ef444419",
            color: trends.thirtyDay >= 0 ? "#10b981" : "#ef4444",
          }}
        >
          {trends.thirtyDay >= 0 ? "+" : ""}
          {trends.thirtyDay} pts / 30 days
        </span>
      </div>

      <ol className="mt-5 space-y-0">
        {items.map((item, i) => (
          <li key={item.assessmentId} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className="grid h-5 w-5 place-items-center rounded-full ring-4 ring-white"
                style={{ backgroundColor: bandColor(item.overall) }}
              />
              {i < items.length - 1 && <span className="my-1 w-0.5 flex-1 bg-slate-100" />}
            </div>
            <div className="-mt-1 pb-5">
              <p className="text-sm font-bold text-slate-900">{item.overall}/100</p>
              <p className="text-xs text-slate-400">
                {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                {item.stage ? ` · ${item.stage}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center text-xs">
        <div>
          <div className="font-bold text-slate-900">{trends.best}</div>
          <div className="text-slate-400">Best ever</div>
        </div>
        <div>
          <div className="font-bold text-slate-900">{trends.worst}</div>
          <div className="text-slate-400">Lowest</div>
        </div>
        <div>
          <div className="font-bold text-slate-900">{trends.momentum}</div>
          <div className="text-slate-400">Momentum™</div>
        </div>
      </div>
    </div>
  );
}
