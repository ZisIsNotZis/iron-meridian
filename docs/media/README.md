# Iron Meridian — media

Reviewed screenshots from the playable V1 slice, captured in headless Chromium
at 1280×720. All are visual verification artifacts of the real asset pack and
the live match loop.

- `battlefield.png` — battle view at start: Coalition base, units with health
  bars, objective relay, resource nodes, and minimap.
- `selection.png` — a scout selected in the command deck.
- `orders.png` — a MOVE order issued to the central relay (order line + marker).
- `production.png` — the Vehicle Assembly production recipe panel (SCOUT / MBT /
  HARV / MCV with costs).
- `construction.png` — MCV ordered to construct an Infantry Center.
- `battle-late.png` — mid-match as the scripted AI pushes and contests the relay.
- `result-screen.png` — the result screen (defeat by objective-held).

Regenerate with `node .scratch/visual.mjs` against a served `npm run build`
output (requires `playwright-core`).
