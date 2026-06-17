import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay, RAZORPAY_PLAN_ID } from "@/lib/razorpay";

// Creates a Razorpay subscription for the logged-in user and returns its id.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Tier → Razorpay plan id (falls back to the default plan).
  let tier: "pro" | "premium" = "premium";
  try {
    const body = await request.json();
    if (body?.tier === "pro" || body?.tier === "premium") tier = body.tier;
  } catch {
    /* no body — default to premium */
  }
  const planId =
    (tier === "pro" ? process.env.RAZORPAY_PLAN_PRO : process.env.RAZORPAY_PLAN_PREMIUM) ||
    RAZORPAY_PLAN_ID;

  try {
    const subscription = await getRazorpay().subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12, // up to 12 monthly cycles
      notes: { user_id: user.id, email: user.email ?? "" },
    });

    // Record a pending subscription row we can reconcile on verify/webhook.
    await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        razorpay_subscription_id: subscription.id,
        plan_id: planId,
        status: "free",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "razorpay_subscription_id" },
    );

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "razorpay_failed", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
