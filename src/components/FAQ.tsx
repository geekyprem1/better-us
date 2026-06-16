"use client";

import { useState } from "react";

const faqs = [
  {
    q: "How long does the assessment take?",
    a: "About five minutes. It's 40 questions across trust, communication, connection, and intimacy.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your answers and reports are tied to your account and protected with row-level security. We never sell your data.",
  },
  {
    q: "Is this a replacement for therapy?",
    a: "No. BetterUs is a coaching and self-improvement tool. It's a powerful starting point, but it is not a substitute for professional therapy or crisis services.",
  },
  {
    q: "Can I use it on my own, without my partner?",
    a: "Absolutely. Many people start solo to understand their own perspective before involving their partner.",
  },
  {
    q: "What do I get for free vs. premium?",
    a: "The assessment and your basic scores are always free. Premium (₹499/month) unlocks the full AI analysis, 7/30/90-day recovery plans, and the AI coach.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <div key={f.q} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-6 py-5 text-left"
          >
            <span className="font-semibold text-slate-900">{f.q}</span>
            <span className="ml-4 text-xl text-brand-600">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
