import { BRAND } from "@/lib/brand";

// Small monochrome chip naming a proprietary engine, e.g. "Trust Risk Engine™".
export function EngineTag({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ${className}`}
    >
      <span className="text-brand-600">◆</span>
      {name}
    </span>
  );
}

// "Powered by the BetterUs Relationship Intelligence Engine™" line + version pill.
export function PoweredByEngine({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs text-slate-400 ${className}`}>
      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        Engine {BRAND.engineVersion}
      </span>
      <span>{BRAND.poweredBy}</span>
    </div>
  );
}
