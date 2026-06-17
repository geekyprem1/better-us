import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getOptionalUser } from "@/lib/supabase/server";
import { isPremium } from "@/lib/entitlements";
import { Navbar } from "@/components/Navbar";
import { OverallScore, CategoryCards } from "@/components/ScoreCards";
import { ProgressChart } from "@/components/ProgressChart";
import { InviteCouple } from "@/components/InviteCouple";
import { DriftPanel } from "@/components/DriftPanel";
import { IntelligencePanel } from "@/components/IntelligencePanel";
import { AssessmentHistory } from "@/components/AssessmentHistory";
import { RelationshipJourney } from "@/components/RelationshipJourney";
import { TrendInsights } from "@/components/TrendInsights";
import { Milestones } from "@/components/Milestones";
import { ScoreResult, bandFor, CategoryScore } from "@/lib/scoring";
import { CATEGORIES } from "@/lib/questions";
import { HistoryItem } from "@/lib/history";
import { RelationshipIntelligence, runTrends, runMilestones, TrendPoint } from "@/lib/engine";

export const metadata = { title: "Dashboard — BetterUs" };

function LockedFeature({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/40 p-6 text-center">
      <p className="font-semibold text-slate-900">🔒 {title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{blurb}</p>
      <Link href="/pricing" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
        Unlock with Premium →
      </Link>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login?redirect=/dashboard");
  const supabase = await createClient();

  const { data: scoreRows } = await supabase
    .from("scores")
    .select("trust, communication, connection, intimacy, overall, created_at, assessment_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const premium = await isPremium(user.id);

  if (!scoreRows || scoreRows.length === 0) {
    return (
      <main className="min-h-screen bg-soft">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900">Welcome to BetterUs</h1>
          <p className="mt-3 text-slate-600">
            Take your first 5-minute assessment to see your relationship health.
          </p>
          <Link
            href="/assessment"
            className="mt-8 inline-block rounded-full bg-brand-600 px-8 py-4 font-semibold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700"
          >
            Take Free Assessment
          </Link>
        </div>
      </main>
    );
  }

  // Intelligence rows (stage + recovery per assessment, + full latest profile).
  const { data: intelRows } = await supabase
    .from("relationship_intelligence")
    .select("assessment_id, relationship_stage, recovery_score, data")
    .eq("user_id", user.id);
  const intelByAssessment = new Map((intelRows || []).map((r) => [r.assessment_id, r]));

  const latest = scoreRows[scoreRows.length - 1];
  const categories: CategoryScore[] = CATEGORIES.map((c) => {
    const score = latest[c.key as keyof typeof latest] as number;
    return { category: c.key, label: c.label, score, band: bandFor(score) };
  });
  const scores: ScoreResult = {
    trust: latest.trust,
    communication: latest.communication,
    connection: latest.connection,
    intimacy: latest.intimacy,
    overall: latest.overall,
    categories,
  };
  const latestIntel = intelByAssessment.get(latest.assessment_id)?.data as
    | RelationshipIntelligence
    | undefined;

  // Build journey (newest first) + trend inputs (chronological).
  const historyItems: HistoryItem[] = [...scoreRows].reverse().map((r) => {
    const intel = intelByAssessment.get(r.assessment_id);
    return {
      assessmentId: r.assessment_id,
      date: r.created_at,
      overall: r.overall,
      trust: r.trust,
      communication: r.communication,
      connection: r.connection,
      intimacy: r.intimacy,
      stage: intel?.relationship_stage,
      recovery: intel?.recovery_score,
    };
  });
  const trendPoints: TrendPoint[] = scoreRows.map((r) => ({
    date: r.created_at,
    overall: r.overall,
    trust: r.trust,
    communication: r.communication,
    connection: r.connection,
    intimacy: r.intimacy,
  }));
  const trends = runTrends(trendPoints);
  const milestones = runMilestones(trendPoints);

  const driftHistory = scoreRows.map((h) => ({
    trust: h.trust,
    communication: h.communication,
    connection: h.connection,
    intimacy: h.intimacy,
    overall: h.overall,
  }));

  return (
    <main className="min-h-screen bg-soft">
      <Navbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 pb-20 pt-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your dashboard</h1>
            <p className="mt-1 text-slate-600">
              {scoreRows.length} assessment{scoreRows.length > 1 ? "s" : ""} on record.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/assessment"
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Retake assessment
            </Link>
            <Link
              href="/coach"
              className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              BetterUs Coach™
            </Link>
          </div>
        </div>

        {/* 1. Overall Relationship Health™ */}
        <OverallScore scores={scores} />
        <CategoryCards scores={scores} />

        {/* 2. Relationship Intelligence™ */}
        {latestIntel && <IntelligencePanel intel={latestIntel} />}

        {/* 3. Progress Graph */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Progress over time</h2>
          {scoreRows.length > 1 ? (
            <ProgressChart
              data={scoreRows.map((h) => ({
                date: new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                Overall: h.overall,
                Trust: h.trust,
                Communication: h.communication,
                Connection: h.connection,
                Intimacy: h.intimacy,
              }))}
            />
          ) : (
            <p className="mt-4 text-sm text-slate-500">Retake the assessment to chart your progress.</p>
          )}
        </div>

        {/* 4. Emotional Drift Engine™ */}
        {premium ? (
          <DriftPanel history={driftHistory} />
        ) : (
          <LockedFeature title="Emotional Drift Engine™" blurb="See whether each pillar is improving, declining, or plateauing over time." />
        )}

        {/* 5. Assessment History™ */}
        <AssessmentHistory items={historyItems} premium={premium} />

        {/* 6. Relationship Journey™ + 7. Trend Insights™ + Milestones™ */}
        {premium ? (
          <>
            <RelationshipJourney items={historyItems} trends={trends} />
            <TrendInsights trends={trends} />
            <Milestones milestones={milestones} />
          </>
        ) : (
          <LockedFeature
            title="Relationship Journey™, Trend Insights™ & Milestones™"
            blurb="Track your full journey, get AI trend insights, and unlock relationship milestones as you improve."
          />
        )}

        {/* 8. Couple Mode™ */}
        {premium && <InviteCouple />}

        {/* 9. BetterUs Coach™ */}
        <Link
          href="/coach"
          className="block rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-sm transition hover:from-slate-800"
        >
          <h2 className="font-semibold">BetterUs Coach™ →</h2>
          <p className="mt-1 text-sm text-slate-300">
            Get structured, engine-grounded coaching: insights, scripts, and recovery actions.
          </p>
        </Link>
      </div>
    </main>
  );
}
