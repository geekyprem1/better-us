import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/entitlements";

// Premium user creates a couple invite from their latest assessment.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isPremium(user.id))) return NextResponse.json({ error: "premium_required" }, { status: 403 });

  // Use the inviter's most recent scores as the comparison baseline.
  const { data: score } = await supabase
    .from("scores")
    .select("trust, communication, connection, intimacy, overall, assessment_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!score) {
    return NextResponse.json({ error: "no_assessment" }, { status: 400 });
  }

  const token = randomBytes(9).toString("base64url");
  const admin = createAdminClient();
  const { error } = await admin.from("couple_invites").insert({
    token,
    inviter_user_id: user.id,
    inviter_assessment_id: score.assessment_id,
    inviter_scores: {
      trust: score.trust,
      communication: score.communication,
      connection: score.connection,
      intimacy: score.intimacy,
      overall: score.overall,
    },
    status: "pending",
  });
  if (error) return NextResponse.json({ error: "db", detail: error.message }, { status: 500 });

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return NextResponse.json({ token, link: `${base}/couple/${token}` });
}
