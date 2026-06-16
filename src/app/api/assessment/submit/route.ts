import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { QUESTIONS } from "@/lib/questions";
import { computeScores, isComplete, Answers } from "@/lib/scoring";

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
    return NextResponse.json({ error: "db_assessment", detail: aErr?.message }, { status: 500 });
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
    return NextResponse.json({ error: "db_answers", detail: ansErr.message }, { status: 500 });
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
    return NextResponse.json({ error: "db_scores", detail: sErr.message }, { status: 500 });
  }

  return NextResponse.json({ assessmentId: assessment.id, scores });
}
