"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, SCALE, CATEGORIES, QUESTIONS_BY_CATEGORY, TOTAL_QUESTIONS, Category } from "@/lib/questions";
import { Answers, isComplete } from "@/lib/scoring";
import { track, EVENTS } from "@/lib/analytics";

const STORAGE_KEY = "betterus_assessment_answers";

type Phase = "q" | "transition" | "generating";

// What the engine calculates (shown subtly for intelligence positioning).
const CALCULATES = [
  "Relationship Stage™",
  "Trust Risk™",
  "Recovery Potential™",
  "Relationship DNA™",
  "Repair Capacity™",
  "Emotional Drift™",
];

// Smart progress label by question index (0-based).
function phaseLabel(index: number): string {
  if (index < 10) return "Analyzing Trust Patterns™";
  if (index < 20) return "Building Relationship DNA™";
  if (index < 30) return "Calculating Recovery Potential™";
  if (index < 39) return "Generating Relationship Intelligence™";
  return "Preparing Personalized Report™";
}

// Psychological booster / micro-feedback by 1-based question number.
function boosterLine(num: number): string | null {
  if (num === 10) return "25% complete — most people finish from here.";
  if (num === 20) return "Halfway there. Your report is taking shape.";
  if (num === 30) return "75% complete — your Relationship Intelligence Report™ is almost ready.";
  if (num >= 31 && num <= 39) return "Your strongest area and biggest growth opportunity are becoming clear.";
  if (num === 40) return "Final question — preparing your personalized insights.";
  return null;
}

const GEN_STEPS = [
  "Analyzing Trust™",
  "Analyzing Communication™",
  "Analyzing Connection™",
  "Analyzing Intimacy™",
  "Building Relationship DNA™",
  "Calculating Recovery Potential™",
  "Preparing Recovery Blueprint™",
];

const PILLAR_EMOJI: Record<Category, string> = {
  trust: "🔒",
  communication: "💬",
  connection: "🤝",
  intimacy: "❤️",
};

export function AssessmentFlow({
  coupleToken,
  partnerName,
}: {
  coupleToken?: string;
  partnerName?: string;
} = {}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("q");
  const [transitionTo, setTransitionTo] = useState<Category | null>(null);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAnswers(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    track(EVENTS.ASSESSMENT_START);
    setHydrated(true);
  }, []);

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
  const question = QUESTIONS[index];
  const complete = isComplete(answers);

  const pillar = useMemo(() => CATEGORIES.find((c) => c.key === question?.category), [question]);
  const pillarQuestions = question ? QUESTIONS_BY_CATEGORY[question.category].length : 0;
  const firstIndexOfPillar = question ? QUESTIONS.findIndex((q) => q.category === question.category) : 0;
  const posInPillar = index - firstIndexOfPillar + 1;
  const minutesLeft = Math.max(1, Math.ceil(((TOTAL_QUESTIONS - answeredCount) * 6) / 60));

  function persist(next: Answers) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function answer(value: number) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    persist(next);

    if (index >= TOTAL_QUESTIONS - 1) {
      // Last question answered → completion experience.
      setTimeout(() => setPhase("generating"), 220);
      return;
    }

    const nextQ = QUESTIONS[index + 1];
    if (nextQ.category !== question.category) {
      // Pillar transition screen.
      setTransitionTo(nextQ.category);
      setTimeout(() => setPhase("transition"), 200);
    } else {
      setTimeout(() => setIndex(index + 1), 200);
    }
  }

  // Advance out of a pillar transition after a short pause.
  useEffect(() => {
    if (phase !== "transition") return;
    const t = setTimeout(() => {
      setIndex((i) => Math.min(TOTAL_QUESTIONS - 1, i + 1));
      setPhase("q");
      setTransitionTo(null);
    }, 2600);
    return () => clearTimeout(t);
  }, [phase]);

  // Generating sequence + submit.
  useEffect(() => {
    if (phase !== "generating") return;
    setGenStep(0);
    const iv = setInterval(() => setGenStep((s) => Math.min(GEN_STEPS.length, s + 1)), 620);
    runSubmit();
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function runSubmit() {
    const started = Date.now();
    try {
      const target = await doSubmit(); // null = redirected (e.g. login)
      if (target === null) return;
      const wait = Math.max(0, 4000 - (Date.now() - started));
      setTimeout(() => router.push(target), wait);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("q");
    }
  }

  // Returns redirect target URL, or null if it already navigated.
  async function doSubmit(): Promise<string | null> {
    if (coupleToken) {
      const res = await fetch("/api/couple/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: coupleToken, answers, partnerName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to submit");
      track(EVENTS.ASSESSMENT_COMPLETE, { mode: "couple" });
      localStorage.removeItem(STORAGE_KEY);
      return `/couple/${coupleToken}/report`;
    }

    const res = await fetch("/api/assessment/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (res.status === 401) {
      router.push(`/login?redirect=${encodeURIComponent("/assessment")}`);
      return null;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error || "Failed to submit");
    track(EVENTS.ASSESSMENT_COMPLETE, { overall: data.scores?.overall });
    localStorage.removeItem(STORAGE_KEY);
    return `/results/${data.assessmentId}`;
  }

  if (!hydrated) {
    return <div className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />;
  }

  // ── GENERATING REPORT (completion experience) ──────────────
  if (phase === "generating") {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          BetterUs Relationship Intelligence Engine™
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Generating your Relationship Intelligence Report™
        </h2>
        <div className="mt-7 space-y-3">
          {GEN_STEPS.map((step, i) => {
            const done = i < genStep;
            const current = i === genStep;
            return (
              <div key={step} className="flex items-center gap-3">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${
                    done ? "bg-emerald-500 text-white" : current ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? "✓" : current ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : i + 1}
                </span>
                <span className={`text-sm ${done || current ? "font-medium text-slate-800" : "text-slate-400"}`}>{step}</span>
              </div>
            );
          })}
        </div>
        {error && <p className="mt-5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // ── PILLAR TRANSITION ──────────────────────────────────────
  if (phase === "transition" && transitionTo) {
    const fromPillar = pillar;
    const toPillar = CATEGORIES.find((c) => c.key === transitionTo)!;
    return (
      <div className="animate-fade-up rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-3xl">✓</div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">{fromPillar?.label} Analysis Complete™</h2>
        <p className="mt-2 text-sm text-slate-500">Signals detected and recorded.</p>
        <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full animate-[fade-up_2.4s_linear] rounded-full bg-brand-600" style={{ width: "100%" }} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">Next</p>
        <p className="text-lg font-semibold text-brand-700">
          {PILLAR_EMOJI[toPillar.key]} {toPillar.label} Patterns™
        </p>
        <button
          onClick={() => {
            setIndex((i) => Math.min(TOTAL_QUESTIONS - 1, i + 1));
            setPhase("q");
            setTransitionTo(null);
          }}
          className="mt-5 text-sm font-semibold text-slate-400 hover:text-slate-700"
        >
          Continue →
        </button>
      </div>
    );
  }

  // ── FINAL CTA (resume case: complete on load) ──────────────
  if (complete && answers[question.id] && index >= TOTAL_QUESTIONS - 1) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-3xl">✓</div>
        <h2 className="mt-6 text-2xl font-bold text-slate-900">All 40 answers recorded</h2>
        <p className="mt-2 text-slate-600">Let's generate your Relationship Intelligence Report™.</p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          onClick={() => setPhase("generating")}
          className="mt-7 rounded-full bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
        >
          See my report
        </button>
      </div>
    );
  }

  const booster = boosterLine(index + 1);

  // ── QUESTION ───────────────────────────────────────────────
  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-4 mb-5 bg-soft/95 px-4 pb-3 pt-2 backdrop-blur sm:mx-0 sm:px-0">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">
              {PILLAR_EMOJI[question.category]} {pillar?.label} Pillar™
            </p>
            <p className="text-xs text-slate-400">
              {pillarQuestions} questions · Question {index + 1} of {TOTAL_QUESTIONS}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-brand-600">{progress}%</p>
            <p className="text-xs text-slate-400">~{minutesLeft} min left</p>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-[11px] font-medium text-slate-400">
          <span className="text-brand-500">◆</span> {phaseLabel(index)} · Powered by the BetterUs Relationship Intelligence Engine™
        </p>
      </div>

      {booster && (
        <div className="mb-4 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-medium text-brand-700 animate-fade-up">
          {booster}
        </div>
      )}

      {/* Question card */}
      <div key={question.id} className="animate-fade-up rounded-3xl border border-slate-100 bg-white p-7 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{pillar?.label} · {posInPillar}/{pillarQuestions}</p>
        <h2 className="mt-3 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">{question.text}</h2>

        <div className="mt-8 space-y-3">
          {SCALE.map((opt) => {
            const selected = answers[question.id] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => answer(opt.value)}
                className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left text-sm font-medium transition active:scale-[0.99] ${
                  selected
                    ? "border-brand-500 bg-brand-50 text-brand-700 shadow-[0_0_0_3px_rgba(51,102,255,0.15)]"
                    : "border-slate-200 text-slate-700 hover:border-brand-200 hover:bg-slate-50"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${
                    selected ? "border-brand-500 bg-brand-600 text-white" : "border-slate-300 text-slate-400"
                  }`}
                >
                  {opt.value}
                </span>
              </button>
            );
          })}
        </div>

        {/* Not sure (replaces Skip — stores neutral) */}
        <button
          onClick={() => answer(3)}
          className="mt-5 w-full text-center text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          Not sure — skip with a neutral answer
        </button>
      </div>

      {/* Nav + trust builders */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-40"
        >
          ← Back
        </button>
        <span className="text-xs text-slate-400">{TOTAL_QUESTIONS - answeredCount} questions remaining</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
        <span>🔒 100% Private</span>
        <span>· No partner notification</span>
        <span>· Encrypted</span>
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-300">
        Calculates: {CALCULATES.join(" · ")}
      </p>
    </div>
  );
}
