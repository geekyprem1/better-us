import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getOptionalUser } from "@/lib/supabase/server";
import { getCoachUsage, isPremium } from "@/lib/entitlements";
import { Navbar } from "@/components/Navbar";
import { CoachWorkspace } from "@/components/CoachWorkspace";
import { StoredCoachCard, CoachSession } from "@/lib/types";
import { RelationshipIntelligence, runMilestones, TrendPoint } from "@/lib/engine";
import { coachSnapshot, recoveryJourney, criticalInsights } from "@/lib/engine/context";

export const metadata = { title: "BetterUs Coach™" };

export default async function CoachPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login?redirect=/coach");
  const supabase = await createClient();

  // Coach is open to everyone, gated by per-tier usage (free = 3 lifetime).
  const usage = await getCoachUsage(user.id);
  const premium = await isPremium(user.id);

  // Latest engine profile (for snapshot / journey / critical insights).
  const { data: intelRow } = await supabase
    .from("relationship_intelligence")
    .select("data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const intel = intelRow?.data as RelationshipIntelligence | undefined;

  // Score history for milestones.
  const { data: scoreRows } = await supabase
    .from("scores")
    .select("trust, communication, connection, intimacy, overall, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  const trendPoints: TrendPoint[] = (scoreRows || []).map((r) => ({
    date: r.created_at,
    overall: r.overall,
    trust: r.trust,
    communication: r.communication,
    connection: r.connection,
    intimacy: r.intimacy,
  }));

  const snapshot = intel ? coachSnapshot(intel) : null;
  const journey = intel ? recoveryJourney(intel) : null;
  const critical = intel ? criticalInsights(intel) : [];
  const milestones = runMilestones(trendPoints);

  // Load workspace data.
  const [{ data: sessions }, { data: cards }] = await Promise.all([
    supabase
      .from("coach_sessions")
      .select("id, prompt, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("coach_cards")
      .select("id, type, title, body, status, session_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const allCards = (cards || []) as StoredCoachCard[];
  const sessionList = (sessions || []) as CoachSession[];
  const latestSessionId = sessionList[0]?.id;
  const activeCards = allCards
    .filter((c) => c.session_id === latestSessionId)
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  return (
    <main className="flex min-h-screen flex-col bg-soft">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">BetterUs Coach™</h1>
          <p className="text-xs font-medium text-slate-400">Powered by the BetterUs Relationship Intelligence Engine™</p>
        </div>
        <CoachWorkspace
          initialActive={activeCards}
          initialQuestion={null}
          initialInsights={allCards.filter((c) => c.type === "insight")}
          initialScripts={allCards.filter((c) => c.type === "script")}
          initialTasks={allCards.filter((c) => c.type === "task")}
          initialSessions={sessionList}
          usage={usage}
          premium={premium}
          snapshot={snapshot}
          journey={journey}
          critical={critical}
          milestones={milestones}
        />
      </div>
    </main>
  );
}
