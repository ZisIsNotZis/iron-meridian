import assert from "node:assert/strict";
import { createSimulation, createSupportSimulation } from "../../src/sim/index.ts";
import { stepScriptedAI } from "../../src/sim/ai.ts";
import { digest } from "../../src/sim/digest.ts";
import type { Command, CommandKind, Point } from "../../src/sim/types.ts";

type Sim = ReturnType<typeof createSimulation>;

function send(sim: Sim, sequence: number, kind: CommandKind, subjectIds: number[], extra: { point?: Point; targetId?: number; recipeId?: string } = {}) {
  const command: Command = { playerId: 1, sequence, applyAtTick: sim.state.tick + 1, kind, subjectIds, ...extra };
  return sim.submit(command);
}

function find(sim: Sim, ownerId: 1 | 2, kind: string) {
  return sim.state.entities.find(entity => entity.ownerId === ownerId && entity.kind === kind && entity.alive)!;
}

function run(): void {
  // Canonical scenario/setup.
  const initial = createSimulation();
  assert.equal(initial.state.scenarioId, "scenario.v1-meridian-crossing");
  assert.equal(initial.state.seed, 0x56315f4d45524944n);
  assert.equal(initial.state.entities.length, 18);
  assert.deepEqual(initial.state.resources[1], { banked: 1500, reserved: 0 });
  assert.deepEqual(initial.state.resources[2], { banked: 1500, reserved: 0 });
  assert.equal(initial.state.nodes.length, 3);
  assert.equal(initial.state.objective.ownerId, null);

  // Accepted movement advances; stale/rejected commands do not mutate state.
  const scout = find(initial, 1, "scout");
  const infantry = find(initial, 1, "infantry");
  const tank = find(initial, 1, "tank");
  const assembly = find(initial, 1, "assembly");
  assert.equal(scout.hpmax, 260);
  const scoutView = initial.view(1).entities.find(entity => entity.id === scout.id)!;
  assert.equal(scoutView.hpmax, 260);
  assert.equal("maxHp" in scoutView, false);
  const beforeReject = { x: scout.x, y: scout.y, banked: initial.state.resources[1].banked };
  assert.equal(send(initial, 0, "move", [scout.id], { point: { x: 20, y: 16 } }).accepted, true);
  assert.equal(send(initial, 0, "move", [scout.id], { point: { x: 20, y: 16 } }).accepted, false);
  assert.equal(initial.state.commandResults[1].at(-1)?.reason, "stale");
  assert.deepEqual({ x: scout.x, y: scout.y, banked: initial.state.resources[1].banked }, beforeReject);
  assert.equal(send(initial, 2, "produce", [assembly.id], { recipeId: "recipe.v1.line-rifle" }).accepted, false);
  assert.equal(initial.state.commandResults[1].at(-1)?.reason, "unavailable");
  initial.step(30);
  assert.ok(scout.x > 13.5);

  // Producer categories: vehicles belong to Assembly, infantry to Infantry Center.
  const production = createSimulation();
  const vehicleAssembly = find(production, 1, "assembly");
  assert.equal(send(production, 0, "produce", [vehicleAssembly.id], { recipeId: "recipe.v1.lynx-scout-car" }).accepted, true);
  production.step(1);
  assert.equal(production.state.resources[1].banked, 1200);
  assert.equal(production.state.resources[1].reserved, 300);
  production.step(88);
  assert.equal(production.state.entities.filter(e => e.ownerId === 1 && e.kind === "scout" && e.alive).length, 1);
  production.step(1);
  assert.equal(production.state.entities.filter(e => e.ownerId === 1 && e.kind === "scout" && e.alive).length, 2);
  assert.equal(production.state.resources[1].reserved, 0);

  // Economy: finite extraction, cargo, and unloading all occur in simulation.
  const economy = createSimulation();
  const harvester = find(economy, 1, "harvester");
  assert.equal(send(economy, 0, "harvest", [harvester.id], { targetId: 1 }).accepted, true);
  economy.step(500);
  assert.ok(economy.state.resources[1].banked > 1500);
  assert.ok(economy.state.nodes[0].reserve < 24000);
  assert.ok(harvester.cargo >= 0 && harvester.cargo <= harvester.cargocapacity);

  // Construction at a legal snapped point, followed by infantry production.
  const construction = createSimulation();
  const mcv = find(construction, 1, "mcv");
  assert.equal(send(construction, 0, "construct", [mcv.id], { recipeId: "recipe.v1.infantry-center", point: { x: 12, y: 24 } }).accepted, true);
  construction.step(1);
  assert.equal(construction.state.resources[1].banked, 1100);
  construction.step(300);
  const center = find(construction, 1, "infantry-center");
  assert.deepEqual({ x: center.x, y: center.y }, { x: 12, y: 24 });
  assert.equal(construction.state.resources[1].reserved, 0);
  assert.equal(send(construction, 1, "produce", [center.id], { recipeId: "recipe.v1.line-rifle" }).accepted, true);
  assert.equal(send(construction, 2, "produce", [find(construction, 1, "assembly").id], { recipeId: "recipe.v1.line-rifle" }).accepted, false);
  construction.step(45);
  assert.equal(construction.state.entities.filter(e => e.ownerId === 1 && e.kind === "infantry" && e.alive).length, 2);

  // Visible attack damages and destroys a target.
  const combat = createSimulation();
  const attacker = find(combat, 1, "infantry");
  const victim = find(combat, 2, "scout");
  victim.x = attacker.x;
  victim.y = attacker.y;
  victim.hp = 1;
  combat.view(1);
  assert.equal(send(combat, 0, "attack", [attacker.id], { targetId: victim.id }).accepted, true);
  combat.step(1);
  assert.equal(victim.alive, false);
  assert.ok(combat.state.events.some(event => event.kind === "damage" && event.entityIds.includes(victim.id)));

  // Fog: current visibility, discovered terrain, and stale last-seen contact.
  const fog = createSimulation();
  const hidden = find(fog, 2, "scout");
  hidden.x = 19;
  hidden.y = 19;
  assert.ok(fog.view(1).entities.some(entity => entity.id === hidden.id));
  hidden.x = 45;
  hidden.y = 19;
  const filtered = fog.view(1);
  assert.ok(!filtered.entities.some(entity => entity.id === hidden.id));
  assert.ok(filtered.contacts.some(contact => contact.id === hidden.id && contact.stale && contact.lastSeenTick === 0));
  assert.ok(filtered.terrain.discoveredCells.length > 0);
  const fogReject = createSimulation();
  const farEnemy = find(fogReject, 2, "scout");
  assert.equal(send(fogReject, 0, "attack", [find(fogReject, 1, "infantry").id], { targetId: farEnemy.id }).accepted, false);
  assert.equal(fogReject.state.commandResults[1][0].reason, "not-visible");

  // Objective capture and cumulative hold victory.
  const objective = createSimulation();
  const objectiveForce = [find(objective, 1, "scout"), find(objective, 1, "infantry"), find(objective, 1, "tank")];
  assert.equal(send(objective, 0, "capture", objectiveForce.map(entity => entity.id), { targetId: 1 }).accepted, true);
  objective.step(2800);
  assert.equal(objective.state.objective.ownerId, 1);
  assert.equal(objective.state.objective.progress, 100);
  assert.ok(objective.state.objective.holdTicks[1] >= 2250);
  assert.equal(objective.state.phase, "victory");
  assert.equal(objective.state.result.reason, "objective-held");

  // HQ destruction is the alternate victory path.
  const hqVictory = createSimulation();
  const hqAttacker = find(hqVictory, 1, "tank");
  const enemyHq = find(hqVictory, 2, "hq");
  enemyHq.x = hqAttacker.x;
  enemyHq.y = hqAttacker.y;
  enemyHq.hp = 1;
  hqVictory.view(1);
  assert.equal(send(hqVictory, 0, "attack", [hqAttacker.id], { targetId: enemyHq.id }).accepted, true);
  hqVictory.step(1);
  assert.equal(hqVictory.state.phase, "victory");
  assert.equal(hqVictory.state.result.winnerId, 1);
  assert.equal(hqVictory.state.result.reason, "hq-destroyed");

  // Opt-in support fixture: air and naval movement/attack domains stay explicit.
  const support = createSupportSimulation();
  const air = find(support, 1, "air-support");
  const ship = find(support, 1, "naval-support");
  const enemyAir = find(support, 2, "air-support");
  const enemyShip = find(support, 2, "naval-support");
  air.x = ship.x = enemyAir.x = enemyShip.x = 20;
  air.y = ship.y = enemyAir.y = enemyShip.y = 35;
  support.view(1);
  assert.equal(send(support, 0, "move", [ship.id], { point: { x: 20, y: 20 } }).accepted, false);
  assert.equal(support.state.commandResults[1][0].reason, "blocked");
  assert.equal(send(support, 1, "attack", [find(support, 1, "infantry").id], { targetId: enemyAir.id }).accepted, false);
  assert.equal(support.state.commandResults[1][1].reason, "invalid-target");
  assert.equal(send(support, 2, "attack", [air.id], { targetId: enemyShip.id }).accepted, false);
  assert.equal(support.state.commandResults[1][2].reason, "invalid-target");
  assert.equal(send(support, 3, "attack", [ship.id], { targetId: enemyAir.id }).accepted, true);
  const enemyGround = find(support, 2, "infantry");
  air.x = air.y = enemyGround.x = enemyGround.y = 20;
  assert.equal(send(support, 4, "attack", [air.id], { targetId: enemyGround.id }).accepted, true);
  assert.equal(send(support, 5, "capture", [air.id], { targetId: 1 }).accepted, false);
  support.step(1);
  assert.ok(enemyAir.hp < enemyAir.hpmax);
  assert.ok(enemyGround.hp < enemyGround.hpmax);
  assert.equal(send(support, 6, "move", [air.id], { point: { x: 20, y: 20 } }).accepted, true);
  support.step(1);
  assert.ok(air.y < 35);

  // Scripted AI emits legal deterministic commands for its own slot.
  const ai = createSimulation();
  const aiResults = stepScriptedAI(ai);
  assert.equal(aiResults.length, 2);
  assert.ok(aiResults.every(result => result.accepted));
  ai.step(1);
  assert.equal(find(ai, 2, "scout").state, "moving");
  assert.equal(find(ai, 2, "harvester").state, "moving");

  // Same seed and command log reproduce the same digest.
  const a = createSimulation();
  const b = createSimulation();
  const aHarvester = find(a, 1, "harvester");
  const bHarvester = find(b, 1, "harvester");
  assert.equal(a.submit({ playerId: 1, sequence: 0, applyAtTick: 1, kind: "harvest", subjectIds: [aHarvester.id], targetId: 1 }).accepted, true);
  assert.equal(b.submit({ playerId: 1, sequence: 0, applyAtTick: 1, kind: "harvest", subjectIds: [bHarvester.id], targetId: 1 }).accepted, true);
  a.step(500);
  b.step(500);
  assert.equal(digest(a.state), digest(b.state));
  console.log("simulation self-check passed", digest(a.state));
}

run();
