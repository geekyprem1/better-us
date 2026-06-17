// Dodo Payments (Merchant of Record) — global payments + tax handled, INR payout.
// Hosted checkout via POST /checkouts; webhooks verified with standardwebhooks.

import { TierId } from "./plans";

const BASE =
  process.env.DODO_BASE_URL ||
  (process.env.DODO_ENVIRONMENT === "live"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com");

// Tier → Dodo product id (created in the Dodo dashboard). `lifetime_exit` is
// the discounted exit-intent lifetime product.
export function dodoProductId(tier: TierId | "lifetime_exit"): string | undefined {
  switch (tier) {
    case "pro":
      return process.env.DODO_PRODUCT_PRO;
    case "premium":
      return process.env.DODO_PRODUCT_PREMIUM;
    case "lifetime":
      return process.env.DODO_PRODUCT_LIFETIME;
    case "lifetime_exit":
      return process.env.DODO_PRODUCT_LIFETIME_OFFER || process.env.DODO_PRODUCT_LIFETIME;
  }
}

export interface DodoCheckout {
  session_id: string;
  checkout_url: string;
}

export async function createDodoCheckout(params: {
  productId: string;
  email: string;
  userId: string;
  tier: string;
}): Promise<DodoCheckout> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${BASE}/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DODO_API_KEY}`,
    },
    body: JSON.stringify({
      product_cart: [{ product_id: params.productId, quantity: 1 }],
      customer: { email: params.email },
      return_url: `${site}/dashboard?upgraded=1`,
      metadata: { user_id: params.userId, tier: params.tier },
    }),
  });
  if (!res.ok) {
    throw new Error(`Dodo checkout failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as DodoCheckout;
}
