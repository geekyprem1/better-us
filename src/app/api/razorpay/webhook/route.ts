import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Razorpay subscription lifecycle webhook. Configure in the Razorpay dashboard
// (Settings → Webhooks) pointing at /api/razorpay/webhook with the events:
// subscription.activated, subscription.charged, subscription.cancelled,
// subscription.completed, subscription.halted.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const sub = event?.payload?.subscription?.entity;
  const subscriptionId: string | undefined = sub?.id;
  if (!subscriptionId) return NextResponse.json({ ok: true });

  const admin = createAdminClient();

  // Map Razorpay event → our subscription status.
  const statusMap: Record<string, "active" | "cancelled" | "past_due"> = {
    "subscription.activated": "active",
    "subscription.charged": "active",
    "subscription.cancelled": "cancelled",
    "subscription.completed": "cancelled",
    "subscription.halted": "past_due",
  };
  const newStatus = statusMap[event.event];
  if (!newStatus) return NextResponse.json({ ok: true });

  const update: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (sub?.current_end) {
    update.current_period_end = new Date(sub.current_end * 1000).toISOString();
  }

  const { data: row } = await admin
    .from("subscriptions")
    .update(update)
    .eq("razorpay_subscription_id", subscriptionId)
    .select("user_id")
    .maybeSingle();

  if (row?.user_id) {
    await admin
      .from("users")
      .update({ is_premium: newStatus === "active" })
      .eq("id", row.user_id);
  }

  return NextResponse.json({ ok: true });
}
