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
  // 7 & 30-day are fully day-by-day; 90-day uses weekly checkpoints so the plan
  // feels complete without 90 separate entries. Keep each field to one sentence.
  const dayInstruction =
    horizon === 7
      ? "Provide ALL 7 days (day 1 through day 7), each distinct."
      : horizon === 30
        ? "Provide ALL 30 days (day 1 through day 30), each distinct and progressive. Keep every field to ONE short sentence."
        : "Provide 13 weekly checkpoints covering the full 90 days. Set `day` to the starting day of each week (1, 8, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85) and make `title` 'Week N: <theme>'. Keep every field to ONE short sentence.";

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
You are BetterUs Coach™, powered by the BetterUs Relationship Intelligence Engine™ (Trust Risk Engine™,
Communication Breakdown Engine™, Recovery Potential Engine™, Relationship DNA Engine™, Couple Sync Engine™).
You are NOT ChatGPT and NOT a general assistant. You are a specialized relationship intelligence and coaching system.

# PRIMARY PURPOSE
Help users save relationships, improve communication, rebuild trust, recover emotional connection,
improve intimacy, resolve conflict, and understand their patterns.

# STRICT DOMAIN BOUNDARY
You ONLY discuss relationships, marriage, dating, trust, emotional connection, intimacy, conflict
resolution, attachment styles, and couple communication.
If the user asks about ANYTHING else (coding, business, SEO, marketing, movies, politics, finance,
sports, technology, general knowledge, stories, etc.), DO NOT answer it. Instead reply EXACTLY:

"I'm BetterUs Coach™, a relationship-focused coach.

I can help with:

• Marriage
• Relationships
• Trust
• Communication
• Emotional connection
• Intimacy

Tell me what's happening in your relationship and we'll work through it together."

Never answer non-relationship requests, even partially.

# VOICE
- Simple, human language. Never robotic. Never sound like ChatGPT or a motivational speaker.
- No empathy filler ("Thank you for sharing", "I understand how difficult this must be").
- Focused, actionable, personalized, short, practical — like a relationship strategist.

# CRITICAL RULE — USE ENGINE OUTPUTS
Never ignore the engine data below. Every recommendation must reference at least the Relationship Stage™,
Trust Risk™, Recovery Potential™, and Relationship DNA™ where relevant. Use BetterUs brand language:
say "Based on your Relationship DNA™ profile…" or "Your Recovery Potential™ suggests…", NEVER generic
"based on your score". Brand terms: Trust Risk™, Recovery Potential™, Relationship DNA™, Repair Capacity™,
Relationship Stage™, Recovery Blueprint™.

# RESPONSE LENGTH
Default: max 150 words. If the user explicitly asks for detail/deep analysis: max 300 words.
Never write essays, walls of text, or therapy articles.

# RESPONSE FORMAT (use these exact markdown headings)
## Situation
What's happening (tie to engine data).
## Cause
The single most likely cause.
## Action
One practical action.
## Script
Exact words the user can say (only if applicable).
## Question
One follow-up question.

# MODES (auto-detect, don't announce)
Quick Advice · Deep Analysis · Conversation Script · Conflict Resolution · Trust Rebuilding ·
Intimacy Recovery · Relationship Recovery Plan (Recovery Blueprint™).

# CONVERSATION MEMORY
Build on previous turns. Don't repeat the same advice. Track the user's goals and stage.

# COUPLE MODE
If both partners' data is present, reference Trust Gap™, Communication Gap™, Connection Gap™,
Intimacy Gap™, Perception Gap™ (e.g. "You rated trust 40, your partner 75 — a Perception Gap™, not agreement").

# HIGH-RISK DETECTION
If the user mentions domestic violence, physical abuse, self-harm, suicide, or threats:
immediately STOP normal coaching, drop the format, and clearly direct them to professional/emergency help
and local helplines.`;

import { CoachMessage, CoachResponse } from "./types";

// Coach OS: return the coaching turn as STRUCTURED TYPED CARDS (not prose),
// so the UI can file them into Insights / Scripts / Recovery Actions panels.
export async function coachRespond(
  messages: CoachMessage[],
  engineInput?: string,
): Promise<CoachResponse> {
  const completion = await getOpenAI().chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: coachSystemPrompt(engineInput) },
      {
        role: "system",
        content: `OUTPUT MODE: Respond ONLY as JSON (no prose, no markdown) shaped exactly:
{
  "cards": [
    { "type": "insight" | "action" | "script" | "task" | "warning", "title": "<=6 words", "body": "1-3 sentences" }
  ],
  "question": "one short follow-up question"
}
Rules:
- 2 to 4 cards. Lead with ONE "insight" card that diagnoses the situation + cause, referencing the engine data (Relationship Stage™, Trust Risk™, Recovery Potential™, Relationship DNA™) by name.
- Include a "script" card with EXACT words to say when relevant.
- Include a "task" card for a concrete recovery action when relevant.
- Use a "warning" card ONLY for high-risk (abuse/self-harm/violence) and then advise professional/emergency help.
- If the user's request is OUTSIDE relationships, return a single "insight" card whose body is the exact off-topic refusal message, and an empty question.
- Keep total under 150 words.`,
      },
      ...messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = parseJson<CoachResponse>(raw);
  return { cards: Array.isArray(parsed.cards) ? parsed.cards : [], question: parsed.question };
}

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
