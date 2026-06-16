import { getOpenAI, OPENAI_MODEL } from "./openai";
import { ScoreResult } from "./scoring";
import { AIAnalysis, RecoveryPlan, RecoveryPlans } from "./types";
import { QUESTIONS } from "./questions";
import { Answers } from "./scoring";

// Robustly parse model JSON: some providers (e.g. DeepSeek) wrap the object in
// ```json fences or add prose. Strip fences and grab the outermost { ... }.
function parseJson<T>(raw: string): T {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1) s = s.slice(first, last + 1);
  return JSON.parse(s) as T;
}

const COACH_PERSONA = `You are Dr. Maya, a warm, experienced relationship therapist and coach at BetterUs.
You are evidence-informed (Gottman, EFT, attachment theory) but you speak in plain, human language.
You are supportive and non-judgmental, never clinical or cold. You never blame either partner.
You give concrete, doable guidance. You are not a crisis service: if you detect abuse, self-harm,
or danger, you gently and clearly recommend professional/emergency help.`;

function answersDigest(scores: ScoreResult, answers: Answers): string {
  const lines = QUESTIONS.map((q) => {
    const v = answers[q.id];
    return `- [${q.category}] "${q.text}" → ${v ?? "n/a"}/5`;
  }).join("\n");
  return `SCORES (0-100): Trust ${scores.trust}, Communication ${scores.communication}, Connection ${scores.connection}, Intimacy ${scores.intimacy}. Overall ${scores.overall}.
RAW ANSWERS (1=strongly disagree, 5=strongly agree):
${lines}`;
}

// ── Relationship analysis ─────────────────────────────────
export async function generateAnalysis(
  scores: ScoreResult,
  answers: Answers,
): Promise<AIAnalysis> {
  const completion = await getOpenAI().chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: COACH_PERSONA },
      {
        role: "user",
        content: `A user completed the BetterUs relationship assessment. Write a professional, encouraging analysis.

${answersDigest(scores, answers)}

Return STRICT JSON with this shape:
{
  "summary": "2-3 warm paragraphs describing the overall state of the relationship",
  "strengths": ["3-5 specific strengths grounded in the answers"],
  "weaknesses": ["3-5 specific growth areas, phrased compassionately"],
  "riskAreas": ["2-4 patterns that could escalate if unaddressed"],
  "recommendations": ["4-6 concrete, prioritized next steps"]
}
Speak directly to the user as "you". Be specific to their scores, not generic.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  return parseJson<AIAnalysis>(raw);
}

// ── Recovery plan for a given horizon ─────────────────────
export async function generatePlan(
  horizon: 7 | 30 | 90,
  scores: ScoreResult,
  analysis: AIAnalysis,
): Promise<RecoveryPlan> {
  // For 30/90-day plans we generate representative milestone days to stay token-efficient.
  const dayInstruction =
    horizon === 7
      ? "Provide all 7 days (day 1 through 7)."
      : horizon === 30
        ? "Provide 8 milestone days: 1, 3, 7, 10, 14, 18, 24, 30."
        : "Provide 8 milestone days: 1, 7, 14, 30, 45, 60, 75, 90.";

  const completion = await getOpenAI().chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.6,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: COACH_PERSONA },
      {
        role: "user",
        content: `Design a ${horizon}-day relationship recovery plan.
Lowest scores deserve the most focus. Scores: Trust ${scores.trust}, Communication ${scores.communication}, Connection ${scores.connection}, Intimacy ${scores.intimacy}.
Key growth areas: ${analysis.weaknesses.join("; ")}.

${dayInstruction}

Return STRICT JSON:
{
  "focus": "one sentence describing the theme of this ${horizon}-day plan",
  "days": [
    {
      "day": 1,
      "title": "short title",
      "dailyAction": "a small concrete action for the day",
      "conversationExercise": "a prompt or script to talk through together",
      "reflection": "a journaling/reflection question",
      "trustActivity": "a trust- or connection-building activity"
    }
  ]
}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = parseJson<{ focus?: string; days?: RecoveryPlan["days"] }>(raw);
  return { horizon, focus: parsed.focus ?? "", days: parsed.days ?? [] };
}

export async function generateAllPlans(
  scores: ScoreResult,
  analysis: AIAnalysis,
): Promise<RecoveryPlans> {
  const [sevenDay, thirtyDay, ninetyDay] = await Promise.all([
    generatePlan(7, scores, analysis),
    generatePlan(30, scores, analysis),
    generatePlan(90, scores, analysis),
  ]);
  return { sevenDay, thirtyDay, ninetyDay };
}

// ── AI coach chat (streaming) ─────────────────────────────
export function coachSystemPrompt(context?: string): string {
  return `${COACH_PERSONA}

Coaching style:
- Start by acknowledging the user's feelings.
- Ask 1-2 clarifying questions when you need more context.
- Offer concrete actions and, when helpful, ready-to-use communication scripts ("You could say: ...").
- Keep responses focused and warm; avoid overwhelming the user with walls of text.
${context ? `\nWhat you know about this user's relationship assessment:\n${context}` : ""}`;
}
