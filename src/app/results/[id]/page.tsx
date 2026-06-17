import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getOptionalUser } from "@/lib/supabase/server";
import { isPremium } from "@/lib/entitlements";
import { ScoreResult, bandFor, CategoryScore } from "@/lib/scoring";
import { CATEGORIES } from "@/lib/questions";
import { OverallScore, CategoryCards } from "@/components/ScoreCards";
import { ReportSection } from "@/components/ReportSection";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { IntelligencePanel } from "@/components/IntelligencePanel";
import { AIAnalysis, RecoveryPlans } from "@/lib/types";
import { RelationshipIntelligence } from "@/lib/engine";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOptionalUser();
  if (!user) redirect(`/login?redirect=/results/${id}`);
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("scores")
    .select("trust, communication, connection, intimacy, overall")
    .eq("assessment_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row) notFound();

  const categories: CategoryScore[] = CATEGORIES.map((c) => {
    const score = row[c.key as keyof typeof row] as number;
    return { category: c.key, label: c.label, score, band: bandFor(score) };
  });
  const scores: ScoreResult = { ...row, categories } as ScoreResult;

  const premium = await isPremium(user.id);

  const { data: report } = await supabase
    .from("reports")
    .select("analysis, plans")
    .eq("assessment_id", id)
    .maybeSingle();

  const { data: intelRow } = await supabase
    .from("relationship_intelligence")
    .select("data")
    .eq("assessment_id", id)
    .maybeSingle();
  const intel = intelRow?.data as RelationshipIntelligence | undefined;

  return (
    <main className="min-h-screen bg-soft">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-extrabold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">❤</span>
          Better<span className="text-brand-600">Us</span>
        </Link>
        <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
          Dashboard →
        </Link>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 pb-20 pt-4 sm:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your relationship health</h1>
          <p className="mt-2 text-slate-600">Here's where things stand today, across the four pillars.</p>
        </div>

        <OverallScore scores={scores} />
        <CategoryCards scores={scores} />

        {intel && <IntelligencePanel intel={intel} />}

        {premium ? (
          <ReportSection
            assessmentId={id}
            initialAnalysis={report?.analysis as AIAnalysis | undefined}
            initialPlans={report?.plans as RecoveryPlans | undefined}
          />
        ) : (
          <UpgradeCTA scores={scores} />
        )}
      </div>
    </main>
  );
}
