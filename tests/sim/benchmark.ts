import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { createSimulation } from "../../src/sim/index.ts";
import { digest } from "../../src/sim/digest.ts";
import type { Command, EntityKind, PlayerId } from "../../src/sim/types.ts";

// ---------------------------------------------------------------------------
// 100-entity deterministic performance smoke.
//
// Builds a >= 100 entity fixture from the canonical V1 scenario, issues a small
// deterministic command set, then times 3000 ticks against the V1 per-tick
// budget (simulation_update_ms_max_per_tick = 8.0 ms) and verifies basic state
// invariants. Everything here is deterministic: same seed, same command log,
// same digest.
// ---------------------------------------------------------------------------

const KIND_CYCLE: EntityKind[] = ["scout", "infantry", "tank", "anti-tank", "harvester", "mcv"];
const TOTAL_TICKS = 3000;
const MAX_TICK_MS = 8.0; // V1 simulation_update_ms_max_per_tick budget

const sim = createSimulation();
assert.equal(sim.state.entities.length, 18, "canonical fixture starts with 18 entities");

// Spread ~50 entities per player across the map (x 2..62, y 3..37): 82 extra
// spawns (41 per side) brings the fixture to exactly 100 entities.
for (let i = 0; i < 82; i++) {
  const owner: PlayerId = i % 2 === 0 ? 1 : 2;
  const kind = KIND_CYCLE[i % KIND_CYCLE.length];
  sim.spawn(owner, kind, { x: 2 + ((i * 7) % 61), y: 3 + ((i * 11) % 35) });
}
const entityCount = sim.state.entities.length;
assert.ok(entityCount >= 100, `expected >= 100 entities, got ${entityCount}`);
assert.ok(sim.state.entities.filter(e => e.ownerId === 1).length >= 50, "west player has ~50 entities");
assert.ok(sim.state.entities.filter(e => e.ownerId === 2).length >= 50, "east player has ~50 entities");

// Small deterministic command set: produce a scout from each Vehicle Assembly,
// send the combat forces toward the objective, and start both harvesters.
const submit = (playerId: PlayerId, kind: Command["kind"], subjectIds: number[], extra: Partial<Command> = {}) => {
  const sequence = playerId === 1 ? seq1++ : seq2++;
  const result = sim.submit({ playerId, sequence, applyAtTick: sim.state.tick + 1, kind, subjectIds, ...extra });
  assert.ok(result.accepted, `benchmark command rejected: ${result.reason}`);
};
let seq1 = 0;
let seq2 = 0;
for (const e of sim.state.entities) {
  if (e.kind === "assembly" && e.alive) submit(e.ownerId, "produce", [e.id], { recipeId: "recipe.v1.lynx-scout-car" });
}
for (const e of sim.state.entities) {
  if (e.kind === "harvester" && e.alive) submit(e.ownerId, "harvest", [e.id], { targetId: e.ownerId === 1 ? 1 : 2 });
}
for (const e of sim.state.entities) {
  if (e.alive && (e.kind === "scout" || e.kind === "infantry" || e.kind === "tank" || e.kind === "anti-tank")) {
    submit(e.ownerId, "move", [e.id], { point: { x: 32, y: 20 } });
  }
}

// Timed run: 3000 ticks, measuring each tick.
let totalMs = 0;
let maxMs = 0;
for (let tick = 0; tick < TOTAL_TICKS; tick++) {
  const start = performance.now();
  sim.step(1);
  const elapsed = performance.now() - start;
  totalMs += elapsed;
  if (elapsed > maxMs) maxMs = elapsed;
}
const avgMs = totalMs / TOTAL_TICKS;

// Invariants after the run.
for (const e of sim.state.entities) {
  assert.ok(e.hp >= 0, `negative hp on entity ${e.id}`);
  if (e.alive) assert.ok(e.x >= 0 && e.x <= 64 && e.y >= 0 && e.y <= 40, `entity ${e.id} out of bounds: (${e.x}, ${e.y})`);
}
for (const p of [1, 2] as PlayerId[]) {
  assert.ok(sim.state.resources[p].banked >= 0, `player ${p} has negative banked resources`);
  assert.ok(sim.state.resources[p].reserved >= 0, `player ${p} has negative reserved resources`);
}
assert.ok(avgMs < MAX_TICK_MS, `average tick ${avgMs.toFixed(3)}ms exceeds the ${MAX_TICK_MS}ms budget`);

console.log(
  `PASS benchmark: ${TOTAL_TICKS} ticks, ${entityCount} entities, avg ${avgMs.toFixed(3)}ms max ${maxMs.toFixed(3)}ms, digest ${digest(sim.state)}`
);
