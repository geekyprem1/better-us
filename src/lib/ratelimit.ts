import { createAdminClient } from "./supabase/server";

// DB-backed sliding-window rate limiter. Returns true if the request is
// allowed. Insert-then-count includes the current request, so concurrent
// requests all see each other (no TOCTOU bypass). Service-role only.
export async function rateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  try {
    const admin = createAdminClient();
    await admin.from("rate_limits").insert({ key });
    const since = new Date(Date.now() - windowSec * 1000).toISOString();
    const { count } = await admin
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", since);
    return (count ?? 0) <= max;
  } catch {
    // Fail open on limiter errors (availability > strictness), but log upstream.
    return true;
  }
}

// Best-effort client IP from proxy headers.
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
