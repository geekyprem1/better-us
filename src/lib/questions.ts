// The BetterUs assessment: 4 categories × 10 statements, answered on a 1–5 scale.
// `reverse: true` means a HIGH agreement indicates a WORSE relationship and is
// score-inverted by the scoring engine, so users can't game the test by patterning.

export type Category = "trust" | "communication" | "connection" | "intimacy";

export interface Question {
  id: string;
  category: Category;
  text: string;
  reverse?: boolean;
}

export const CATEGORIES: { key: Category; label: string; blurb: string }[] = [
  { key: "trust", label: "Trust", blurb: "Safety, honesty, and reliability" },
  { key: "communication", label: "Communication", blurb: "How you talk, listen, and resolve conflict" },
  { key: "connection", label: "Connection", blurb: "Emotional closeness and shared life" },
  { key: "intimacy", label: "Intimacy", blurb: "Affection, desire, and physical closeness" },
];

export const SCALE = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
];

export const QUESTIONS: Question[] = [
  // ── Trust ───────────────────────────────────────────────
  { id: "t1", category: "trust", text: "I trust my partner completely." },
  { id: "t2", category: "trust", text: "My partner keeps their promises to me." },
  { id: "t3", category: "trust", text: "I can rely on my partner when things get hard." },
  { id: "t4", category: "trust", text: "My partner is honest with me, even when it's uncomfortable." },
  { id: "t5", category: "trust", text: "I worry that my partner is hiding something from me.", reverse: true },
  { id: "t6", category: "trust", text: "I feel secure about where I stand in this relationship." },
  { id: "t7", category: "trust", text: "I often feel suspicious about my partner's behavior.", reverse: true },
  { id: "t8", category: "trust", text: "My partner respects my boundaries." },
  { id: "t9", category: "trust", text: "I believe my partner has my best interests at heart." },
  { id: "t10", category: "trust", text: "Past conflicts still make it hard for me to trust my partner.", reverse: true },

  // ── Communication ───────────────────────────────────────
  { id: "c1", category: "communication", text: "We resolve conflicts effectively." },
  { id: "c2", category: "communication", text: "I can express my feelings without fear of judgment." },
  { id: "c3", category: "communication", text: "My partner truly listens when I speak." },
  { id: "c4", category: "communication", text: "We avoid hard conversations instead of having them.", reverse: true },
  { id: "c5", category: "communication", text: "Our arguments often escalate and feel out of control.", reverse: true },
  { id: "c6", category: "communication", text: "We are able to apologize and repair after a fight." },
  { id: "c7", category: "communication", text: "I feel heard and understood by my partner." },
  { id: "c8", category: "communication", text: "We talk openly about our needs and expectations." },
  { id: "c9", category: "communication", text: "I often shut down or go silent during disagreements.", reverse: true },
  { id: "c10", category: "communication", text: "We communicate respectfully even when we disagree." },

  // ── Connection ──────────────────────────────────────────
  { id: "n1", category: "connection", text: "I feel emotionally connected to my partner." },
  { id: "n2", category: "connection", text: "We spend meaningful time together." },
  { id: "n3", category: "connection", text: "My partner is one of the first people I want to share news with." },
  { id: "n4", category: "connection", text: "We feel more like roommates than partners.", reverse: true },
  { id: "n5", category: "connection", text: "We share common goals for our future." },
  { id: "n6", category: "connection", text: "I feel lonely even when we are together.", reverse: true },
  { id: "n7", category: "connection", text: "My partner shows interest in my day and my world." },
  { id: "n8", category: "connection", text: "We laugh and have fun together regularly." },
  { id: "n9", category: "connection", text: "We have grown apart over time.", reverse: true },
  { id: "n10", category: "connection", text: "I feel like we are a team." },

  // ── Intimacy ────────────────────────────────────────────
  { id: "i1", category: "intimacy", text: "I am satisfied with the physical affection in our relationship." },
  { id: "i2", category: "intimacy", text: "We are comfortable being vulnerable with each other." },
  { id: "i3", category: "intimacy", text: "I feel desired by my partner." },
  { id: "i4", category: "intimacy", text: "Physical closeness between us has faded.", reverse: true },
  { id: "i5", category: "intimacy", text: "We make time for romance and tenderness." },
  { id: "i6", category: "intimacy", text: "I feel comfortable initiating intimacy with my partner." },
  { id: "i7", category: "intimacy", text: "We talk openly about our intimate needs." },
  { id: "i8", category: "intimacy", text: "I feel emotionally safe being close to my partner." },
  { id: "i9", category: "intimacy", text: "I avoid physical closeness with my partner.", reverse: true },
  { id: "i10", category: "intimacy", text: "Our intimate life makes me feel connected, not pressured." },
];

export const QUESTIONS_BY_CATEGORY: Record<Category, Question[]> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.key] = QUESTIONS.filter((q) => q.category === c.key);
    return acc;
  },
  {} as Record<Category, Question[]>,
);

export const TOTAL_QUESTIONS = QUESTIONS.length;
