"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startExitOfferCheckout } from "@/lib/checkout";
import { track, EVENTS } from "@/lib/analytics";

const SEEN_KEY = "betterus_exit_seen";

// Phase 12 — fires once when a free user is about to leave, offering the
// discounted lifetime deal (₹999 → ₹499).
export function ExitIntentModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SEEN_KEY)) return;

    function onLeave(e: MouseEvent) {
      // Cursor leaving via the top of the viewport = intent to close/switch tab.
      if (e.clientY <= 0) trigger();
    }
    // Mobile / tab-switch fallback.
    function onHide() {
      if (document.visibilityState === "hidden") {
        // arm for next view rather than firing on a hidden tab
      }
    }

    function trigger() {
      if (localStorage.getItem(SEEN_KEY)) return;
      localStorage.setItem(SEEN_KEY, "1");
      setOpen(true);
      track(EVENTS.PAYWALL_VIEW, { source: "exit_intent" });
      document.removeEventListener("mouseleave", onLeave);
    }

    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  if (!open) return null;

  function claim() {
    setLoading(true);
    setError(null);
    startExitOfferCheckout({
      onSuccess: () => {
        router.refresh();
        setOpen(false);
      },
      onError: (m) => {
        setError(m);
        setLoading(false);
      },
      onDismiss: () => setLoading(false),
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
        >
          ✕
        </button>
        <div className="text-4xl">🛑</div>
        <h2 className="mt-3 text-2xl font-extrabold text-slate-900">Wait — before you go</h2>
        <p className="mt-2 text-slate-600">
          Unlock your complete relationship recovery plan, AI coach, and lifetime access.
        </p>
        <div className="mt-5 rounded-2xl bg-brand-50 p-5">
          <p className="text-sm font-medium text-slate-500">Lifetime access — today only</p>
          <p className="mt-1">
            <span className="text-lg text-slate-400 line-through">₹999</span>{" "}
            <span className="text-4xl font-extrabold text-brand-700">₹499</span>
          </p>
        </div>
        <button
          onClick={claim}
          disabled={loading}
          className="mt-5 w-full rounded-full bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Opening checkout…" : "Claim ₹499 Lifetime Offer"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          onClick={() => setOpen(false)}
          className="mt-3 text-sm font-medium text-slate-400 hover:text-slate-600"
        >
          No thanks, I'll pass
        </button>
      </div>
    </div>
  );
}
