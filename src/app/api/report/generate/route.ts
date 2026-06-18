import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/entitlements";
import { generateAnalysis, generateAllPlans } from "@/lib/ai";
import { Answers, computeScores } from "@/lib/scoring";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60; // analysis + 3 plans can take a while

// Generates (and caches) the full AI report for an assessment. Premium only.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!(await isPremium(user.id))) {
    return NextResponse.json({ error: "premium_required" }, { status: 403 });
  }

  // Cost control: cap report generations per user/hour (cached after first).
  if (!(await rateLimit(`report:${user.id}`, 10, 3600))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { assessmentId } = await request.json();
  if (!assessmentId) return NextResponse.json({ error: "missing_assessment" }, { status: 400 });

  // Confirm ownership of the assessment.
  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, user_id")
    .eq("id", assessmentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!assessment) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Return the cached report if we already generated one.
  const { data: existing } = await supabase
    .from("reports")
    .select("analysis, plans")
    .eq("assessment_id", assessmentId)
    .maybeSingle();
  if (existing?.analysis && existing?.plans) {
    return NextResponse.json({ analysis: existing.analysis, plans: existing.plans, cached: true });
  }

  // Rebuild the answers map from stored rows.
  const { data: answerRows } = await supabase
    .from("assessment_answers")
    .select("question_id, value")
    .eq("assessment_id", assessmentId);
  if (!answerRows?.length) return NextResponse.json({ error: "no_answers" }, { status: 400 });

  const answers: Answers = {};
  for (const r of answerRows) answers[r.question_id] = r.value;
  const scores = computeScores(answers);

  try {
    const analysis = await generateAnalysis(scores, answers);
    const plans = await generateAllPlans(scores, analysis);

    await supabase.from("reports").upsert(
      {
        assessment_id: assessmentId,
        user_id: user.id,
        analysis,
        plans,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "assessment_id" },
    );

    return NextResponse.json({ analysis, plans });
  } catch (e) {
    console.error("report generation failed", e);
    return NextResponse.json({ error: "ai_unavailable" }, { status: 502 });
  }
}
