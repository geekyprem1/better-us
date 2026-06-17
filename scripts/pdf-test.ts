// npx tsx scripts/pdf-test.ts  → writes test-report.pdf for visual QA.
import fs from "fs";

async function main() {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { QUESTIONS } = await import("../src/lib/questions");
  const { runIntelligence, runTrends } = await import("../src/lib/engine");
  const { recoveryForecast } = await import("../src/lib/engine/context");
  const { ReportDocument } = await import("../src/lib/pdf/ReportDocument");

  const answers: Record<string, number> = {};
  for (const q of QUESTIONS) answers[q.id] = q.reverse ? 4 : 2; // struggling profile
  const intel = runIntelligence(answers);

  const history = [
    { date: "2026-05-18T00:00:00Z", overall: 41, trust: 38, communication: 44, connection: 42, intimacy: 40 },
    { date: "2026-06-01T00:00:00Z", overall: 47, trust: 43, communication: 50, connection: 46, intimacy: 49 },
    { date: "2026-06-17T00:00:00Z", overall: 53, trust: 50, communication: 55, connection: 52, intimacy: 55 },
  ];

  const day = (n: number) => ({
    day: n,
    title: "Vulnerability as Strength",
    dailyAction:
      "Share one vulnerable emotion that you usually hide, e.g. 'I feel lonely when you don't ask about my day.' Keep it honest and specific.",
    conversationExercise:
      "Use the 'Gentle Start-Up' formula: 'I feel [emotion] about [situation] and I need [request].' Avoid blame language entirely.",
    reflection: "What stopped me from being vulnerable before? Did anything change today?",
    trustActivity: "Sit back-to-back for 5 minutes. Take turns saying one thing you appreciate.",
  });

  const doc = ReportDocument({
    name: "Test User",
    intel,
    analysis: {
      summary: "This is a long multi-sentence summary to verify wrapping. ".repeat(6),
      strengths: ["You repair well after conflict", "Strong shared companionship"],
      weaknesses: ["Emotional closeness has thinned over time"],
      riskAreas: ["Avoidance of difficult conversations could deepen distance"],
      recommendations: ["Schedule a weekly 15-minute check-in with no phones"],
    },
    plans: {
      sevenDay: { horizon: 7, focus: "Rebuild emotional safety", days: [day(1), day(2), day(3), day(4), day(5), day(6), day(7)] },
      thirtyDay: { horizon: 30, focus: "", days: [] },
      ninetyDay: { horizon: 90, focus: "", days: [] },
    },
    history,
    trends: runTrends(history),
    forecast: recoveryForecast(intel),
    date: "17 June 2026",
  });

  const buf = await renderToBuffer(doc);
  fs.writeFileSync("test-report.pdf", buf);
  console.log("Wrote test-report.pdf (" + buf.length + " bytes)");
}

main().catch((e) => { console.error(e); process.exit(1); });
