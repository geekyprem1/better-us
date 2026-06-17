// Run with:  npx tsx scripts/engine-demo.ts
// Proves the engine is deterministic and prints example inputs → outputs.

import { QUESTIONS } from "../src/lib/questions";
import { Answers, computeScores } from "../src/lib/scoring";
import { runIntelligence, runCoupleSync, runDrift } from "../src/lib/engine";

// Build a synthetic answer set. `tone` in [1..5] is the "health intent":
// reverse questions get inverted so the *health* is consistent.
function profile(tone: number, overrides: Record<string, number> = {}): Answers {
  const a: Answers = {};
  for (const q of QUESTIONS) {
    a[q.id] = q.reverse ? 6 - tone : tone;
  }
  return { ...a, ...overrides };
}

function show(name: string, answers: Answers) {
  const intel = runIntelligence(answers);
  console.log("\n" + "═".repeat(60));
  console.log(name);
  console.log("═".repeat(60));
  console.log("Health:", intel.health.overall, `(${intel.health.bandLabel})`, {
    trust: intel.health.trust,
    comm: intel.health.communication,
    conn: intel.health.connection,
    int: intel.health.intimacy,
  });
  console.log("Trust Risk:", intel.trustRisk.index, intel.trustRisk.level);
  console.log("  drivers:", intel.trustRisk.drivers);
  console.log("Communication:", intel.communication.index, intel.communication.level, "→", intel.communication.type);
  console.log("  primary failure:", intel.communication.primaryFailure, "| repair:", intel.communication.repairCapacity);
  console.log("Stage:", intel.stage.stage, "—", intel.stage.rationale);
  console.log("Recovery:", intel.recovery.score, intel.recovery.band, intel.recovery.components);
  console.log("DNA:", {
    attachment: intel.dna.attachmentStyle,
    conflict: intel.dna.conflictStyle,
    comm: intel.dna.communicationStyle,
    connection: intel.dna.connectionStyle,
    loveLanguages: intel.dna.loveLanguageIndicators,
  });
}

// ── Example profiles ──────────────────────────────────────────
const thriving = profile(5);
const healthy = profile(4);
const struggling = profile(2, { t10: 5, c5: 5, c9: 5, n9: 5 }); // strong red flags
const distanced = profile(4, {
  // trust ok, but connection & intimacy collapsed
  n1: 2, n2: 2, n4: 4, n6: 4, n8: 2, n9: 4, i1: 2, i3: 2, i4: 4, i5: 2, i9: 4,
});

show("PROFILE A — Thriving (all 5s)", thriving);
show("PROFILE B — Healthy (all 4s)", healthy);
show("PROFILE C — Struggling + red flags", struggling);
show("PROFILE D — Emotionally distanced (trust ok, warmth gone)", distanced);

// ── Determinism check ─────────────────────────────────────────
const a1 = JSON.stringify(runIntelligence(struggling));
const a2 = JSON.stringify(runIntelligence(struggling));
console.log("\nDETERMINISTIC:", a1 === a2 ? "✓ identical on re-run" : "✗ NON-DETERMINISTIC");

// ── Engine 7: Couple Sync ─────────────────────────────────────
console.log("\n" + "═".repeat(60) + "\nENGINE 7 — Couple Sync\n" + "═".repeat(60));
const partnerA = computeScores(profile(4));
const partnerB = computeScores(struggling);
console.log(runCoupleSync(partnerA, partnerB));

// ── Engine 8: Emotional Drift ─────────────────────────────────
console.log("\n" + "═".repeat(60) + "\nENGINE 8 — Emotional Drift\n" + "═".repeat(60));
console.log(
  runDrift([
    { trust: 40, communication: 45, connection: 50, intimacy: 48, overall: 46 },
    { trust: 48, communication: 52, connection: 55, intimacy: 53, overall: 52 },
    { trust: 58, communication: 60, connection: 62, intimacy: 60, overall: 60 },
  ]),
);
