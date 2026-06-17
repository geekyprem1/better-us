"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TIERS, TierId } from "@/lib/plans";
import { startCheckout } from "@/lib/checkout";

// Phase 2 + 12 — premium SaaS pricing modal with 3 tiers.
export function PricingModal({
  open,
  onClose,
  isLoggedIn,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<TierId | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function choose(tier: TierId) {
    setError(null);
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(tier);
    startCheckout(tier, {
      onSuccess: () => {
        router.refresh();
        onClose();
      },
      onError: (m) => {
        setError(m);
        setLoading(null);
      },
      onDismiss: () => setLoading(null),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="relative my-8 w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
        >
          ✕
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Unlock Your Personalized Recovery Plan
          </h2>
          <p className="mt-2 text-slate-600">
            Your scores are just the start. Get the full plan to actually turn things around.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                t.highlight ? "border-2 border-brand-600 shadow-lg" : "border-slate-200"
              }`}
            >
              {t.badge && (
                <span
                  className={`absolute -top-3 left-6 rounded-full px-3 py-1 text-[10px] font-bold ${
                    t.highlight ? "bg-brand-600 text-white" : "bg-accent-500 text-white"
                  }`}
                >
                  {t.badge}
                </span>
              )}
              <h3 className="font-semibold text-slate-900">{t.name}</h3>
              <p className="mt-2">
                <span className="text-3xl font-extrabold text-slate-900">₹{t.price}</span>
                <span className="text-sm font-medium text-slate-400">{t.period}</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">{t.tagline}</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-600">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-brand-600">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choose(t.id)}
                disabled={loading !== null}
                className={`mt-6 rounded-full px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                  t.highlight
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-slate-200 text-slate-800 hover:bg-slate-50"
                }`}
              >
                {loading === t.id ? "Starting…" : t.id === "lifetime" ? "Get Lifetime" : `Choose ${t.name}`}
              </button>
            </div>
          ))}
        </div>

        {error && <p className="mt-5 text-center text-sm text-red-600">{error}</p>}
        <p className="mt-6 text-center text-xs text-slate-400">
          Secure payment via Razorpay · Cancel monthly plans anytime · Prices in INR
        </p>
      </div>
    </div>
  );
}
