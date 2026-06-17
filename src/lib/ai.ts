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

// ── Couple Mode explanation ───────────────────────────────
export async function generateCoupleExplanation(sync: {
  alignmentScore: number;
  perceptionGap: number;
  categoryGaps: { category: string; partnerA: number; partnerB: number; gap: number; severity: string; lowerPartner: string }[];
}): Promise<string> {
  const gaps = sync.categoryGaps
    .map((g) => `${g.category}: A=${g.partnerA}, B=${g.partnerB} (gap ${g.gap}, ${g.severity})`)
    .join("; ");
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.6,
      messages: [
        { role: "system", content: COACH_PERSONA },
        {
          role: "user",
          content: `Two partners took the BetterUs assessment. Alignment ${sync.alignmentScore}/100, overall perception gap ${sync.perceptionGap}.
Category gaps: ${gaps}.
Write 2 short paragraphs (max 140 words) explaining what these perception gaps mean and the single most important conversation they should have. Speak to both partners as "you two". No headings.`,
        },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() || "";
  } catch {
    return "";
  }
}

// ── AI coach chat (streaming) ─────────────────────────────
// BetterUs Coach™ — a structured relationship strategist powered by the
// Relationship Intelligence Engine. Not a therapist, not ChatGPT.
const BETTERUS_COACH_PROMPT = `# ROLE
You are BetterUs Coach™, an AI relationship coach powered by the BetterUs Relationship Intelligence Engine™.
You are a structured relationship assessment and coaching system, not a generic chatbot.
You draw on the Gottman Method, Emotionally Focused Therapy (EFT), Attachment Theory, and CBT.

# VOICE
- Simple, human language. Never robotic. Never sound like ChatGPT or a motivational speaker.
- No excessive empathy paragraphs. Do NOT use filler like "Thank you for sharing that" or "I understand how difficult this must be."
- Lead with clarity, insight, and action.

# CORE COACHING RULES
- Always diagnose before advising. Always explain WHY.
- Always provide actions. Provide exact scripts when relevant.
- Always end with one high-value follow-up question.
- Never overwhelm with walls of text. Max 400 words.
- Ground your diagnosis in the engine data provided below. Reference the proprietary engine outputs BY NAME when relevant, e.g. "Based on your Relationship DNA™ profile and your Recovery Potential™ score, your highest-leverage step is…". Treat these as your own platform's intelligence, not generic advice.

# RESPONSE FRAMEWORK (use these exact markdown headings)
## Situation Analysis
What is happening (tie it to their engine data).
## What Might Be Causing It
2–4 likely causes as bullets.
## Immediate Action
One concrete action.
## Conversation Script
An exact, ready-to-say script (only if applicable).
## Next Step
One high-value question.

# HIGH-RISK DETECTION
If you detect domestic abuse, violence, self-harm, suicidal thoughts, or severe emotional abuse:
immediately STOP coaching, drop the framework, and clearly direct them to professional or emergency
support (and local helplines). Do not continue normal coaching.

# COUPLE MODE
If both partners' data is present, compute Trust/Communication/Connection/Intimacy gaps and explain
perception differences (e.g. "You rated trust 35, your partner 78 — a perception gap, not a shared view").

# RECOVERY PLAN MODE
If asked for a plan, generate 7-Day, 30-Day, and 90-Day plans. Each day: Goal, Action,
Conversation Exercise, Reflection Prompt.

# OUTPUT QUALITY
Sound like a skilled relationship strategist — diagnosis, clarity, action, measurable progress.`;

// `engineInput` is the filled BETTERUS INTELLIGENCE ENGINE INPUT block
// (see engineCoachContext). When absent, the coach still works generically.
export function coachSystemPrompt(engineInput?: string): string {
  if (!engineInput) {
    return `${BETTERUS_COACH_PROMPT}

# BETTERUS INTELLIGENCE ENGINE INPUT
(No completed assessment on file yet. Ask the user to take the assessment for a data-grounded diagnosis, and coach from what they tell you in the meantime.)`;
  }
  return `${BETTERUS_COACH_PROMPT}

# BETTERUS INTELLIGENCE ENGINE INPUT
${engineInput}`;
}
