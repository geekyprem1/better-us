import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/entitlements";
import { ReportDocument } from "@/lib/pdf/ReportDocument";
import { RelationshipIntelligence, runTrends, TrendPoint } from "@/lib/engine";
import { recoveryForecast } from "@/lib/engine/context";
import { AIAnalysis, RecoveryPlans } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generates the premium downloadable PDF report. Premium only.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });
  if (!(await isPremium(user.id))) return new Response("premium_required", { status: 403 });

  const { searchParams } = new URL(request.url);
  let assessmentId = searchParams.get("assessment");

  // Default to the user's most recent assessment with intelligence.
  if (!assessmentId) {
    const { data } = await supabase
      .from("relationship_intelligence")
      .select("assessment_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    assessmentId = data?.assessment_id ?? null;
  }
  if (!assessmentId) return new Response("no_report", { status: 404 });

  const [{ data: intelRow }, { data: report }, { data: profile }] = await Promise.all([
    supabase.from("relationship_intelligence").select("data").eq("assessment_id", assessmentId).maybeSingle(),
    supabase.from("reports").select("analysis, plans").eq("assessment_id", assessmentId).maybeSingle(),
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const intel = intelRow?.data as RelationshipIntelligence | undefined;
  if (!intel) return new Response("no_intelligence", { status: 404 });

  // Full score history → journey + trends.
  const { data: scoreRows } = await supabase
    .from("scores")
    .select("trust, communication, connection, intimacy, overall, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  const history: TrendPoint[] = (scoreRows || []).map((r) => ({
    date: r.created_at,
    overall: r.overall,
    trust: r.trust,
    communication: r.communication,
    connection: r.connection,
    intimacy: r.intimacy,
  }));

  const doc = ReportDocument({
    name: profile?.full_name || undefined,
    intel,
    analysis: report?.analysis as AIAnalysis | undefined,
    plans: report?.plans as RecoveryPlans | undefined,
    history,
    trends: runTrends(history),
    forecast: recoveryForecast(intel),
    date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
  });
  const buffer = await renderToBuffer(doc);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BetterUs-Report.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
