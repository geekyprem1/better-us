// Run with:  npx tsx scripts/coach-demo.ts
// Proves the BetterUs Coach™ prompt + engine grounding produces the framework.
import fs from "fs";

async function main() {
  // Load .env.local into process.env before importing the OpenAI client.
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }

  const { QUESTIONS } = await import("../src/lib/questions");
  const { runIntelligence } = await import("../src/lib/engine");
  const { engineCoachContext } = await import("../src/lib/engine/context");
  const { coachSystemPrompt } = await import("../src/lib/ai");
  const { getOpenAI, OPENAI_MODEL } = await import("../src/lib/openai");

  // "Emotionally distanced" profile: trust ok, warmth gone.
  const answers: Record<string, number> = {};
  for (const q of QUESTIONS) answers[q.id] = q.reverse ? 2 : 4;
  Object.assign(answers, { n1: 2, n2: 2, n4: 4, n6: 4, n8: 2, i1: 2, i3: 2, i4: 4, i5: 2 });

  const intel = runIntelligence(answers);
  const { input } = engineCoachContext(intel);
  console.log("── ENGINE INPUT FED TO COACH ──\n" + input + "\n");

  const res = await getOpenAI().chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.7,
    messages: [
      { role: "system", content: coachSystemPrompt(input) },
      { role: "user", content: "My wife doesn't talk to me anymore." },
    ],
  });
  console.log("── COACH RESPONSE ──\n" + res.choices[0].message.content);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
