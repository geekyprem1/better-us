// Pricing tiers. Checkout is handled by Dodo Payments (Merchant of Record);
// each tier maps to a Dodo product id via env (see lib/dodo.ts).

export type TierId = "pro" | "premium" | "lifetime";
export type BillingKind = "subscription" | "one_time";

export interface Tier {
  id: TierId;
  name: string;
  price: number; // INR
  period: string;
  kind: BillingKind;
  badge?: string;
  highlight?: boolean;
  tagline: string;
  features: string[];
}

export const TIERS: Tier[] = [
  {
    id: "pro",
    name: "Pro",
    price: 299,
    period: "/month",
    kind: "subscription",
    tagline: "Everything you need to start healing.",
    features: [
      "Full AI Relationship Analysis",
      "7-Day Recovery Blueprint™",
      "Downloadable PDF report",
      "Progress tracking",
      "BetterUs Coach™ — 1 session/day",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 499,
    period: "/month",
    kind: "subscription",
    badge: "MOST POPULAR",
    highlight: true,
    tagline: "The complete recovery system + AI coach.",
    features: [
      "Everything in Pro",
      "7 / 30 / 90-Day Recovery Blueprints™",
      "Priority BetterUs Coach™ — 10 sessions/day",
      "Couple Mode™ & compatibility report",
      "Relationship DNA™ & Recovery Potential™",
    ],
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 999,
    period: " one-time",
    kind: "one_time",
    badge: "LAUNCH OFFER",
    tagline: "Pay once. Keep BetterUs forever.",
    features: [
      "Everything in Premium",
      "Lifetime access — no recurring fee",
      "All future updates included",
      "Best value (limited launch price)",
    ],
  },
];

export const getTier = (id: TierId) => TIERS.find((t) => t.id === id)!;
