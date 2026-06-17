import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { computeScores, isComplete, Answers } from "@/lib/scoring";
import { runCoupleSync } from "@/lib/engine";
import { generateCoupleExplanation } from "@/lib/ai";

export const maxDuration = 60;

// Partner B submits their assessment (no login required — the token authorizes).
export async function POST(request: Request) {
  let body: { token?: string; answers?: Answers; partnerName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { token, answers, partnerName } = body;

  if (!token || !answers || !isComplete(answers)) {
    return NextResponse.json({ error: "incomplete" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("couple_invites")
    .select("id, status, inviter_scores")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  if (invite.status === "completed") {
    return NextResponse.json({ ok: true, alreadyDone: true });
  }

  const partnerScores = computeScores(answers);
  const sync = runCoupleSync(invite.inviter_scores, {
    trust: partnerScores.trust,
    communication: partnerScores.communication,
    connection: partnerScores.connection,
    intimacy: partnerScores.intimacy,
    overall: partnerScores.overall,
  });

  const ai_explanation = await generateCoupleExplanation(sync);

  const { error } = await admin
    .from("couple_invites")
    .update({
      partner_name: partnerName || null,
      partner_scores: {
        trust: partnerScores.trust,
        communication: partnerScores.communication,
        connection: partnerScores.connection,
        intimacy: partnerScores.intimacy,
        overall: partnerScores.overall,
      },
      sync,
      ai_explanation,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("token", token);

  if (error) return NextResponse.json({ error: "db", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
