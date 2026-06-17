import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Toggle a recovery task done/open, or delete a saved card.
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, action } = await request.json();
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  if (action === "delete") {
    await supabase.from("coach_cards").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  // toggle task status
  const { data: card } = await supabase
    .from("coach_cards")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!card) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const next = card.status === "done" ? "open" : "done";
  await supabase.from("coach_cards").update({ status: next }).eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true, status: next });
}
