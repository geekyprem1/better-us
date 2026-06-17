"use client";

import { useState } from "react";
import Link from "next/link";
import { AssessmentFlow } from "./AssessmentFlow";

export function CoupleAssessment({
  token,
  inviterName,
  completed,
}: {
  token: string;
  inviterName: string;
  completed: boolean;
}) {
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);

  if (completed) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <div className="text-3xl">💞</div>
        <h2 className="mt-3 text-xl font-bold text-slate-900">This assessment is complete</h2>
        <p className="mt-2 text-slate-600">Your compatibility report is ready.</p>
        <Link
          href={`/couple/${token}/report`}
          className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          View Couple Report →
        </Link>
      </div>
    );
  }

  if (started) {
    return <AssessmentFlow coupleToken={token} partnerName={name || undefined} />;
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-10">
      <div className="text-3xl">💌</div>
      <h2 className="mt-3 text-2xl font-bold text-slate-900">{inviterName} invited you</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-600">
        Take the same 5-minute assessment so you can see where your views align — and where they
        differ. Your answers are private; only the comparison is shared.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your first name (optional)"
        className="mx-auto mt-6 block w-full max-w-xs rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <button
        onClick={() => setStarted(true)}
        className="mt-4 rounded-full bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
      >
        Start Assessment
      </button>
    </div>
  );
}
