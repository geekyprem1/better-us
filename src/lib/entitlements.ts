import { createClient } from "./supabase/server";

// Returns true when the user has an active premium subscription.
export async function isPremium(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .in("status", ["active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return false;
  if (data.status !== "active") return false;
  if (data.current_period_end && new Date(data.current_period_end) < new Date()) return false;
  return true;
}
