"use client";

import { TierId, getTier } from "./plans";
import { track, EVENTS } from "./analytics";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

interface CheckoutHandlers {
  onSuccess: () => void;
  onError: (msg: string) => void;
  onDismiss?: () => void;
}

// Starts the right Razorpay flow for a tier: subscription (monthly) or
// one-time order (lifetime). Verifies server-side, then calls onSuccess.
export async function startCheckout(tierId: TierId, h: CheckoutHandlers) {
  const tier = getTier(tierId);
  track(EVENTS.UPGRADE_CLICK, { tier: tierId, price: tier.price });

  const ok = await loadRazorpay();
  if (!ok) return h.onError("Could not load the payment SDK.");

  try {
    if (tier.kind === "one_time") {
      const res = await fetch("/api/razorpay/order", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);

      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        name: "BetterUs Lifetime",
        description: tier.tagline,
        theme: { color: "#1f49f5" },
        handler: (r: any) => verify(r, tierId, h),
        modal: { ondismiss: () => h.onDismiss?.() },
      });
      rzp.open();
    } else {
      const res = await fetch("/api/razorpay/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);

      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: `BetterUs ${tier.name}`,
        description: tier.tagline,
        theme: { color: "#1f49f5" },
        handler: (r: any) => verify(r, tierId, h),
        modal: { ondismiss: () => h.onDismiss?.() },
      });
      rzp.open();
    }
  } catch (e) {
    h.onError(e instanceof Error ? e.message : "Something went wrong.");
  }
}

// Exit-intent special: discounted lifetime (₹999 → ₹499).
export async function startExitOfferCheckout(h: CheckoutHandlers) {
  track(EVENTS.UPGRADE_CLICK, { tier: "lifetime", offer: "exit", price: 499 });
  const ok = await loadRazorpay();
  if (!ok) return h.onError("Could not load the payment SDK.");
  try {
    const res = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offer: "exit" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error);

    const rzp = new (window as any).Razorpay({
      key: data.keyId,
      order_id: data.orderId,
      amount: data.amount,
      name: "BetterUs Lifetime — Special Offer",
      description: "Lifetime access (₹999 → ₹499)",
      theme: { color: "#1f49f5" },
      handler: (r: any) => verify(r, "lifetime", h),
      modal: { ondismiss: () => h.onDismiss?.() },
    });
    rzp.open();
  } catch (e) {
    h.onError(e instanceof Error ? e.message : "Something went wrong.");
  }
}

async function verify(r: any, tierId: TierId, h: CheckoutHandlers) {
  const res = await fetch("/api/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(r),
  });
  if (res.ok) {
    track(EVENTS.SUBSCRIPTION_PURCHASE, { tier: tierId });
    h.onSuccess();
  } else {
    h.onError("Payment received but activation failed. Contact support.");
  }
}
