"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track, EVENTS } from "@/lib/analytics";

// Loads the Razorpay Checkout script once, on demand.
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function UpgradeButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    track(EVENTS.UPGRADE_CLICK, { source: "pricing_page" });

    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent("/pricing")}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load the payment SDK.");

      const res = await fetch("/api/razorpay/subscription", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Could not start checkout.");

      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "BetterUs Premium",
        description: "₹499/month relationship coaching",
        theme: { color: "#1f49f5" },
        handler: async (response: any) => {
          const verify = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          if (verify.ok) {
            track(EVENTS.SUBSCRIPTION_PURCHASE, { plan: "premium_monthly" });
            router.push("/dashboard");
            router.refresh();
          } else {
            setError("Payment received but activation failed. Contact support.");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={upgrade}
        disabled={loading}
        className="w-full rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Starting checkout…" : "Upgrade to Premium · ₹499/mo"}
      </button>
      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
