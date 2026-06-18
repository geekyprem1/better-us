import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Dodo Payments webhook — the ONLY path that grants premium.
// Hardened: signature-verified, idempotent (dedupe by webhook-id), every
// event is stored so a charge is never silently lost, and user resolution
// falls back to customer email so a missing metadata.user_id still upgrades.
export async function POST(request: Request) {
  const raw = await request.text();
  const headers = {
    "webhook-id": request.headers.get("webhook-id") || "",
    "webhook-signature": request.headers.get("webhook-signature") || "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
  };

  // 1. Verify signature.
  try {
    const wh = new Webhook(process.env.DODO_WEBHOOK_SECRET!);
    await wh.verify(raw, headers);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const event = JSON.parse(raw);
  const webhookId = headers["webhook-id"] || `${event?.type}_${event?.timestamp}`;
  const type: string = event?.type || "";
  const data = event?.data || {};
  const admin = createAdminClient();

  // 2. Idempotency — record the id first; duplicate delivery → ignore.
  const { error: dupeErr } = await admin
    .from("processed_webhooks")
    .insert({ webhook_id: webhookId, provider: "dodo", event_type: type, payload: event, status: "received" });
  if (dupeErr) {
    // Primary-key conflict = already processed.
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // 3. Resolve the user: metadata.user_id, else by customer email.
  const metadata = data?.metadata || event?.metadata || {};
  let userId: string | undefined = metadata.user_id;
  const tier: string = metadata.tier || "premium";
  const email: string | undefined = data?.customer?.email || data?.customer_email;

  if (!userId && email) {
    const { data: u } = await admin.from("users").select("id").eq("email", email).maybeSingle();
    userId = u?.id;
  }

  const activates = ["payment.succeeded", "subscription.active", "subscription.renewed"].includes(type);
  const cancels = ["subscription.cancelled", "subscription.expired", "payment.failed"].includes(type);

  // 4. If we can't match a user on an activating event, store as "unmatched"
  //    so it can be reconciled manually — money is never lost.
  if (!userId) {
    await admin
      .from("processed_webhooks")
      .update({ status: activates ? "unmatched" : "ignored" })
      .eq("webhook_id", webhookId);
    return NextResponse.json({ ok: true, unmatched: activates });
  }

  if (activates) {
    const periodEnd =
      tier === "lifetime" ? "2099-12-31T00:00:00Z" : new Date(Date.now() + 31 * 86400000).toISOString();
    await admin.from("subscriptions").insert({
      user_id: userId,
      razorpay_subscription_id: `dodo_${data?.subscription_id || data?.payment_id || webhookId}`,
      plan_id: tier,
      status: "active",
      current_period_end: periodEnd,
    });
    await admin.from("users").update({ is_premium: true }).eq("id", userId);
  } else if (cancels) {
    await admin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .eq("status", "active");
    await admin.from("users").update({ is_premium: false }).eq("id", userId);
  }

  await admin
    .from("processed_webhooks")
    .update({ user_id: userId, status: "processed" })
    .eq("webhook_id", webhookId);

  return NextResponse.json({ ok: true });
}
