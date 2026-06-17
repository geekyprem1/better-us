import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { RelationshipIntelligence } from "@/lib/engine";
import { relationshipHeadline } from "@/lib/engine/context";
import { AIAnalysis, RecoveryPlans } from "@/lib/types";
import { BRAND, BLUEPRINT } from "@/lib/brand";

const BRAND_COLOR = "#1f49f5";
const INK = "#0f172a";
const MUTE = "#64748b";

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 44, fontSize: 11, color: INK, lineHeight: 1.5 },
  cover: { paddingTop: 160, paddingHorizontal: 44 },
  brand: { fontSize: 14, fontWeight: 700, color: BRAND_COLOR, marginBottom: 8 },
  coverTitle: { fontSize: 30, fontWeight: 700, marginBottom: 12 },
  coverSub: { fontSize: 12, color: MUTE, marginBottom: 40 },
  coverStat: { fontSize: 64, fontWeight: 700, color: BRAND_COLOR },
  coverStatus: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  h2: { fontSize: 16, fontWeight: 700, marginBottom: 10, marginTop: 8, color: INK },
  card: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 12, marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  statBox: { width: "31%", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 10 },
  statLabel: { fontSize: 8, color: MUTE, textTransform: "uppercase" },
  statValue: { fontSize: 16, fontWeight: 700, marginTop: 2 },
  li: { marginBottom: 4, flexDirection: "row" },
  bullet: { color: BRAND_COLOR, marginRight: 6 },
  label: { fontSize: 9, color: MUTE, textTransform: "uppercase", marginBottom: 2 },
  para: { marginBottom: 8 },
  footer: { position: "absolute", bottom: 28, left: 44, right: 44, fontSize: 8, color: MUTE, textAlign: "center" },
  pageNum: { position: "absolute", bottom: 28, right: 44, fontSize: 8, color: MUTE },
  dayTitle: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  daySub: { fontSize: 9, color: MUTE, marginBottom: 1 },
});

export interface ReportPdfData {
  name?: string;
  intel: RelationshipIntelligence;
  analysis?: AIAnalysis;
  plans?: RecoveryPlans;
  date: string;
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

export function ReportDocument({ name, intel, analysis, plans, date }: ReportPdfData) {
  const h = relationshipHeadline(intel);
  const { health, dna } = intel;

  return (
    <Document title={BRAND.reportTitle} author="BetterUs">
      {/* Cover */}
      <Page size="A4" style={s.cover}>
        <Text style={s.brand}>BetterUs</Text>
        <Text style={s.coverTitle}>{BRAND.reportTitle}</Text>
        <Text style={s.coverSub}>
          {name ? `Prepared for ${name}` : "Personalized report"} · {date}
        </Text>
        <Text style={[s.coverSub, { marginTop: -32, marginBottom: 40 }]}>{BRAND.generatedBy}</Text>
        <Text style={s.coverStat}>{h.healthScore}/100</Text>
        <Text style={s.coverStatus}>{h.status}</Text>
        <Text style={{ color: MUTE, marginTop: 6 }}>
          Recovery Potential: {h.recoveryLabel} · Main focus: {h.priorityFocus}
        </Text>
        <Text style={s.footer}>
          BetterUs is a coaching tool, not a substitute for professional therapy or crisis services.
        </Text>
      </Page>

      {/* Scores + Intelligence */}
      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Your Scores</Text>
        <View style={s.row}>
          {[
            ["Overall", health.overall],
            ["Trust", health.trust],
            ["Communication", health.communication],
            ["Connection", health.connection],
            ["Intimacy", health.intimacy],
            ["Stability", h.stabilityScore],
          ].map(([l, v]) => (
            <View style={s.statBox} key={l as string}>
              <Text style={s.statLabel}>{l}</Text>
              <Text style={s.statValue}>{v}/100</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>Relationship Intelligence</Text>
        <View style={s.card}>
          <Text style={s.label}>Stage</Text>
          <Text style={s.para}>{intel.stage.stage} — {intel.stage.rationale}</Text>
          <Text style={s.label}>Recovery</Text>
          <Text style={s.para}>{intel.recovery.score}/100 ({intel.recovery.band}) — {intel.recovery.summary}</Text>
          <Text style={s.label}>Relationship DNA</Text>
          <Text>
            {dna.attachmentStyle} attachment · {dna.conflictStyle} conflict · {dna.communicationStyle} communicator · {dna.connectionStyle} connection
          </Text>
        </View>

        <Text style={s.h2}>Why your trust risk is {intel.trustRisk.level}</Text>
        <List items={intel.trustRisk.drivers} />

        <Text style={s.footer}>© BetterUs · Confidential relationship report</Text>
        <Text style={s.pageNum} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>

      {/* AI Analysis */}
      {analysis && (
        <Page size="A4" style={s.page}>
          <Text style={s.h2}>AI Relationship Analysis</Text>
          <Text style={s.para}>{analysis.summary}</Text>
          <Text style={s.h2}>Strengths</Text>
          <List items={analysis.strengths} />
          <Text style={s.h2}>Growth Areas</Text>
          <List items={analysis.weaknesses} />
          <Text style={s.h2}>Risk Areas</Text>
          <List items={analysis.riskAreas} />
          <Text style={s.h2}>Recommendations</Text>
          <List items={analysis.recommendations} />
          <Text style={s.footer}>© BetterUs · Confidential relationship report</Text>
          <Text style={s.pageNum} render={({ pageNumber }) => `${pageNumber}`} fixed />
        </Page>
      )}

      {/* 7-Day Recovery Plan */}
      {plans?.sevenDay && (
        <Page size="A4" style={s.page}>
          <Text style={s.h2}>{BLUEPRINT.byHorizon[7]}</Text>
          <Text style={[s.para, { color: MUTE }]}>{plans.sevenDay.focus}</Text>
          {plans.sevenDay.days.map((d) => (
            <View style={s.card} key={d.day} wrap={false}>
              <Text style={s.dayTitle}>Day {d.day}: {d.title}</Text>
              <Text style={s.daySub}>🎯 {d.dailyAction}</Text>
              <Text style={s.daySub}>💬 {d.conversationExercise}</Text>
              <Text style={s.daySub}>📓 {d.reflection}</Text>
              <Text style={s.daySub}>🤝 {d.trustActivity}</Text>
            </View>
          ))}
          <Text style={s.footer}>
            Full 30 & 90-day plans are available in your BetterUs dashboard.
          </Text>
          <Text style={s.pageNum} render={({ pageNumber }) => `${pageNumber}`} fixed />
        </Page>
      )}
    </Document>
  );
}
