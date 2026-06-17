"use client";

import { useEffect, useState } from "react";
import { ScoreResult } from "@/lib/scoring";
import { PricingModal } from "./PricingModal";
import { track, EVENTS } from "@/lib/analytics";

const unlocks = [
  "Full AI Relationship Analysis",
  "7-Day Recovery Plan",
  "30-Day Recovery Plan",
  "90-Day Recovery Plan",
  "AI Relationship Coach",
];

// Phase 2 — blurs the premium report and overlays the conversion CTA.
export function Paywall({ scores, isLoggedIn }: { scores: ScoreResult; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const lowest = [...scores.categories].sort((a, b) => a.score - b.score)[0];

  useEffect(() => {
    track(EVENTS.PAYWALL_VIEW, { overall: scores.overall });
  }, [scores.overall]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-100">
      {/* Blurred fake preview */}
      <div aria-hidden className="pointer-events-none select-none blur-[6px]">
        <div className="space-y-4 bg-white p-8">
          <div className="h-7 w-64 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-11/12 rounded bg-slate-100" />
          <div className="h-4 w-10/12 rounded bg-slate-100" />
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-slate-100 p-5">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-5/6 rounded bg-slate-100" />
                <div className="h-3 w-4/6 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/40 to-white/90 p-6">
        <div className="w-full max-w-md rounded-3xl border border-brand-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-2xl">🔓</div>
          <h3 className="mt-4 text-xl font-bold text-slate-900">Unlock Your Personalized Recovery Plan</h3>
          <p className="mt-1 text-sm text-slate-500">
            Your weakest area is <strong>{lowest.label}</strong> ({lowest.score}/100). Here's your plan to fix it.
          </p>
          <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm text-slate-700">
            {unlocks.map((u) => (
              <li key={u} className="flex gap-2">
                <span className="text-brand-600">✓</span> {u}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setOpen(true)}
            className="mt-6 w-full rounded-full bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
          >
            Unlock from ₹299/mo
          </button>
          <p className="mt-2 text-xs text-slate-400">Lifetime access ₹999 · launch offer</p>
        </div>
      </div>

      <PricingModal open={open} onClose={() => setOpen(false)} isLoggedIn={isLoggedIn} />
    </div>
  );
}
