import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifySubscriptionSignature } from "@/lib/razorpay";

// Verifies the Razorpay Checkout callback and activates premium immediately.
// (The webhook is the source of truth for renewals/cancellations.)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
    await request.json();

  const valid = verifySubscriptionSignature({
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  });
  if (!valid) return NextResponse.json({ error: "invalid_signature" }, { status: 400 });

  // Use the admin client to write subscription state (bypasses RLS write rules).
  const admin = createAdminClient();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await admin
    .from("subscriptions")
    .update({
      status: "active",
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", razorpay_subscription_id)
    .eq("user_id", user.id);

  await admin.from("users").update({ is_premium: true }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
