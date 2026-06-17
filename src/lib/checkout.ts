"use client";

import { TierId, getTier } from "./plans";
import { track, EVENTS } from "./analytics";

interface CheckoutHandlers {
  onSuccess: () => void; // unused with redirect flow, kept for API compatibility
  onError: (msg: string) => void;
  onDismiss?: () => void;
}

// Starts a Dodo Payments hosted checkout for a tier and redirects there.
// (Dodo is a Merchant of Record — global payments + tax handled.)
export async function startCheckout(tierId: TierId, h: CheckoutHandlers) {
  const tier = getTier(tierId);
  track(EVENTS.UPGRADE_CLICK, { tier: tierId, price: tier.price });
  try {
    const res = await fetch("/api/dodo/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: tierId }),
    });
    const data = await res.json();
    if (!res.ok || !data.checkout_url) throw new Error(data.detail || data.error || "Checkout failed");
    window.location.href = data.checkout_url;
  } catch (e) {
    h.onError(e instanceof Error ? e.message : "Something went wrong.");
  }
}

// Exit-intent discounted lifetime offer.
export async function startExitOfferCheckout(h: CheckoutHandlers) {
  track(EVENTS.UPGRADE_CLICK, { tier: "lifetime", offer: "exit" });
  try {
    const res = await fetch("/api/dodo/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: "lifetime", offer: "exit" }),
    });
    const data = await res.json();
    if (!res.ok || !data.checkout_url) throw new Error(data.detail || data.error || "Checkout failed");
    window.location.href = data.checkout_url;
  } catch (e) {
    h.onError(e instanceof Error ? e.message : "Something went wrong.");
  }
}
