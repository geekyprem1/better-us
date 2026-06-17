import Link from "next/link";
import { HistoryItem, bandColor } from "@/lib/history";

function Delta({ label, value }: { label: string; value: number }) {
  const arrow = value > 0 ? "▲" : value < 0 ? "▼" : "→";
  const color = value > 0 ? "#10b981" : value < 0 ? "#ef4444" : "#94a3b8";
  const text = value === 0 ? "unchanged" : `${value > 0 ? "+" : ""}${value}`;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
      {arrow} {label} {text}
    </span>
  );
}

// ASSESSMENT HISTORY™ — timeline cards, newest first, with deltas vs. previous.
export function AssessmentHistory({
  items,
  premium,
}: {
  items: HistoryItem[]; // newest first
  premium: boolean;
}) {
  const total = items.length;
  const visible = premium ? items : items.slice(0, 2);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">Assessment History™</h2>
      <p className="mt-1 text-sm text-slate-500">Your relationship health record over time.</p>

      <div className="mt-5 space-y-3">
        {visible.map((item, i) => {
          const prev = items[i + 1]; // chronologically older
          const num = total - i;
          return (
            <div key={item.assessmentId} className="rounded-2xl border border-slate-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: bandColor(item.overall) }}
                  >
                    {item.overall}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">Assessment #{num}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {item.stage && <span className="font-semibold text-slate-700">{item.stage}</span>}
                  {typeof item.recovery === "number" && <span>Recovery™ {item.recovery}</span>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  ["Trust", item.trust],
                  ["Comm", item.communication],
                  ["Connect", item.connection],
                  ["Intimacy", item.intimacy],
                ].map(([l, v]) => (
                  <div key={l as string} className="rounded-lg bg-slate-50 py-2">
                    <div className="font-bold text-slate-900">{v}</div>
                    <div className="text-slate-400">{l}</div>
                  </div>
                ))}
              </div>

              {prev && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3">
                  <Delta label="Trust" value={item.trust - prev.trust} />
                  <Delta label="Comm" value={item.communication - prev.communication} />
                  <Delta label="Connect" value={item.connection - prev.connection} />
                  <Delta label="Intimacy" value={item.intimacy - prev.intimacy} />
                </div>
              )}

              <Link
                href={`/results/${item.assessmentId}`}
                className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline"
              >
                View Full Report →
              </Link>
            </div>
          );
        })}
      </div>

      {!premium && total > 2 && (
        <div className="mt-4 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-5 text-center">
          <p className="text-sm font-medium text-slate-700">
            {total - 2} more assessment{total - 2 > 1 ? "s" : ""} in your history.
          </p>
          <Link href="/pricing" className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline">
            Unlock unlimited history with Premium →
          </Link>
        </div>
      )}
    </div>
  );
}
