import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Dodo Payments webhook — activates premium on successful payment/subscription.
// Configure in Dodo dashboard → Developer → Webhooks, pointing at this URL.
export async function POST(request: Request) {
  const raw = await request.text();
  const headers = {
    "webhook-id": request.headers.get("webhook-id") || "",
    "webhook-signature": request.headers.get("webhook-signature") || "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
  };

  try {
    const wh = new Webhook(process.env.DODO_WEBHOOK_SECRET!);
    await wh.verify(raw, headers);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const event = JSON.parse(raw);
  const type: string = event?.type || "";
  const data = event?.data || {};
  // Metadata we set at checkout (may live on data or data.metadata).
  const metadata = data?.metadata || event?.metadata || {};
  const userId: string | undefined = metadata.user_id;
  const tier: string = metadata.tier || "premium";

  const activates = ["payment.succeeded", "subscription.active", "subscription.renewed"].includes(type);
  const cancels = ["subscription.cancelled", "subscription.expired", "payment.failed"].includes(type);

  if (!userId || (!activates && !cancels)) {
    return NextResponse.json({ ok: true, ignored: type });
  }

  const admin = createAdminClient();

  if (activates) {
    const periodEnd =
      tier === "lifetime" ? "2099-12-31T00:00:00Z" : new Date(Date.now() + 31 * 86400000).toISOString();
    await admin.from("subscriptions").insert({
      user_id: userId,
      razorpay_subscription_id: `dodo_${event?.data?.subscription_id || event?.data?.payment_id || Date.now()}`,
      plan_id: tier,
      status: "active",
      current_period_end: periodEnd,
    });
    await admin.from("users").update({ is_premium: true }).eq("id", userId);
  } else if (cancels) {
    await admin.from("users").update({ is_premium: false }).eq("id", userId);
  }

  return NextResponse.json({ ok: true });
}
