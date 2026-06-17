"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, SCALE, CATEGORIES, TOTAL_QUESTIONS } from "@/lib/questions";
import { Answers, isComplete } from "@/lib/scoring";
import { track, EVENTS } from "@/lib/analytics";

const STORAGE_KEY = "betterus_assessment_answers";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load any answers saved before login, and track assessment start once.
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

  const categoryMeta = useMemo(
    () => CATEGORIES.find((c) => c.key === question?.category),
    [question],
  );

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
    // Auto-advance to the next unanswered question.
    setTimeout(() => {
      if (index < TOTAL_QUESTIONS - 1) setIndex(index + 1);
    }, 180);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);

    // Couple mode: partner B submits against the invite token (no login).
    if (coupleToken) {
      try {
        const res = await fetch("/api/couple/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: coupleToken, answers, partnerName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.error || "Failed to submit");
        track(EVENTS.ASSESSMENT_COMPLETE, { mode: "couple" });
        localStorage.removeItem(STORAGE_KEY);
        router.push(`/couple/${coupleToken}/report`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setSubmitting(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (res.status === 401) {
        // Not logged in — answers are already in localStorage; send to login and back.
        router.push(`/login?redirect=${encodeURIComponent("/assessment")}`);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Failed to submit");

      track(EVENTS.ASSESSMENT_COMPLETE, { overall: data.scores?.overall });
      localStorage.removeItem(STORAGE_KEY);
      router.push(`/results/${data.assessmentId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return <div className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />;
  }

  // Final screen: everything answered.
  if (complete && index >= TOTAL_QUESTIONS - 1 && answers[question.id]) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-3xl">
          ✓
        </div>
        <h2 className="mt-6 text-2xl font-bold text-slate-900">You're all done</h2>
        <p className="mt-2 text-slate-600">
          We've recorded your answers. Let's calculate your relationship health scores.
        </p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting}
          className="mt-7 rounded-full bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Calculating…" : "See my results"}
        </button>
        <button
          onClick={() => setIndex(0)}
          className="mt-3 block w-full text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          Review my answers
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-500">
          <span>
            {categoryMeta?.label} · Question {index + 1} of {TOTAL_QUESTIONS}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div key={question.id} className="animate-fade-up rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {categoryMeta?.label}
        </p>
        <h2 className="mt-3 text-2xl font-semibold leading-snug text-slate-900">
          {question.text}
        </h2>

        <div className="mt-8 space-y-3">
          {SCALE.map((s) => {
            const selected = answers[question.id] === s.value;
            return (
              <button
                key={s.value}
                onClick={() => answer(s.value)}
                className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left text-sm font-medium transition ${
                  selected
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-700 hover:border-brand-200 hover:bg-slate-50"
                }`}
              >
                <span>{s.label}</span>
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${
                    selected ? "border-brand-500 bg-brand-600 text-white" : "border-slate-300 text-slate-400"
                  }`}
                >
                  {s.value}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-40"
        >
          ← Back
        </button>
        {complete ? (
          <button
            onClick={() => setIndex(TOTAL_QUESTIONS - 1)}
            className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Finish
          </button>
        ) : (
          <button
            onClick={() => setIndex(Math.min(TOTAL_QUESTIONS - 1, index + 1))}
            disabled={index === TOTAL_QUESTIONS - 1}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-40"
          >
            Skip →
          </button>
        )}
      </div>
    </div>
  );
}
