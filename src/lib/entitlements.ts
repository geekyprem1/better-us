import { createClient } from "./supabase/server";

export type Tier = "free" | "pro" | "premium";

// Returns true when the user has any active paid subscription.
export async function isPremium(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier !== "free";
}

// Resolves the user's plan tier from their latest active subscription.
export async function getUserTier(userId: string): Promise<Tier> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("status, plan_id, current_period_end")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return "free";
  if (data.current_period_end && new Date(data.current_period_end) < new Date()) return "free";

  // Dodo webhook stores plan_id as the tier name ('pro' | 'premium' | 'lifetime').
  const planId = (data.plan_id || "").toLowerCase();
  if (planId === "pro") return "pro";
  if (planId === "premium") return "premium";
  if (planId === "lifetime") return "premium";
  // Any other active subscription (e.g. manual grant) → premium.
  return "premium";
}

// ── Coach economics (Phase 13) ────────────────────────────────
// Keeps AI costs predictable. Free is a lifetime trial; paid tiers are daily.
export const COACH_LIMITS: Record<Tier, { limit: number; period: "lifetime" | "day"; label: string }> = {
  free: { limit: 3, period: "lifetime", label: "free coaching messages" },
  pro: { limit: 1, period: "day", label: "session today" },
  premium: { limit: 10, period: "day", label: "sessions today" },
};

export interface CoachUsage {
  tier: Tier;
  used: number;
  limit: number;
  remaining: number;
  period: "lifetime" | "day";
  label: string;
}

// Counts coach sessions in the relevant window and returns remaining quota.
export async function getCoachUsage(userId: string): Promise<CoachUsage> {
  const tier = await getUserTier(userId);
  const { limit, period, label } = COACH_LIMITS[tier];
  const supabase = await createClient();

  let query = supabase
    .from("coach_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (period === "day") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    query = query.gte("created_at", start.toISOString());
  }

  const { count } = await query;
  const used = count ?? 0;
  return { tier, used, limit, remaining: Math.max(0, limit - used), period, label };
}
