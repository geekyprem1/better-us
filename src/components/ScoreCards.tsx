import { ScoreResult, BAND_META } from "@/lib/scoring";

function Ring({ score, size = 120 }: { score: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const band = score < 40 ? "critical" : score < 60 ? "at-risk" : score < 80 ? "stable" : "thriving";
  const color = BAND_META[band as keyof typeof BAND_META].color;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="rotate-90 fill-slate-900 text-xl font-bold"
        style={{ transformOrigin: "center" }}
      >
        {score}
      </text>
    </svg>
  );
}

export function OverallScore({ scores }: { scores: ScoreResult }) {
  const band = scores.overall < 40 ? "critical" : scores.overall < 60 ? "at-risk" : scores.overall < 80 ? "stable" : "thriving";
  const meta = BAND_META[band as keyof typeof BAND_META];
  return (
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:flex-row sm:gap-8">
      <Ring score={scores.overall} size={150} />
      <div className="text-center sm:text-left">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Overall relationship health
        </p>
        <p className="mt-1 text-4xl font-extrabold text-slate-900">{scores.overall}/100</p>
        <span
          className="mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold"
          style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
        >
          {meta.label}
        </span>
      </div>
    </div>
  );
}

export function CategoryCards({ scores }: { scores: ScoreResult }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {scores.categories.map((c) => {
        const meta = BAND_META[c.band];
        return (
          <div key={c.category} className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
            <Ring score={c.score} size={104} />
            <h3 className="mt-3 font-semibold text-slate-900">{c.label}</h3>
            <span className="mt-1 text-xs font-medium" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
