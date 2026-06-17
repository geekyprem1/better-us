"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TIERS, TierId } from "@/lib/plans";
import { startCheckout } from "@/lib/checkout";

// Full-page 3-tier pricing grid (used on /pricing).
export function PricingTiers({ isLoggedIn, premium }: { isLoggedIn: boolean; premium: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<TierId | null>(null);
  const [error, setError] = useState<string | null>(null);

  function choose(tier: TierId) {
    setError(null);
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent("/pricing")}`);
      return;
    }
    setLoading(tier);
    startCheckout(tier, {
      onSuccess: () => {
        router.push("/dashboard");
        router.refresh();
      },
      onError: (m) => {
        setError(m);
        setLoading(null);
      },
      onDismiss: () => setLoading(null),
    });
  }

  return (
    <div>
      {/* Free tier note */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-600">
        <strong className="text-slate-900">Free</strong> — Full assessment, health scores &
        Relationship Intelligence.{" "}
        <Link href="/assessment" className="font-semibold text-brand-600 hover:underline">
          Take the assessment →
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.id}
            className={`relative flex flex-col rounded-3xl border bg-white p-8 ${
              t.highlight ? "border-2 border-brand-600 shadow-xl" : "border-slate-200 shadow-sm"
            }`}
          >
            {t.badge && (
              <span
                className={`absolute -top-3 left-8 rounded-full px-3 py-1 text-[10px] font-bold ${
                  t.highlight ? "bg-brand-600 text-white" : "bg-accent-500 text-white"
                }`}
              >
                {t.badge}
              </span>
            )}
            <h2 className="text-lg font-semibold text-slate-900">{t.name}</h2>
            <p className="mt-2">
              <span className="text-4xl font-extrabold text-slate-900">₹{t.price}</span>
              <span className="text-base font-medium text-slate-400">{t.period}</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">{t.tagline}</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-brand-600">✓</span> {f}
                </li>
              ))}
            </ul>
            {premium ? (
              <div className="mt-8 rounded-full bg-emerald-50 px-6 py-3 text-center text-sm font-semibold text-emerald-700">
                ✓ You're Premium
              </div>
            ) : (
              <button
                onClick={() => choose(t.id)}
                disabled={loading !== null}
                className={`mt-8 rounded-full px-6 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                  t.highlight
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-slate-200 text-slate-800 hover:bg-slate-50"
                }`}
              >
                {loading === t.id ? "Starting…" : t.id === "lifetime" ? "Get Lifetime" : `Choose ${t.name}`}
              </button>
            )}
          </div>
        ))}
      </div>
      {error && <p className="mt-6 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
