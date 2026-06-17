import { RelationshipIntelligence } from "@/lib/engine";
import { EngineTag, PoweredByEngine } from "./EngineBadge";
import { ENGINES } from "@/lib/brand";

function levelColor(level: string): string {
  switch (level) {
    case "Low":
    case "Very High":
    case "High":
    case "Thriving":
      return "#10b981";
    case "Moderate":
    case "Healthy":
      return "#3366ff";
    case "Needs Attention":
    case "Emotionally Distanced":
      return "#f59e0b";
    default:
      return "#ef4444";
  }
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: color || "#0f172a" }}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function IntelligencePanel({ intel }: { intel: RelationshipIntelligence }) {
  const { health, trustRisk, communication, stage, recovery, dna } = intel;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Relationship Intelligence™</h2>
        <PoweredByEngine className="mt-1.5" />
      </div>

      {/* Hero: stage + recovery */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-900 to-slate-800 p-7 text-white shadow-sm">
          <EngineTag name={ENGINES.stage.name} className="!border-white/15 !bg-white/10 !text-slate-300" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Relationship stage</p>
          <p className="mt-1 text-3xl font-extrabold">{stage.stage}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{stage.rationale}</p>
        </div>
        <div className="rounded-3xl border border-brand-100 bg-white p-7 shadow-sm">
          <EngineTag name={ENGINES.recovery.name} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Recovery potential</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-extrabold" style={{ color: levelColor(recovery.band) }}>
              {recovery.score}
            </span>
            <span className="mb-1 text-lg font-semibold text-slate-400">/100</span>
            <span
              className="mb-1.5 ml-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ backgroundColor: `${levelColor(recovery.band)}1a`, color: levelColor(recovery.band) }}
            >
              {recovery.band}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{recovery.summary}</p>
        </div>
      </div>

      {/* Key indices */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Overall health"
          value={`${health.overall}/100`}
          sub={health.bandLabel}
          color={levelColor(health.bandLabel)}
        />
        <Stat
          label="Trust risk"
          value={trustRisk.level}
          sub={`Index ${trustRisk.index}/100`}
          color={levelColor(trustRisk.level)}
        />
        <Stat
          label="Communication"
          value={communication.type}
          sub={`Primary: ${communication.primaryFailure}`}
          color={levelColor(communication.level)}
        />
        <Stat
          label="Repair capacity"
          value={`${communication.repairCapacity}/100`}
          sub="Ability to apologize & recover"
          color={levelColor(communication.repairCapacity >= 60 ? "High" : communication.repairCapacity >= 40 ? "Moderate" : "Severe")}
        />
      </div>

      {/* Trust drivers */}
      {trustRisk.drivers.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <EngineTag name={ENGINES.trust.name} className="mb-3" />
          <h3 className="font-semibold text-slate-900">Why your trust risk is {trustRisk.level}</h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
            {trustRisk.drivers.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand-500">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Relationship DNA */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <EngineTag name={ENGINES.dna.name} className="mb-3" />
        <h3 className="font-semibold text-slate-900">Your Relationship DNA™</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "Attachment", v: dna.attachmentStyle },
            { k: "Conflict", v: dna.conflictStyle },
            { k: "Communication", v: dna.communicationStyle },
            { k: "Connection", v: dna.connectionStyle },
          ].map((x) => (
            <div key={x.k} className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{x.k} style</p>
              <p className="mt-1 font-semibold text-slate-900">{x.v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Love-language indicators</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dna.loveLanguageIndicators.map((l) => (
              <span key={l.language} className="rounded-full bg-accent-500/10 px-3 py-1 text-sm font-medium text-accent-600">
                {l.language} · {l.strength}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stage movement */}
      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-6">
        <p className="text-sm font-semibold text-slate-900">Where you go from here</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">↗ {stage.toImprove}</p>
        {stage.warning && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">⚠ {stage.warning}</p>}
      </div>
    </section>
  );
}
