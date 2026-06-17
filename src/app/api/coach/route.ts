import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCoachUsage } from "@/lib/entitlements";
import { coachRespond } from "@/lib/ai";
import { engineCoachContext } from "@/lib/engine/context";
import { RelationshipIntelligence } from "@/lib/engine";
import { CoachMessage } from "@/lib/types";

export const maxDuration = 60;

// Coach OS turn: takes recent messages, returns typed cards, and persists
// the session + cards so the workspace panels can surface them.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Enforce coach economics: block when the tier's quota is exhausted.
  const usage = await getCoachUsage(user.id);
  if (usage.remaining <= 0) {
    return NextResponse.json({ error: "limit_reached", usage }, { status: 403 });
  }

  const { messages } = (await request.json()) as { messages: CoachMessage[] };
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return NextResponse.json({ error: "no_message" }, { status: 400 });

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

  // Generate the structured response.
  let response;
  try {
    response = await coachRespond(messages, engineInput);
  } catch (e) {
    return NextResponse.json(
      { error: "ai_failed", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }

  // Persist the session + its cards.
  const { data: session } = await supabase
    .from("coach_sessions")
    .insert({ user_id: user.id, prompt: lastUser.content })
    .select("id, prompt, created_at")
    .single();

  let stored = response.cards;
  if (session && response.cards.length) {
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
