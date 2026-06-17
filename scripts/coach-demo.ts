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
  const { coachRespond } = await import("../src/lib/ai");

  // "Emotionally distanced" profile: trust ok, warmth gone.
  const answers: Record<string, number> = {};
  for (const q of QUESTIONS) answers[q.id] = q.reverse ? 2 : 4;
  Object.assign(answers, { n1: 2, n2: 2, n4: 4, n6: 4, n8: 2, i1: 2, i3: 2, i4: 4, i5: 2 });

  const intel = runIntelligence(answers);
  const { input } = engineCoachContext(intel);
  console.log("── ENGINE INPUT FED TO COACH ──\n" + input + "\n");

  for (const q of ["My wife doesn't talk to me anymore.", "Write me a Python script to scrape Google."]) {
    const out = await coachRespond([{ role: "user", content: q }], input);
    console.log(`\n── USER: ${q}`);
    for (const c of out.cards) console.log(`  [${c.type}] ${c.title} — ${c.body}`);
    if (out.question) console.log(`  Q: ${out.question}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
