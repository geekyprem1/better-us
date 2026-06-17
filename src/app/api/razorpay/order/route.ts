import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay } from "@/lib/razorpay";
import { getTier } from "@/lib/plans";

// Creates a one-time Razorpay order for the Lifetime plan.
// `offer: "exit"` applies the exit-intent discount (₹999 → ₹499).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let offer: string | undefined;
  try {
    const body = await request.json();
    offer = body?.offer;
  } catch {
    /* no body */
  }

  const lifetime = getTier("lifetime");
  const price = offer === "exit" ? 499 : lifetime.price;

  try {
    const order = await getRazorpay().orders.create({
      amount: price * 100, // paise
      currency: "INR",
      receipt: `lifetime_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id, email: user.email ?? "", tier: "lifetime", offer: offer ?? "standard" },
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
