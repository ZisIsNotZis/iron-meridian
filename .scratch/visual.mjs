import { chromium } from "playwright-core";

const OUT = ".scratch/shot";
import fs from "node:fs";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("[console.error]", m.text()); });

const shot = async (name) => { await page.waitForTimeout(250); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("shot", name); };
const click = (x, y) => page.mouse.click(x, y);

async function waitTicks(ticks) { await page.waitForTimeout(ticks / 30 * 1000); } // approx

await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
await page.waitForSelector("canvas", { timeout: 15000 });
await shot("01_start");

// START MISSION (button center ~240,569)
await click(240, 569);
await shot("02_running");

// Select the west scout at map (13.5,18.5) -> screen (192.75,333.25)
await click(193, 333);
await shot("03_selected_scout");

// MOVE order, then click destination map (32,20) objective -> screen (424,352)
await click(959, 341);
await click(424, 352);
await shot("04_move_order");

// Select assembly at map (8,21) -> screen (124,365). This shows the production recipe panel.
await click(124, 365);
await shot("05_production_panel");
await click(959, 457);
await shot("05_produce");

// Select MCV at map (11.5,22.5) -> screen (167.75,383.25), CONSTRUCT, then click point map (11,26) -> (161.5,427)
await click(168, 383);
await click(1149, 457);
await click(162, 427);
await shot("06_construct");

// Let the sim run so the east AI develops and pushes -> combat
await waitTicks(600);
await shot("07_battle");

// More time: east force reaches the objective and engages
await waitTicks(900);
await shot("08_late");

// Run to a likely conclusion
await waitTicks(1500);
await shot("09_end");

await browser.close();
console.log("done");
