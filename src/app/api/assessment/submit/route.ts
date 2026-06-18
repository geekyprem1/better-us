import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { QUESTIONS } from "@/lib/questions";
import { computeScores, isComplete, Answers } from "@/lib/scoring";
import { runIntelligence } from "@/lib/engine";

// Persists a completed assessment: answers + computed scores.
// Returns the assessment id so the client can route to /results/[id].
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let answers: Answers;
  try {
    const body = await request.json();
    answers = body.answers;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!answers || !isComplete(answers)) {
    return NextResponse.json({ error: "incomplete" }, { status: 400 });
  }

  // 1. Create the assessment row.
  const { data: assessment, error: aErr } = await supabase
    .from("assessments")
    .insert({ user_id: user.id, status: "completed", completed_at: new Date().toISOString() })
    .select("id")
    .single();

  if (aErr || !assessment) {
    console.error("assessment insert failed", aErr);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // 2. Insert all answers.
  const answerRows = QUESTIONS.map((q) => ({
    assessment_id: assessment.id,
    question_id: q.id,
    category: q.category,
    value: answers[q.id],
  }));
  const { error: ansErr } = await supabase.from("assessment_answers").insert(answerRows);
  if (ansErr) {
    console.error("answers insert failed", ansErr);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // 3. Compute and store scores.
  const scores = computeScores(answers);
  const { error: sErr } = await supabase.from("scores").insert({
    assessment_id: assessment.id,
    user_id: user.id,
    trust: scores.trust,
    communication: scores.communication,
    connection: scores.connection,
    intimacy: scores.intimacy,
    overall: scores.overall,
  });
  if (sErr) {
    console.error("scores insert failed", sErr);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // 4. Run the deterministic Relationship Intelligence Engine and store it.
  // This is the proprietary, explainable layer — computed without the LLM.
  const intel = runIntelligence(answers);
  await supabase.from("relationship_intelligence").insert({
    assessment_id: assessment.id,
    user_id: user.id,
    engine_version: intel.version,
    health_overall: intel.health.overall,
    health_band: intel.health.band,
    trust_risk_index: intel.trustRisk.index,
    trust_risk_level: intel.trustRisk.level,
    communication_index: intel.communication.index,
    communication_type: intel.communication.type,
    relationship_stage: intel.stage.stage,
    recovery_score: intel.recovery.score,
    recovery_band: intel.recovery.band,
    data: intel,
  });

  return NextResponse.json({ assessmentId: assessment.id, scores });
}
