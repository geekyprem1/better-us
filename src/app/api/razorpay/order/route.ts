import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay } from "@/lib/razorpay";
import { getTier } from "@/lib/plans";

// Creates a one-time Razorpay order for the Lifetime plan (₹999 launch offer).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const lifetime = getTier("lifetime");

  try {
    const order = await getRazorpay().orders.create({
      amount: lifetime.price * 100, // paise
      currency: "INR",
      receipt: `lifetime_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id, email: user.email ?? "", tier: "lifetime" },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "razorpay_failed", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
