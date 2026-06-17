"use client";

import { useState } from "react";
import Link from "next/link";
import { StoredCoachCard, CoachSession, CoachCardType } from "@/lib/types";
import type { CoachUsage } from "@/lib/entitlements";
import type { CoachSnapshot, RecoveryJourney, CriticalInsight } from "@/lib/engine/context";
import type { Milestone } from "@/lib/engine";
import { PricingModal } from "./PricingModal";
import { track, EVENTS } from "@/lib/analytics";

const quickActions = [
  { icon: "🛠", label: "Generate Script", prompt: "Give me an exact, ready-to-say conversation script I can use with my partner right now." },
  { icon: "❤️", label: "Trust Repair", prompt: "Based on my Trust Risk™, help me start rebuilding trust with my partner." },
  { icon: "💬", label: "Fix Communication", prompt: "Help me fix our communication based on my Communication style." },
  { icon: "📅", label: "Recovery Plan", prompt: "Give me my next Recovery Blueprint™ step based on my Recovery Potential™." },
];

const CARD_META: Record<CoachCardType, { icon: string; ring: string; chip: string; label: string }> = {
  insight: { icon: "🧠", ring: "border-brand-200", chip: "bg-brand-50 text-brand-700", label: "Insight" },
  action: { icon: "⚡", ring: "border-amber-200", chip: "bg-amber-50 text-amber-700", label: "Action" },
  script: { icon: "💬", ring: "border-violet-200", chip: "bg-violet-50 text-violet-700", label: "Script" },
  task: { icon: "✅", ring: "border-emerald-200", chip: "bg-emerald-50 text-emerald-700", label: "Recovery Task" },
  warning: { icon: "⚠️", ring: "border-red-300", chip: "bg-red-50 text-red-700", label: "Warning" },
};

const UPGRADE_AREAS = [
  "Relationship Vault™",
  "Unlimited History™",
  "Couple Sync™",
  "Advanced Recovery Blueprint™",
  "PDF Intelligence Report™",
  "Priority Coaching™",
];

type Tab = "scripts" | "tasks" | "milestones" | "history";

export function CoachWorkspace(props: {
  initialActive: StoredCoachCard[];
  initialQuestion: string | null;
  initialInsights: StoredCoachCard[];
  initialScripts: StoredCoachCard[];
  initialTasks: StoredCoachCard[];
  initialSessions: CoachSession[];
  usage: CoachUsage;
  premium: boolean;
  snapshot: CoachSnapshot | null;
  journey: RecoveryJourney | null;
  critical: CriticalInsight[];
  milestones: Milestone[];
}) {
  const { usage, premium, snapshot, journey, critical, milestones } = props;
  const [active, setActive] = useState<StoredCoachCard[]>(props.initialActive);
  const [prompt, setPrompt] = useState<string>(props.initialSessions[0]?.prompt ?? "");
  const [question, setQuestion] = useState<string | null>(props.initialQuestion);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(usage.remaining);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const locked = remaining <= 0;

  const [insights, setInsights] = useState(props.initialInsights);
  const [scripts, setScripts] = useState(props.initialScripts);
  const [tasks, setTasks] = useState(props.initialTasks);
  const [sessions, setSessions] = useState(props.initialSessions);
  const [tab, setTab] = useState<Tab>("tasks");
  const [showAllInsights, setShowAllInsights] = useState(false);

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const taskPct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const allDone = tasks.length > 0 && doneTasks === tasks.length;

  async function ask(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    if (locked) {
      setShowUpgrade(true);
      return;
    }
    setLoading(true);
    setError(null);
    setPrompt(content);
    setInput("");
    track(EVENTS.COACH_MESSAGE);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content }] }),
      });
      const data = await res.json();
      if (res.status === 403 && data.error === "limit_reached") {
        setRemaining(0);
        setShowUpgrade(true);
        return;
      }
      if (!res.ok) throw new Error(data.detail || data.error || "Failed");

      if (data.usage) setRemaining(data.usage.remaining);
      const cards: StoredCoachCard[] = data.cards || [];
      setActive(cards);
      setQuestion(data.question || null);
      setInsights((p) => [...cards.filter((c) => c.type === "insight"), ...p]);
      setScripts((p) => [...cards.filter((c) => c.type === "script"), ...p]);
      setTasks((p) => [...cards.filter((c) => c.type === "task"), ...p]);
      if (data.session) setSessions((p) => [data.session, ...p]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(id: string) {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "open" : "done" } : t)));
    await fetch("/api/coach/card", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle" }),
    });
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "tasks", label: "Today's Tasks", count: tasks.length },
    { key: "scripts", label: "Scripts", count: scripts.length },
    { key: "milestones", label: "Milestones" },
    { key: "history", label: "History", count: sessions.length },
  ];

  return (
    <div className="space-y-5">
      {/* ── Relationship Snapshot™ (top summary bar) ──────── */}
      {snapshot ? (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 text-center sm:grid-cols-5">
          {[
            { l: "Relationship Stage™", v: snapshot.stage },
            { l: "Recovery Potential™", v: `${snapshot.recovery}%` },
            { l: "Trust Risk™", v: snapshot.trustRisk },
            { l: "Current Focus™", v: snapshot.currentFocus },
            { l: "Next Milestone™", v: snapshot.nextMilestone },
          ].map((s) => (
            <div key={s.l} className="bg-white px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{s.l}</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">{s.v}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-center text-sm text-slate-600">
          Take the assessment to unlock your Relationship Snapshot™ and grounded coaching.{" "}
          <Link href="/assessment" className="font-semibold text-brand-600 hover:underline">
            Start now →
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Active Conversation Area ────────────────────── */}
        <div className="space-y-4 lg:col-span-3">
          {/* Coaching Capacity™ */}
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
              locked ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="text-sm">
              <span className="font-semibold text-slate-800">Today's Coaching Capacity™</span>
              <span className="ml-2 text-slate-500">
                {remaining} session{remaining === 1 ? "" : "s"} available
              </span>
              <p className="text-xs text-slate-400">Focus on one meaningful relationship issue per session.</p>
            </div>
            {usage.tier !== "premium" && (
              <button onClick={() => setShowUpgrade(true)} className="text-xs font-semibold text-brand-600 hover:underline">
                Upgrade
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => ask(a.prompt)}
                disabled={loading || locked}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
              >
                <span>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex items-end gap-2">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={locked}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); }
              }}
              placeholder={locked ? "You've used your coaching for now…" : "Describe what's happening in your relationship…"}
              className="max-h-40 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={loading || locked || !input.trim()}
              className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "…" : "Ask"}
            </button>
          </form>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {locked && (
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 text-center">
              <p className="font-semibold text-slate-900">
                {usage.period === "day" ? "You've reached today's coaching capacity." : "You've used your free coaching messages."}
              </p>
              <p className="mt-1 text-sm text-slate-600">Upgrade for additional sessions and personalized recovery support.</p>
              <button onClick={() => setShowUpgrade(true)} className="mt-4 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                Upgrade Now
              </button>
            </div>
          )}

          {/* Active response */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            {prompt && (
              <p className="mb-4 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600">
                <span className="text-slate-400">You asked:</span> {prompt}
              </p>
            )}
            {loading ? (
              <div className="py-10 text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
                <p className="mt-3 text-sm text-slate-500">BetterUs Coach™ is analyzing…</p>
              </div>
            ) : active.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Tap a quick action or describe what's happening — your coaching cards appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {active.map((c) => (
                  <CardView key={c.id} card={c} onToggle={c.type === "task" ? () => toggleTask(c.id) : undefined} />
                ))}
                {question && (
                  <div className="rounded-2xl bg-brand-50 p-4 text-sm text-slate-700">
                    <span className="font-semibold text-brand-700">Coach asks:</span> {question}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Relationship Vault™ (sidebar) ───────────────── */}
        <div className="space-y-4 lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">🔐 Relationship Vault™</p>

          {/* Recovery Journey™ */}
          {journey && journey.nextStage && (
            premium ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">Recovery Journey™</h3>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{journey.currentStage}</span>
                  <span>→</span>
                  <span className="font-semibold text-brand-600">{journey.nextStage}</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${journey.progress}%` }} />
                </div>
                <p className="mt-1 text-right text-xs font-semibold text-slate-500">{journey.progress}%</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {journey.needs.map((n) => (
                    <span key={n.label} className="rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
                      {n.label} needed +{n.needed}
                    </span>
                  ))}
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    Recovery {journey.recovery}%
                  </span>
                </div>
              </div>
            ) : (
              <Locked title="Recovery Journey™" blurb="See your path to the next relationship stage." onUpgrade={() => setShowUpgrade(true)} />
            )
          )}

          {/* Critical Insights™ */}
          {critical.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">Critical Insights™</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {critical.slice(0, 3).map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <span>{c.icon}</span>
                    <span>{c.text}</span>
                  </li>
                ))}
              </ul>
              {insights.length > 0 && (
                <button onClick={() => setShowAllInsights((v) => !v)} className="mt-3 text-xs font-semibold text-brand-600 hover:underline">
                  {showAllInsights ? "Hide coach insights" : "View all insights →"}
                </button>
              )}
              {showAllInsights && (
                <div className="mt-3 space-y-2">
                  {insights.map((c) => <CardView key={c.id} card={c} compact />)}
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  tab === t.key ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
                {typeof t.count === "number" && t.count > 0 && <span className="opacity-70"> ({t.count})</span>}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "tasks" && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Today's Recovery Tasks™</h3>
                <span className="text-xs font-semibold text-slate-500">{doneTasks}/{tasks.length} · {taskPct}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${taskPct}%` }} />
              </div>
              {allDone ? (
                <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center">
                  <div className="text-2xl">🎉</div>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">Great work. Consistency creates recovery momentum.</p>
                </div>
              ) : tasks.length === 0 ? (
                <Empty text="Recovery actions the coach suggests will appear here." />
              ) : (
                <div className="mt-3 space-y-2">
                  {tasks.map((t) => (
                    <label key={t.id} className="flex cursor-pointer items-start gap-2 text-sm">
                      <input type="checkbox" checked={t.status === "done"} onChange={() => toggleTask(t.id)} className="mt-1 accent-emerald-600" />
                      <span className={t.status === "done" ? "text-slate-400 line-through" : "text-slate-700"}>
                        <span className="font-semibold">{t.title}</span> — {t.body}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "scripts" && (
            <div className="space-y-3">
              {scripts.length ? scripts.map((c) => <CardView key={c.id} card={c} compact />) : <Empty text="Saved scripts live here." />}
            </div>
          )}

          {tab === "milestones" && (
            <div className="grid grid-cols-2 gap-2">
              {milestones.map((m) => (
                <div key={m.id} className={`rounded-2xl border p-3 ${m.achieved ? "border-brand-200 bg-brand-50/50" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                  <div className={`text-xl ${m.achieved ? "" : "grayscale"}`}>{m.icon}</div>
                  <p className="mt-1 text-xs font-semibold text-slate-900">{m.name}</p>
                  <p className="text-[11px] text-slate-500">{m.description}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "history" &&
            (sessions.length ? (
              <div className="space-y-2">
                {(premium ? sessions : sessions.slice(0, 3)).map((sx) => (
                  <div key={sx.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-700">{sx.prompt}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(sx.created_at).toLocaleString()}</p>
                  </div>
                ))}
                {!premium && sessions.length > 3 && (
                  <Locked title="Unlimited History™" blurb="Keep your full coaching history forever." onUpgrade={() => setShowUpgrade(true)} />
                )}
              </div>
            ) : (
              <Empty text="Your past sessions will be listed here." />
            ))}

          {/* Premium upgrade areas */}
          {!premium && (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Unlock with Premium</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {UPGRADE_AREAS.map((a) => (
                  <button key={a} onClick={() => setShowUpgrade(true)} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm hover:text-brand-700">
                    🔒 {a}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <PricingModal open={showUpgrade} onClose={() => setShowUpgrade(false)} isLoggedIn={true} />
    </div>
  );
}

function Locked({ title, blurb, onUpgrade }: { title: string; blurb: string; onUpgrade: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4 text-center">
      <p className="text-sm font-semibold text-slate-900">🔒 {title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{blurb}</p>
      <button onClick={onUpgrade} className="mt-2 text-xs font-semibold text-brand-600 hover:underline">
        Unlock with Premium →
      </button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">{text}</div>;
}

function CardView({ card, onToggle, compact }: { card: StoredCoachCard; onToggle?: () => void; compact?: boolean }) {
  const meta = CARD_META[card.type];
  const done = card.status === "done";
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${meta.ring} ${done ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${meta.chip}`}>
          {meta.icon} {meta.label}
        </span>
        {card.type === "script" && (
          <button onClick={() => navigator.clipboard.writeText(card.body)} className="text-xs font-semibold text-slate-400 hover:text-brand-600">
            Copy
          </button>
        )}
        {onToggle && card.type === "task" && (
          <button onClick={onToggle} className={`text-xs font-semibold ${done ? "text-emerald-600" : "text-slate-400 hover:text-emerald-600"}`}>
            {done ? "✓ Done" : "Mark done"}
          </button>
        )}
      </div>
      <p className={`mt-2 font-semibold text-slate-900 ${done ? "line-through" : ""}`}>{card.title}</p>
      <p className={`mt-1 text-sm leading-relaxed text-slate-600 ${compact ? "line-clamp-4" : ""} ${card.type === "script" ? "italic" : ""}`}>
        {card.body}
      </p>
    </div>
  );
}
