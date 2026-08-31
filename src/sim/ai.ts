import type { Command, CommandResult, PlayerId } from "./types.ts";
import type { Simulation } from "./simulation.ts";

export function scriptedOpponent(sim: Simulation): Command[] {
  const p: PlayerId = 2;
  const commands: Command[] = [];
  const next = (kind: Command["kind"], subjectIds: number[], point?: { x: number; y: number }, targetId?: number): Command => ({ playerId: p, sequence: sim.state.lastSequence[p] + commands.length + 1, applyAtTick: sim.state.tick + 1, kind, subjectIds, point, targetId });
  const observed = sim.view(p);
  const scout = observed.entities.find(e => e.ownerId === p && e.kind === "scout");
  if (scout && sim.state.tick % 75 === 0 && sim.state.entities.find(e => e.id === scout.id)?.order?.x !== 32) commands.push(next("move", [scout.id], { x: 32, y: 20 }));
  const harvester = observed.entities.find(e => e.ownerId === p && e.kind === "harvester");
  if (harvester && !sim.state.entities.find(e => e.id === harvester.id)?.order && sim.state.tick % 75 === 0) commands.push(next("harvest", [harvester.id], undefined, 2));
  return commands;
}

export function stepScriptedAI(sim: Simulation): CommandResult[] { return scriptedOpponent(sim).map(command => sim.submit(command)); }
