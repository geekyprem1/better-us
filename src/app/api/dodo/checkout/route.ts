import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDodoCheckout, dodoProductId } from "@/lib/dodo";
import { TierId } from "@/lib/plans";

// Creates a Dodo Payments hosted checkout for the chosen tier and returns the
// checkout URL (client redirects there). Works for subscriptions + lifetime.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let tier: TierId = "premium";
  let offer: string | undefined;
  try {
    const body = await request.json();
    if (["pro", "premium", "lifetime"].includes(body?.tier)) tier = body.tier;
    offer = body?.offer;
  } catch {
    /* default premium */
  }

  const productKey = offer === "exit" && tier === "lifetime" ? "lifetime_exit" : tier;
  const productId = dodoProductId(productKey);
  if (!productId) {
    return NextResponse.json({ error: "product_not_configured", detail: productKey }, { status: 500 });
  }

  try {
    const checkout = await createDodoCheckout({
      productId,
      email: user.email ?? "",
      userId: user.id,
      tier,
    });
    return NextResponse.json({ checkout_url: checkout.checkout_url });
  } catch (e) {
    console.error("dodo checkout failed", e);
    return NextResponse.json({ error: "checkout_failed" }, { status: 502 });
  }
}
