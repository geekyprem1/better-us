import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCoachUsage } from "@/lib/entitlements";
import { coachRespond } from "@/lib/ai";
import { engineCoachContext } from "@/lib/engine/context";
import { RelationshipIntelligence } from "@/lib/engine";
import { CoachMessage } from "@/lib/types";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

// Coach OS turn: typed cards, persisted, with hard cost controls.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Burst limiter (defence-in-depth against rapid concurrency).
  if (!(await rateLimit(`coach:${user.id}`, 5, 60))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { messages } = (await request.json().catch(() => ({}))) as { messages?: CoachMessage[] };
  const lastUser = [...(messages || [])].reverse().find((m) => m.role === "user");
  if (!lastUser) return NextResponse.json({ error: "no_message" }, { status: 400 });

  // ── Reserve the session BEFORE the AI call, then verify quota ──
  // This closes the TOCTOU race: concurrent requests all insert first and
  // then count, so only `limit` of them survive.
  const { data: session, error: reserveErr } = await supabase
    .from("coach_sessions")
    .insert({ user_id: user.id, prompt: lastUser.content })
    .select("id, prompt, created_at")
    .single();
  if (reserveErr || !session) {
    console.error("coach reserve failed", reserveErr);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const usage = await getCoachUsage(user.id); // count now includes this reservation
  if (usage.used > usage.limit) {
    await supabase.from("coach_sessions").delete().eq("id", session.id);
    return NextResponse.json(
      { error: "limit_reached", usage: { ...usage, remaining: 0 } },
      { status: 403 },
    );
  }

  // Ground in the latest engine output.
  let engineInput: string | undefined;
  const { data: intelRow } = await supabase
    .from("relationship_intelligence")
    .select("data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const intel = intelRow?.data as RelationshipIntelligence | undefined;
  if (intel) engineInput = engineCoachContext(intel).input;

  let response;
  try {
    response = await coachRespond(messages || [], engineInput);
  } catch (e) {
    // Don't penalize the user for our failure — release the reservation.
    await supabase.from("coach_sessions").delete().eq("id", session.id);
    console.error("coach AI failed", e);
    return NextResponse.json({ error: "ai_unavailable" }, { status: 502 });
  }

  let stored = response.cards;
  if (response.cards.length) {
    const { data: rows } = await supabase
      .from("coach_cards")
      .insert(
        response.cards.map((c) => ({
          user_id: user.id,
          session_id: session.id,
          type: c.type,
          title: c.title,
          body: c.body,
        })),
      )
      .select("id, type, title, body, status, session_id, created_at");
    if (rows) stored = rows;
  }

  const updatedUsage = await getCoachUsage(user.id);
  return NextResponse.json({
    session,
    cards: stored,
    question: response.question ?? null,
    usage: updatedUsage,
  });
}
