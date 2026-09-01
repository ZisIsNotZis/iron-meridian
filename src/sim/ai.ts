import type { Command, CommandResult, EntityKind, EntityView, PlayerId } from "./types.ts";
import type { Simulation } from "./simulation.ts";

// ---------------------------------------------------------------------------
// East scripted finite-state opponent (player 2) for the V1 Meridian Crossing
// skirmish.
//
// The AI is a deterministic script: every decision is a pure function of the
// observed game view (sim.view(2)) plus per-simulation memory. No randomness,
// no wall clock, no hidden engine state. The same seed plus the same AI
// stepping schedule therefore reproduce the same command log and the same
// state digest.
//
// Match plan (simple FSM):
//   economy -> keep the home node harvested; replace lost harvesters/MCVs
//   base    -> deploy the MCV into an Infantry Center at a legal spot
//   army    -> early Lynx scout cars, then Valiant MBTs; Line Rifle and
//              Javelin teams from the Infantry Center
//   war     -> push all ground combat units at the objective; engage any
//              visible enemy in range; stop and resume the push after kills
// ---------------------------------------------------------------------------

const EAST: PlayerId = 2;
const HOME_NODE_ID = 2;                    // east home resource node id
const OBJECTIVE_TARGET_ID = 1;             // capture target: the objective
const RALLY = { x: 40, y: 20 };            // staging cell short of the objective
const ENGAGE_RANGE = 10;                   // cells: attack enemies this close
const CONSTRUCT_POINT = { x: 50, y: 23 };  // legal snapped cell near the east base
const GROUND_COMBAT: EntityKind[] = ["scout", "infantry", "tank", "anti-tank"];
const CYCLE = 30;                          // command re-affirmation period (ticks)

type Memory = {
  sequence: number;
  lastHarvestTick: number;
  lastConstructTick: number;
  lastCommand: Record<number, { kind: Command["kind"]; tick: number; targetId?: number }>;
};

const memories = new WeakMap<Simulation, Memory>();

function memoryFor(sim: Simulation): Memory {
  let memory = memories.get(sim);
  if (!memory) {
    memory = { sequence: sim.state.lastSequence[EAST] + 1, lastHarvestTick: -999, lastConstructTick: -999, lastCommand: {} };
    memories.set(sim, memory);
  }
  return memory;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearestEnemy(unit: EntityView, enemies: EntityView[]): EntityView | undefined {
  let best: EntityView | undefined;
  let bestDistance = ENGAGE_RANGE;
  for (const enemy of enemies) {
    const d = distance(unit, enemy);
    if (d <= bestDistance) { bestDistance = d; best = enemy; }
  }
  return best;
}

export function scriptedOpponent(sim: Simulation): Command[] {
  const playerId = EAST;
  const view = sim.view(playerId);
  const memory = memoryFor(sim);
  const commands: Command[] = [];
  if (view.phase !== "running") return commands;

  const next = (kind: Command["kind"], subjectIds: number[], point?: { x: number; y: number }, targetId?: number, recipeId?: string): Command =>
    ({ playerId, sequence: memory.sequence++, applyAtTick: sim.state.tick + 1, kind, subjectIds, point, targetId, recipeId });

  const own = view.entities.filter(e => e.ownerId === playerId);
  const ofKind = (kind: EntityKind) => own.filter(e => e.kind === kind);
  const first = (kind: EntityKind) => ofKind(kind)[0];
  const banked = view.resources.banked;
  const harvester = first("harvester");
  const mcv = first("mcv");
  const assembly = first("assembly");
  const center = first("infantry-center");
  const queueOf = (producerId: number) => view.production.find(p => p.producerId === producerId)?.queue ?? [];
  // Resources already committed by earlier commands in this same call; keeps
  // every accepted produce/construct affordable at apply time (banked >= 0).
  let spend = 0;
  const canAfford = (cost: number) => banked - spend >= cost;

  // --- Economy: keep the home node harvested whenever the harvester is free.
  if (harvester && harvester.state === "idle" && sim.state.tick - memory.lastHarvestTick >= 2) {
    commands.push(next("harvest", [harvester.id], undefined, HOME_NODE_ID));
    memory.lastHarvestTick = sim.state.tick;
  }

  // --- Base: deploy the MCV into one Infantry Center near the east base.
  const centers = ofKind("infantry-center").length + (view.construction.length > 0 ? 1 : 0);
  if (mcv && centers === 0 && sim.state.tick - memory.lastConstructTick >= 2 && canAfford(400)) {
    commands.push(next("construct", [mcv.id], CONSTRUCT_POINT, undefined, "recipe.v1.infantry-center"));
    memory.lastConstructTick = sim.state.tick;
    spend += 400;
  }

  // --- Army: vehicles from the Vehicle Assembly (scouts first, then MBTs,
  //     replacement harvester/MCV when one was lost and is affordable).
  if (assembly) {
    const queue = queueOf(assembly.id);
    const queued = (kind: EntityKind) => queue.filter(item => item.product === kind).length;
    const wanted = (kind: EntityKind) => ofKind(kind).length + queued(kind);
    if (queue.length < 8) {
      if (ofKind("harvester").length === 0 && canAfford(700) && queued("harvester") === 0) {
        commands.push(next("produce", [assembly.id], undefined, undefined, "recipe.v1.harvester"));
        spend += 700;
      } else if (ofKind("mcv").length === 0 && canAfford(1200) && queued("mcv") === 0) {
        commands.push(next("produce", [assembly.id], undefined, undefined, "recipe.v1.mcv"));
        spend += 1200;
      }
      if (wanted("scout") < 2 && canAfford(300)) {
        commands.push(next("produce", [assembly.id], undefined, undefined, "recipe.v1.lynx-scout-car"));
        spend += 300;
      }
      if (wanted("tank") < 5 && canAfford(750)) {
        commands.push(next("produce", [assembly.id], undefined, undefined, "recipe.v1.valiant-mbt"));
        spend += 750;
      }
    }
  }

  // --- Infantry: Line Rifle squads and Javelin teams from the Infantry Center.
  if (center) {
    const queue = queueOf(center.id);
    const queued = (kind: EntityKind) => queue.filter(item => item.product === kind).length;
    if (queue.length < 8) {
      if (ofKind("infantry").length + queued("infantry") < 4 && canAfford(100)) {
        commands.push(next("produce", [center.id], undefined, undefined, "recipe.v1.line-rifle"));
        spend += 100;
      }
      if (ofKind("anti-tank").length + queued("anti-tank") < 3 && canAfford(240)) {
        commands.push(next("produce", [center.id], undefined, undefined, "recipe.v1.javelin-team"));
        spend += 240;
      }
    }
  }

  // --- War: engage visible enemies, otherwise push the objective.
  const enemies = view.entities.filter(e => e.ownerId !== playerId);
  const enemyIds = new Set(enemies.map(e => e.id));
  const combatants = own.filter(e => GROUND_COMBAT.includes(e.kind));

  // Units whose attack target vanished (killed or lost to fog) resume the push.
  for (const unit of combatants) {
    const last = memory.lastCommand[unit.id];
    if (last?.kind === "attack" && last.targetId !== undefined && !enemyIds.has(last.targetId) && sim.state.tick - last.tick >= 10) {
      commands.push(next("stop", [unit.id]));
      memory.lastCommand[unit.id] = { kind: "stop", tick: sim.state.tick };
    }
  }

  for (const unit of combatants) {
    const last = memory.lastCommand[unit.id];
    if (last && sim.state.tick - last.tick < 2) continue; // let the previous order apply first
    const enemy = nearestEnemy(unit, enemies);
    if (enemy) {
      const stillEngaged = last?.kind === "attack" && last.targetId === enemy.id && sim.state.tick - last.tick < 240;
      if (!stillEngaged) {
        commands.push(next("attack", [unit.id], undefined, enemy.id));
        memory.lastCommand[unit.id] = { kind: "attack", tick: sim.state.tick, targetId: enemy.id };
      }
    } else if (unit.state === "idle" && distance(unit, view.objective) > view.objective.capture_radius_cells + 0.5) {
      // Far units stage at the rally point (move); the scout and committed
      // units make straight for the objective (capture, targetId 1).
      const d = distance(unit, view.objective);
      const wantCapture = d <= 12 || unit.kind === "scout";
      const kind = wantCapture ? "capture" : "move";
      let shouldIssue: boolean;
      if (!last) shouldIssue = true;
      else if (last.kind === "attack") shouldIssue = sim.state.tick - last.tick >= 10;
      else if (last.kind !== "capture" && last.kind !== "move") shouldIssue = true;
      else shouldIssue = sim.state.tick - last.tick >= CYCLE;
      if (shouldIssue) {
        if (kind === "move") {
          commands.push(next("move", [unit.id], RALLY));
          memory.lastCommand[unit.id] = { kind: "move", tick: sim.state.tick };
        } else {
          commands.push(next("capture", [unit.id], undefined, OBJECTIVE_TARGET_ID));
          memory.lastCommand[unit.id] = { kind: "capture", tick: sim.state.tick, targetId: OBJECTIVE_TARGET_ID };
        }
      }
    }
  }

  return commands;
}

export function stepScriptedAI(sim: Simulation): CommandResult[] {
  return scriptedOpponent(sim).map(command => sim.submit(command));
}
