"use client";

import { useEffect, useState } from "react";
import { AIAnalysis, RecoveryPlans, RecoveryPlan } from "@/lib/types";
import { Markdown } from "./Markdown";

function List({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900">
        <span className={`h-2.5 w-2.5 rounded-full ${tone}`} /> {title}
      </h3>
      <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
        {items?.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-brand-500">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanView({ plan }: { plan: RecoveryPlan }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-500">{plan.focus}</p>
      <div className="space-y-3">
        {plan.days?.map((d) => (
          <details key={d.day} className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900">
              <span>
                <span className="mr-2 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                  Day {d.day}
                </span>
                {d.title}
              </span>
              <span className="text-slate-300 group-open:rotate-180">▾</span>
            </summary>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div><span className="font-semibold text-slate-800">🎯 Daily action: </span>{d.dailyAction}</div>
              <div><span className="font-semibold text-slate-800">💬 Conversation: </span>{d.conversationExercise}</div>
              <div><span className="font-semibold text-slate-800">📓 Reflection: </span>{d.reflection}</div>
              <div><span className="font-semibold text-slate-800">🤝 Trust activity: </span>{d.trustActivity}</div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

export function ReportSection({
  assessmentId,
  initialAnalysis,
  initialPlans,
}: {
  assessmentId: string;
  initialAnalysis?: AIAnalysis;
  initialPlans?: RecoveryPlans;
}) {
  const [analysis, setAnalysis] = useState<AIAnalysis | undefined>(initialAnalysis);
  const [plans, setPlans] = useState<RecoveryPlans | undefined>(initialPlans);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<7 | 30 | 90>(7);

  useEffect(() => {
    if (analysis && plans) return;
    setLoading(true);
    fetch("/api/report/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.detail || data.error);
        setAnalysis(data.analysis);
        setPlans(data.plans);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
        <p className="mt-4 font-medium text-slate-700">Your AI coach is preparing your report…</p>
        <p className="mt-1 text-sm text-slate-400">This usually takes 15–30 seconds.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
        We couldn't generate your report: {error}
      </div>
    );
  }

  if (!analysis || !plans) return null;

  const planMap: Record<number, RecoveryPlan> = {
    7: plans.sevenDay,
    30: plans.thirtyDay,
    90: plans.ninetyDay,
  };

  return (
    <div className="space-y-10">
      {/* Analysis */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">Your AI relationship analysis</h2>
        <div className="rounded-2xl border border-slate-100 bg-white p-7 text-slate-700 shadow-sm">
          <Markdown>{analysis.summary}</Markdown>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <List title="Strengths" items={analysis.strengths} tone="bg-emerald-500" />
          <List title="Growth areas" items={analysis.weaknesses} tone="bg-amber-500" />
          <List title="Risk areas" items={analysis.riskAreas} tone="bg-red-500" />
          <List title="Recommendations" items={analysis.recommendations} tone="bg-brand-500" />
        </div>
      </section>

      {/* Recovery plans */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">Your personalized recovery plan</h2>
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
          {([7, 30, 90] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                horizon === h ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {h}-Day
            </button>
          ))}
        </div>
        <PlanView plan={planMap[horizon]} />
      </section>
    </div>
  );
}
