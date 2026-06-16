"use client";

import Link from "next/link";
import { ScoreResult } from "@/lib/scoring";
import { track, EVENTS } from "@/lib/analytics";
import { useEffect } from "react";

const locked = [
  { icon: "🧠", title: "Full AI relationship analysis", body: "Strengths, weaknesses, risk areas, and prioritized recommendations." },
  { icon: "🗺️", title: "7 / 30 / 90-day recovery plans", body: "Daily actions, conversation scripts, reflections, and trust-building exercises." },
  { icon: "💬", title: "Unlimited AI coach", body: "Talk through hard moments and get communication scripts anytime." },
];

export function UpgradeCTA({ scores }: { scores: ScoreResult }) {
  useEffect(() => {
    track(EVENTS.UPGRADE_VIEW, { overall: scores.overall });
  }, [scores.overall]);

  const lowest = [...scores.categories].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-10 text-white">
        <h2 className="text-2xl font-bold">Unlock your full AI report</h2>
        <p className="mt-2 max-w-lg text-brand-100">
          Your lowest pillar right now is <strong>{lowest.label}</strong> ({lowest.score}/100).
          Premium gives you a clear plan to rebuild it.
        </p>
      </div>
      <div className="grid gap-5 p-8 sm:grid-cols-3">
        {locked.map((l) => (
          <div key={l.title} className="rounded-2xl bg-slate-50 p-5">
            <div className="text-2xl">{l.icon}</div>
            <h3 className="mt-3 font-semibold text-slate-900">{l.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{l.body}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-3 border-t border-slate-100 px-8 py-7 text-center">
        <p className="text-sm text-slate-500">Premium · ₹499/month · cancel anytime</p>
        <Link
          href="/pricing"
          onClick={() => track(EVENTS.UPGRADE_CLICK, { from: "results" })}
          className="rounded-full bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
        >
          Upgrade to Premium
        </Link>
      </div>
    </div>
  );
}
