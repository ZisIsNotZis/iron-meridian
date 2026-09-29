import { chromium } from "playwright-core";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("console", (msg) => console.log("[page]", msg.type(), msg.text()));
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForSelector("canvas", { timeout: 15000 });
await page.waitForTimeout(600);
await page.screenshot({ path: ".scratch/start.png" });
console.log("captured start");

// START MISSION button game coords: container at (116,548), rect 248x54 -> center ~(240,575)
await page.mouse.click(240, 575);
await page.waitForTimeout(700);
await page.screenshot({ path: ".scratch/running.png" });
console.log("captured running");

await browser.close();
console.log("done");
