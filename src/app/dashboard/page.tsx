import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getOptionalUser } from "@/lib/supabase/server";
import { isPremium } from "@/lib/entitlements";
import { Navbar } from "@/components/Navbar";
import { OverallScore, CategoryCards } from "@/components/ScoreCards";
import { ProgressChart } from "@/components/ProgressChart";
import { InviteCouple } from "@/components/InviteCouple";
import { DriftPanel } from "@/components/DriftPanel";
import { ScoreResult, bandFor, CategoryScore } from "@/lib/scoring";
import { CATEGORIES } from "@/lib/questions";
import { AIAnalysis } from "@/lib/types";

export const metadata = { title: "Dashboard — BetterUs" };

export default async function DashboardPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login?redirect=/dashboard");
  const supabase = await createClient();

  const { data: history } = await supabase
    .from("scores")
    .select("trust, communication, connection, intimacy, overall, created_at, assessment_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const premium = await isPremium(user.id);

  // No assessment yet → empty state.
  if (!history || history.length === 0) {
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

  const latest = history[history.length - 1];
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

  // Recent AI insights from the latest report.
  const { data: report } = await supabase
    .from("reports")
    .select("analysis")
    .eq("assessment_id", latest.assessment_id)
    .maybeSingle();
  const analysis = report?.analysis as AIAnalysis | undefined;

  return (
    <main className="min-h-screen bg-soft">
      <Navbar />
      <div className="mx-auto max-w-5xl space-y-8 px-4 pb-20 pt-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your dashboard</h1>
            <p className="mt-1 text-slate-600">
              {history.length} assessment{history.length > 1 ? "s" : ""} taken.
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
              Talk to AI Coach
            </Link>
          </div>
        </div>

        <OverallScore scores={scores} />
        <CategoryCards scores={scores} />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-3">
            <h2 className="font-semibold text-slate-900">Your progress over time</h2>
            {history.length > 1 ? (
              <ProgressChart
                data={history.map((h) => ({
                  date: new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                  Overall: h.overall,
                  Trust: h.trust,
                  Communication: h.communication,
                  Connection: h.connection,
                  Intimacy: h.intimacy,
                }))}
              />
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                Retake the assessment over time to track your progress here.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="font-semibold text-slate-900">Recent AI insights</h2>
            {analysis ? (
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {(analysis.recommendations || []).slice(0, 4).map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-brand-500">✦</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 text-sm text-slate-500">
                {premium ? (
                  <>
                    Your AI report is ready to generate.{" "}
                    <Link href={`/results/${latest.assessment_id}`} className="font-semibold text-brand-600 hover:underline">
                      View report →
                    </Link>
                  </>
                ) : (
                  <>
                    Unlock AI insights and recovery plans with Premium.{" "}
                    <Link href="/pricing" className="font-semibold text-brand-600 hover:underline">
                      Upgrade →
                    </Link>
                  </>
                )}
              </div>
            )}
            <Link
              href={`/results/${latest.assessment_id}`}
              className="mt-5 inline-block text-sm font-semibold text-brand-600 hover:underline"
            >
              View full report →
            </Link>
          </div>
        </div>

        <DriftPanel
          history={history.map((h) => ({
            trust: h.trust,
            communication: h.communication,
            connection: h.connection,
            intimacy: h.intimacy,
            overall: h.overall,
          }))}
        />

        {premium && <InviteCouple />}
      </div>
    </main>
  );
}
