import { createSimulation } from "../src/sim/index.ts";
import { stepScriptedAI } from "../src/sim/ai.ts";

const sim = createSimulation(0x56315f4d45524944n);
let prevTotal = 0;
for (let t = 0; t < 4000 && sim.state.phase === "running"; t++) {
  stepScriptedAI(sim);
  sim.step(1);
  if (t % 600 === 0 || sim.state.phase !== "running") {
    const west = sim.state.entities.filter(e => e.alive && e.ownerId === 1).length;
    const east = sim.state.entities.filter(e => e.alive && e.ownerId === 2).length;
    const ekind = sim.state.entities.filter(e => e.alive && e.ownerId === 2).map(e => e.kind);
    const bank = sim.state.resources[2].banked;
    const obj = sim.state.objective;
    const westHq = sim.state.entities.some(e => e.alive && e.ownerId === 1 && e.kind === "hq");
    console.log(`T${sim.state.tick}  west=${west} east(${east})=[${ekind.join(",")}]  eastBank=${bank}  obj=${obj.ownerId ?? "-"} ${obj.progress}%  westHq=${westHq}  phase=${sim.state.phase}`);
  }
}
console.log("RESULT", sim.state.result);
