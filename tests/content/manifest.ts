import assert from "node:assert/strict";
import { loadV1Manifest, parseYaml, YamlContentError } from "../../src/content/index.ts";

const manifest = loadV1Manifest();
assert.equal(manifest.scenario.id, "scenarios.v1_meridian_crossing");
assert.equal(manifest.scenario.mapId, "maps.meridian_crossing");
assert.equal(manifest.faction.id, "factions.coalition");
assert.equal(manifest.map.id, "maps.meridian_crossing");
assert.equal(manifest.scenario.seed, 0x56315f4d45524944n);
assert.deepEqual(manifest.map.objective, { point: [32, 20], captureRadiusCells: 4, noBuildRadiusCells: 8 });
assert.deepEqual(manifest.map.resourceNodes, [
  { point: [10, 12], reserve: 24000 },
  { point: [54, 12], reserve: 24000 },
  { point: [32, 30], reserve: 12000 },
]);
assert.equal(manifest.scenario.spawns.length, 9);
assert.deepEqual(manifest.scenario.spawns.map(spawn => spawn.key), ["hq", "processor", "assembly", "mcv", "harvester", "scout", "infantry", "tank", "anti_tank"]);
assert.equal(manifest.scenario.recipeIds.length, 9);
assert.equal(manifest.scenario.objectiveHoldSeconds, 75);

assert.deepEqual(parseYaml("a: [one, {b: 2}]\nitems:\n  - key: value\n    enabled: true\n"), { a: ["one", { b: 2 }], items: [{ key: "value", enabled: true }] });
assert.throws(() => parseYaml("a: 1\na: 2\n", "duplicate.yml"), (error: unknown) => error instanceof YamlContentError && error.message.includes("duplicate key a"));
console.log("content manifest self-check passed");
