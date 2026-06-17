import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifySubscriptionSignature, verifyOrderSignature } from "@/lib/razorpay";

// Verifies the Razorpay Checkout callback and activates premium immediately.
// Handles BOTH monthly subscriptions and the one-time Lifetime order.
// (The webhook is the source of truth for renewals/cancellations.)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  // ── Lifetime (one-time order) ─────────────────────────────────
  if (body.razorpay_order_id) {
    const valid = verifyOrderSignature({
      razorpay_order_id: body.razorpay_order_id,
      razorpay_payment_id: body.razorpay_payment_id,
      razorpay_signature: body.razorpay_signature,
    });
    if (!valid) return NextResponse.json({ error: "invalid_signature" }, { status: 400 });

    await admin.from("subscriptions").insert({
      user_id: user.id,
      razorpay_subscription_id: `lifetime_${body.razorpay_payment_id}`,
      plan_id: "lifetime",
      status: "active",
      current_period_end: "2099-12-31T00:00:00Z", // effectively forever
    });
    await admin.from("users").update({ is_premium: true }).eq("id", user.id);
    return NextResponse.json({ ok: true, tier: "lifetime" });
  }

  // ── Monthly subscription ──────────────────────────────────────
  const valid = verifySubscriptionSignature({
    razorpay_payment_id: body.razorpay_payment_id,
    razorpay_subscription_id: body.razorpay_subscription_id,
    razorpay_signature: body.razorpay_signature,
  });
  if (!valid) return NextResponse.json({ error: "invalid_signature" }, { status: 400 });

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await admin
    .from("subscriptions")
    .update({
      status: "active",
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", body.razorpay_subscription_id)
    .eq("user_id", user.id);

  await admin.from("users").update({ is_premium: true }).eq("id", user.id);

  return NextResponse.json({ ok: true, tier: "subscription" });
}
