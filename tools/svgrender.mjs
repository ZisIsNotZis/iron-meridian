// Rasterize an SVG to PNG via the cached Chromium (Playwright). Used to view
// and iterate on authored assets. Not part of the runtime path.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const [, , svgPath, outPath, widthArg, heightArg] = process.argv;
const width = Number(widthArg || 512);
const height = Number(heightArg || 512);
const svg = fs.readFileSync(path.resolve(svgPath), "utf8");

const html = `<!doctype html><html><head><style>
html,body{margin:0;padding:0;background:transparent;height:100%}
body{display:grid;place-items:center;height:100%}
svg{display:block;width:${width}px;height:${height}px}
</style></head><body>${svg}</body></html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 1,
});
await page.setContent(html, { waitUntil: "networkidle" });
await page.waitForTimeout(120);
await page.screenshot({ path: path.resolve(outPath), omitBackground: true });
await browser.close();
console.log(`rendered ${outPath} (${width}x${height})`);
