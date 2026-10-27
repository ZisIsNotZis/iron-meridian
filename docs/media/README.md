# Iron Meridian — media

Brand mark and reviewed screenshots from the playable V1 slice. The screenshots
were captured in headless Chromium at 1280×720 and are visual verification
artifacts of the real asset pack and the live match loop.

- `logo.svg` — the Iron Meridian emblem: a pale meridian crossing a shorter
  horizontal bar, with an amber signal at the intersection.

- `battlefield.png` — battle view at start: Coalition base, units with health
  bars, objective relay, resource nodes, and minimap.
- `selection.png` — a scout selected in the command deck.
- `orders.png` — a MOVE order issued to the central relay (order line + marker).
- `production.png` — the Vehicle Assembly production recipe panel (SCOUT / MBT /
  HARV / MCV with costs).
- `construction.png` — MCV ordered to construct an Infantry Center.
- `battle-late.png` — mid-match as the scripted AI pushes and contests the relay.
- `result-screen.png` — the result screen (defeat by objective-held).

Screenshots are captured from a served `npm run build` output with a headless
Chromium script using `playwright-core`; the capture script is local tooling and
is not part of the repository.
