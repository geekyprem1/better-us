import { Document, Page, Text, View, StyleSheet, Svg, Polygon, Line, Circle } from "@react-pdf/renderer";
import { RelationshipIntelligence, TrendPoint, TrendResult } from "@/lib/engine";
import { relationshipHeadline, RecoveryForecast } from "@/lib/engine/context";
import { AIAnalysis, RecoveryPlans } from "@/lib/types";
import { BRAND, BLUEPRINT } from "@/lib/brand";

const BLUE = "#1f49f5";
const DARK = "#0f172a";
const INK = "#1e293b";
const MUTE = "#64748b";
const FAINT = "#94a3b8";
const LINE = "#e2e8f0";
const GREEN = "#10b981";
const AMBER = "#f59e0b";
const RED = "#ef4444";

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 54, paddingHorizontal: 40, fontSize: 10.5, color: INK, lineHeight: 1.5, fontFamily: "Helvetica" },
  // header band
  kicker: { fontSize: 8, color: BLUE, fontFamily: "Helvetica-Bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 6 },
  h2: { fontSize: 15, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 8 },
  h3: { fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 3 },
  p: { marginBottom: 8, color: INK },
  mute: { color: MUTE },
  // cover
  cover: { flex: 1, justifyContent: "center", paddingHorizontal: 48 },
  coverBrand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: BLUE, marginBottom: 10 },
  coverTitle: { fontSize: 32, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 8, lineHeight: 1.15 },
  coverSub: { fontSize: 11, color: MUTE, marginBottom: 28 },
  coverScore: { fontSize: 72, fontFamily: "Helvetica-Bold", color: BLUE },
  // chips / cards
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { borderWidth: 1, borderColor: LINE, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, minWidth: 120 },
  chipLabel: { fontSize: 7.5, color: FAINT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  chipValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: DARK },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: { borderWidth: 1, borderColor: LINE, borderRadius: 10, padding: 12, marginBottom: 8 },
  scoreCard: { width: "31.5%", borderWidth: 1, borderColor: LINE, borderRadius: 10, padding: 11 },
  // bars
  barTrack: { height: 7, borderRadius: 4, backgroundColor: "#eef2f7", marginTop: 4, marginBottom: 2 },
  barFill: { height: 7, borderRadius: 4 },
  // list
  li: { flexDirection: "row", marginBottom: 5 },
  bullet: { color: BLUE, marginRight: 6, fontFamily: "Helvetica-Bold" },
  tag: { fontSize: 7.5, color: BLUE, fontFamily: "Helvetica-Bold", marginBottom: 6, letterSpacing: 0.5 },
  // forecast
  fcRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  fcCell: { flex: 1, borderRadius: 8, padding: 10, alignItems: "center" },
  // footer
  footer: { position: "absolute", bottom: 26, left: 40, right: 40, fontSize: 7.5, color: FAINT, textAlign: "center", borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8 },
  pageNum: { position: "absolute", bottom: 26, right: 40, fontSize: 7.5, color: FAINT },
  dayCard: { borderWidth: 1, borderColor: LINE, borderRadius: 8, padding: 10, marginBottom: 6 },
  dayKey: { fontFamily: "Helvetica-Bold", color: INK },
  daySub: { fontSize: 9, color: MUTE, marginBottom: 2, lineHeight: 1.4 },
  locked: { borderWidth: 1, borderColor: LINE, borderRadius: 10, padding: 14, marginBottom: 8, backgroundColor: "#f8fafc" },
});

function riskColor(level: string) {
  if (["Low", "Very High", "High", "Thriving", "Strong"].includes(level)) return GREEN;
  if (["Moderate", "Healthy", "Stable"].includes(level)) return BLUE;
  if (["Needs Attention", "Emotionally Distanced", "At Risk"].includes(level)) return AMBER;
  return RED;
}
function scoreColor(v: number) {
  if (v >= 75) return GREEN;
  if (v >= 60) return "#84cc16";
  if (v >= 40) return AMBER;
  return RED;
}

function Footer() {
  return (
    <>
      <Text style={s.footer} fixed>
        {BRAND.reportTitle} · {BRAND.generatedBy} · Confidential
      </Text>
      <Text style={s.pageNum} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 9.5, color: INK }}>{label}</Text>
        <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: scoreColor(value) }}>{value}</Text>
      </View>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${value}%`, backgroundColor: scoreColor(value) }]} />
      </View>
    </View>
  );
}

function List({ items }: { items?: string[] }) {
  return (
    <View>
      {(items || []).map((t, i) => (
        <View style={s.li} key={i}>
          <Text style={s.bullet}>•</Text>
          <Text>{t}</Text>
        </View>
      ))}
    </View>
  );
}

// Radar chart (Trust, Communication, Connection, Intimacy, Repair, Stability).
function Radar({ data }: { data: { label: string; value: number }[] }) {
  const size = 250;
  const c = size / 2;
  const R = 86;
  const n = data.length;
  const angle = (k: number) => -Math.PI / 2 + (2 * Math.PI * k) / n;
  const ring = (scale: number) =>
    data.map((_, k) => `${c + scale * R * Math.cos(angle(k))},${c + scale * R * Math.sin(angle(k))}`).join(" ");
  const valuePts = data
    .map((d, k) => `${c + (d.value / 100) * R * Math.cos(angle(k))},${c + (d.value / 100) * R * Math.sin(angle(k))}`)
    .join(" ");

  return (
    <Svg width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map((sc) => (
        <Polygon key={sc} points={ring(sc)} fill="none" stroke={LINE} strokeWidth={1} />
      ))}
      {data.map((_, k) => (
        <Line key={k} x1={c} y1={c} x2={c + R * Math.cos(angle(k))} y2={c + R * Math.sin(angle(k))} stroke={LINE} strokeWidth={1} />
      ))}
      <Polygon points={valuePts} fill="rgba(31,73,245,0.18)" stroke={BLUE} strokeWidth={2} />
      {data.map((d, k) => (
        <Circle key={k} cx={c + (d.value / 100) * R * Math.cos(angle(k))} cy={c + (d.value / 100) * R * Math.sin(angle(k))} r={2.5} fill={BLUE} />
      ))}
      {data.map((d, k) => {
        const lr = R + 16;
        return (
          <Text key={k} x={c + lr * Math.cos(angle(k))} y={c + lr * Math.sin(angle(k)) + 3} textAnchor="middle" fill={MUTE} style={{ fontSize: 7 }}>
            {d.label}
          </Text>
        );
      })}
    </Svg>
  );
}

export interface ReportPdfData {
  name?: string;
  intel: RelationshipIntelligence;
  analysis?: AIAnalysis;
  plans?: RecoveryPlans;
  history: TrendPoint[];
  trends: TrendResult;
  forecast: RecoveryForecast;
  date: string;
}

// ── DNA explanation templates ─────────────────────────────────
const ATTACH: Record<string, { means: string; improve: string }> = {
  Secure: { means: "You're comfortable with closeness and independence.", improve: "Keep modeling steadiness — it stabilizes your partner." },
  "Anxious-Preoccupied": { means: "You crave closeness and fear losing it.", improve: "Self-soothe before seeking reassurance; ask directly for what you need." },
  "Dismissive-Avoidant": { means: "You value independence and pull back under stress.", improve: "Practice staying present 10 extra seconds before withdrawing." },
  "Fearful-Avoidant (Disorganized)": { means: "You want closeness but it also feels unsafe.", improve: "Build safety in small, predictable steps before deep vulnerability." },
  "Earning Secure (Mixed)": { means: "You're actively moving toward secure attachment.", improve: "Name your triggers out loud — awareness is already shifting the pattern." },
};

export function ReportDocument(d: ReportPdfData) {
  const { intel, analysis, plans, history, trends, forecast } = d;
  const h = relationshipHeadline(intel);
  const { health, trustRisk, communication, stage, recovery, dna } = intel;
  const attach = ATTACH[dna.attachmentStyle] ?? { means: "Shapes how you bond under stress.", improve: "Build emotional safety steadily." };

  const radar = [
    { label: "Trust", value: health.trust },
    { label: "Comm", value: health.communication },
    { label: "Connect", value: health.connection },
    { label: "Intimacy", value: health.intimacy },
    { label: "Repair", value: communication.repairCapacity },
    { label: "Stability", value: h.stabilityScore },
  ];

  const recDifficulty = recovery.score >= 60 ? "Low" : recovery.score >= 40 ? "Moderate" : "High";

  // per-dimension trend (latest - first)
  const trendOf = (k: "trust" | "communication" | "connection" | "intimacy" | "overall") => {
    if (history.length < 2) return { delta: 0, label: "Plateau" };
    const delta = history[history.length - 1][k] - history[0][k];
    const label = delta >= 5 ? "Improving" : delta <= -5 ? "Declining" : "Plateau";
    return { delta, label };
  };

  return (
    <Document title={BRAND.reportTitle} author="BetterUs">
      {/* PAGE 1 — COVER */}
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <Text style={s.coverBrand}>BetterUs</Text>
          <Text style={s.coverTitle}>{BRAND.reportTitle}</Text>
          <Text style={s.coverSub}>
            {d.name ? `Prepared for ${d.name}` : "Personalized report"} · {d.date} · {BRAND.generatedBy}
          </Text>
          <Text style={s.coverScore}>{h.healthScore}/100</Text>
          <View style={s.chipRow}>
            {[
              ["Relationship Stage™", stage.stage],
              ["Recovery Potential™", `${recovery.score}%`],
              ["Trust Risk™", trustRisk.level],
              ["Main Focus™", h.priorityFocus],
            ].map(([l, v]) => (
              <View key={l} style={s.chip}>
                <Text style={s.chipLabel}>{l}</Text>
                <Text style={[s.chipValue, { color: l === "Trust Risk™" ? riskColor(v) : DARK }]}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* PAGE 2 — RELATIONSHIP SNAPSHOT™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Executive Summary</Text>
        <Text style={s.h1}>Relationship Snapshot™</Text>
        <View style={s.grid}>
          {[
            ["Overall Health™", `${health.overall}/100`, scoreColor(health.overall)],
            ["Relationship Stage™", stage.stage, riskColor(stage.stage)],
            ["Recovery Potential™", `${recovery.score}% (${recovery.band})`, scoreColor(recovery.score)],
            ["Trust Risk™", trustRisk.level, riskColor(trustRisk.level)],
            ["Communication Risk™", communication.level, riskColor(communication.level)],
            ["Repair Capacity™", `${communication.repairCapacity}/100`, scoreColor(communication.repairCapacity)],
            ["Relationship DNA™", dna.attachmentStyle, DARK],
            ["Main Risk™", h.mainProblem, AMBER],
            ["Main Opportunity™", h.priorityFocus, BLUE],
            ["Recovery Difficulty™", recDifficulty, riskColor(recDifficulty)],
          ].map(([l, v, col]) => (
            <View key={l} style={s.scoreCard}>
              <Text style={s.chipLabel}>{l}</Text>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: col as string }}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={[s.card, { marginTop: 8 }]}>
          <Text style={s.h3}>What this means</Text>
          <Text style={s.mute}>{recovery.summary}</Text>
        </View>
        <Footer />
      </Page>

      {/* PAGE 3 — RELATIONSHIP SCORECARD™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Relationship Intelligence Engine™</Text>
        <Text style={s.h1}>Relationship Scorecard™</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Radar data={radar} />
          <View style={{ flex: 1 }}>
            {radar.map((r) => (
              <Bar key={r.label} label={r.label} value={r.value} />
            ))}
          </View>
        </View>
        <View style={[s.card, { marginTop: 6 }]}>
          <Text style={s.mute}>
            Your strongest area is{" "}
            <Text style={s.dayKey}>{[...radar].sort((a, b) => b.value - a.value)[0].label}</Text>; your biggest growth area is{" "}
            <Text style={s.dayKey}>{[...radar].sort((a, b) => a.value - b.value)[0].label}</Text>.
          </Text>
        </View>
        <Footer />
      </Page>

      {/* PAGE 4 — RELATIONSHIP INTELLIGENCE™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Generated by the Relationship Intelligence Engine™</Text>
        <Text style={s.h1}>Relationship Intelligence™</Text>
        {[
          ["Relationship Stage™", `${stage.stage} — ${stage.rationale}`],
          ["Trust Risk™", `${trustRisk.level} (index ${trustRisk.index}/100)`],
          ["Communication Breakdown™", `${communication.type} · primary pattern: ${communication.primaryFailure}`],
          ["Recovery Potential™", `${recovery.score}/100 (${recovery.band}) — ${recovery.summary}`],
          ["Repair Capacity™", `${communication.repairCapacity}/100`],
          ["Relationship DNA™", `${dna.attachmentStyle} · ${dna.conflictStyle} · ${dna.communicationStyle} · ${dna.connectionStyle}`],
        ].map(([l, v]) => (
          <View key={l} style={s.card}>
            <Text style={s.h3}>{l}</Text>
            <Text style={s.mute}>{v}</Text>
          </View>
        ))}
        <Footer />
      </Page>

      {/* PAGE 5 — RELATIONSHIP DNA™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Relationship DNA Engine™</Text>
        <Text style={s.h1}>Relationship DNA™</Text>
        {[
          { k: "Attachment Style", v: dna.attachmentStyle, means: attach.means, improve: attach.improve },
          { k: "Conflict Style", v: dna.conflictStyle, means: `Your conflict pattern is ${dna.conflictStyle}.`, improve: "Aim for repair attempts within the first few minutes of tension." },
          { k: "Communication Style", v: dna.communicationStyle, means: `You communicate in a ${dna.communicationStyle} way.`, improve: "Lead with 'I feel…' statements to lower defensiveness." },
          { k: "Connection Style", v: dna.connectionStyle, means: `Your connection style is ${dna.connectionStyle}.`, improve: "Protect one daily ritual of undistracted time together." },
        ].map((x) => (
          <View key={x.k} style={s.card}>
            <Text style={s.h3}>{x.k}: {x.v}</Text>
            <Text style={s.daySub}><Text style={s.dayKey}>What it means: </Text>{x.means}</Text>
            <Text style={s.daySub}><Text style={s.dayKey}>What to improve: </Text>{x.improve}</Text>
          </View>
        ))}
        <View style={s.card}>
          <Text style={s.h3}>Love Language Indicators</Text>
          <Text style={s.mute}>
            {dna.loveLanguageIndicators.map((l) => `${l.language} (${l.strength}%)`).join(" · ")}
          </Text>
        </View>
        <Footer />
      </Page>

      {/* PAGE 6 — TRUST RISK ENGINE™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Trust Risk Engine™</Text>
        <Text style={s.h1}>Trust Risk™: {trustRisk.level}</Text>
        <Bar label="Trust Score™" value={health.trust} />
        <View style={s.card}>
          <Text style={s.h3}>Trust Vulnerabilities™</Text>
          <List items={trustRisk.drivers} />
        </View>
        <View style={s.card}>
          <Text style={s.h3}>Trust Recovery Opportunities™</Text>
          <List
            items={[
              "Make and keep one small daily promise to rebuild reliability.",
              "Increase transparency — share context before it's asked for.",
              "Acknowledge past hurt explicitly; unspoken wounds keep trust fragile.",
            ]}
          />
        </View>
        <Footer />
      </Page>

      {/* PAGE 7 — COMMUNICATION BREAKDOWN ENGINE™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Communication Breakdown Engine™</Text>
        <Text style={s.h1}>{communication.type}</Text>
        <Text style={[s.p, s.mute]}>Communication Risk™: {communication.level} · Primary pattern: {communication.primaryFailure}</Text>
        <View style={s.card}>
          <Text style={s.h3}>Pattern breakdown</Text>
          {communication.patterns.map((p) => (
            <Bar key={p.pattern} label={p.pattern} value={p.risk} />
          ))}
        </View>
        <View style={s.card}>
          <Text style={s.h3}>Repair Recommendations™</Text>
          <List
            items={[
              "Use a 20-minute timeout when conversations escalate, then return.",
              "Replace criticism with a gentle start-up: 'I feel… about… I need…'.",
              "Reflect back what you heard before responding, to reduce defensiveness.",
            ]}
          />
        </View>
        <Footer />
      </Page>

      {/* PAGE 8 — RECOVERY FORECAST™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Recovery Potential Engine™</Text>
        <Text style={s.h1}>Recovery Forecast™</Text>

        <Text style={s.h3}>If nothing changes</Text>
        <View style={s.fcRow}>
          {[["30 Days", forecast.withoutAction.d30], ["60 Days", forecast.withoutAction.d60], ["90 Days", forecast.withoutAction.d90]].map(([l, v]) => (
            <View key={l} style={[s.fcCell, { backgroundColor: "#fef2f2" }]}>
              <Text style={{ fontSize: 8, color: MUTE }}>{l}</Text>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: riskColor(v) }}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={[s.h3, { marginTop: 10 }]}>If you follow your Recovery Blueprint™</Text>
        <View style={s.fcRow}>
          {[["30 Days", forecast.withAction.d30], ["60 Days", forecast.withAction.d60], ["90 Days", forecast.withAction.d90]].map(([l, v]) => (
            <View key={l} style={[s.fcCell, { backgroundColor: "#ecfdf5" }]}>
              <Text style={{ fontSize: 8, color: MUTE }}>{l}</Text>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: riskColor(v) }}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={[s.card, { marginTop: 12 }]}>
          <Text style={s.mute}>
            The gap between these two paths is your opportunity. Consistent action over the next 90 days is what
            moves your Relationship Stage™ in the right direction.
          </Text>
        </View>
        <Footer />
      </Page>

      {/* PAGE 9 — RELATIONSHIP JOURNEY™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Your progress</Text>
        <Text style={s.h1}>Relationship Journey™</Text>
        {history.length < 2 ? (
          <Text style={s.mute}>Retake the assessment over time to build your journey and momentum.</Text>
        ) : (
          <>
            <Text style={[s.p, s.mute]}>
              Overall progress: {trends.lifetime >= 0 ? "+" : ""}
              {trends.lifetime} points lifetime · {trends.thirtyDay >= 0 ? "+" : ""}
              {trends.thirtyDay} in 30 days · Momentum™: {trends.momentum}
            </Text>
            {history.slice(-8).reverse().map((p, i) => (
              <View key={i} style={[s.card, { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }]}>
                <Text style={s.mute}>{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Text>
                <Text style={{ fontFamily: "Helvetica-Bold", color: scoreColor(p.overall) }}>{p.overall}/100</Text>
              </View>
            ))}
          </>
        )}
        <Footer />
      </Page>

      {/* PAGE 10 — TREND INSIGHTS™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Emotional Drift Engine™</Text>
        <Text style={s.h1}>Trend Insights™</Text>
        {(["trust", "communication", "connection", "intimacy", "overall"] as const).map((k) => {
          const t = trendOf(k);
          const label = k.charAt(0).toUpperCase() + k.slice(1);
          return (
            <View key={k} style={[s.card, { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9 }]}>
              <Text style={s.dayKey}>{label} Trend™</Text>
              <Text style={{ color: t.delta > 0 ? GREEN : t.delta < 0 ? RED : MUTE, fontFamily: "Helvetica-Bold" }}>
                {t.label} ({t.delta >= 0 ? "+" : ""}{t.delta})
              </Text>
            </View>
          );
        })}
        {trends.insights.length > 0 && (
          <View style={s.card}>
            <List items={trends.insights} />
          </View>
        )}
        <Footer />
      </Page>

      {/* PAGE 11 — STRENGTHS™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>What's working</Text>
        <Text style={s.h1}>Strengths™</Text>
        <List items={(analysis?.strengths || []).slice(0, 5)} />
        <View style={[s.card, { marginTop: 6 }]}>
          <Text style={s.mute}>These strengths are your leverage — they're the foundation your recovery plan builds on.</Text>
        </View>
        <Footer />
      </Page>

      {/* PAGE 12 — RISK AREAS™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>What needs attention</Text>
        <Text style={s.h1}>Risk Areas™</Text>
        <List items={[...(analysis?.riskAreas || []), ...(analysis?.weaknesses || [])].slice(0, 5)} />
        <View style={[s.card, { marginTop: 6 }]}>
          <Text style={s.mute}>Left unaddressed, these patterns tend to compound — which is exactly what your Recovery Blueprint™ targets.</Text>
        </View>
        <Footer />
      </Page>

      {/* PAGE 13 — RECOVERY BLUEPRINT™ */}
      {plans?.sevenDay && (
        <Page size="A4" style={s.page}>
          <Text style={s.kicker}>Personalized Recovery Blueprint™</Text>
          <Text style={s.h1}>{BLUEPRINT.byHorizon[7]}</Text>
          <Text style={[s.p, s.mute]}>{plans.sevenDay.focus}</Text>
          {plans.sevenDay.days.map((day) => (
            <View style={s.dayCard} key={day.day} wrap={false}>
              <Text style={s.h3}>Day {day.day}: {day.title}</Text>
              <Text style={s.daySub}><Text style={s.dayKey}>Action: </Text>{day.dailyAction}</Text>
              <Text style={s.daySub}><Text style={s.dayKey}>Conversation: </Text>{day.conversationExercise}</Text>
              <Text style={s.daySub}><Text style={s.dayKey}>Reflection: </Text>{day.reflection}</Text>
              <Text style={s.daySub}><Text style={s.dayKey}>Goal: </Text>{day.trustActivity}</Text>
            </View>
          ))}
          <Footer />
        </Page>
      )}

      {/* PAGE 14 — LOCKED PREMIUM PREVIEW™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Unlock more</Text>
        <Text style={s.h1}>Premium Preview™</Text>
        {[
          ["30-Day Reconnection Blueprint™", "A full month of guided daily actions to rebuild momentum."],
          ["90-Day Relationship Recovery Blueprint™", "The complete recovery system across three months."],
          ["Couple Sync Report™", "Compare both partners' assessments and reveal perception gaps."],
          ["Relationship Vault™", "Save every insight, script, and breakthrough — never lose progress."],
          ["Advanced Coaching™", "Priority access to BetterUs Coach™ with deeper sessions."],
        ].map(([t, sub]) => (
          <View key={t} style={s.locked}>
            <Text style={[s.h3, { color: MUTE }]}>🔒 {t}</Text>
            <Text style={s.daySub}>{sub}</Text>
          </View>
        ))}
        <Footer />
      </Page>

      {/* PAGE 15 — CONVERSION PAGE™ */}
      <Page size="A4" style={s.page}>
        <Text style={s.kicker}>Your Next Best Move™</Text>
        <Text style={s.h1}>Where you go from here</Text>
        <View style={s.chipRow}>
          {[
            ["Current Stage™", stage.stage],
            ["Recovery Potential™", `${recovery.score}%`],
            ["Trust Risk™", trustRisk.level],
            ["Main Focus™", h.priorityFocus],
          ].map(([l, v]) => (
            <View key={l} style={s.chip}>
              <Text style={s.chipLabel}>{l}</Text>
              <Text style={s.chipValue}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={[s.card, { marginTop: 12 }]}>
          <Text style={s.h3}>Recommended next steps</Text>
          <List
            items={[
              "Complete your Recovery Blueprint™ — one day at a time.",
              "Use BetterUs Coach™ for scripts and in-the-moment guidance.",
              "Invite your partner with Couple Sync™.",
              "Re-assess in 2–4 weeks to track Relationship Momentum™.",
            ]}
          />
        </View>
        <View style={[s.card, { backgroundColor: "#eef4ff", borderColor: "#bcd3ff", alignItems: "center", paddingVertical: 18 }]}>
          <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: DARK }}>Unlock Premium</Text>
          <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: BLUE, marginVertical: 4 }}>₹499 / month</Text>
          <Text style={s.mute}>Start your recovery today at betterus.life</Text>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
