# Iron Meridian status

Classification: useful, creative, and innovative in prototype form.

Current: `0.1.0` **playable** V1 vertical slice. It is a data-driven, deterministic,
browser-playable RTS with a real art set, an active scripted opponent, and a full
match loop (start → scout → economy → production → construction → combat →
objective → victory/defeat → restart).

## What is implemented

- **Deterministic headless simulation** (`src/sim/`): command boundary, fixed
  30 Hz clock, seeded randomness, movement, economy (harvest/process), production,
  construction, combat with armor classes, fog of war, objective capture/hold,
  HQ-destruction and objective-held victory, and a state digest. Verified by
  `npm run test:sim`.
- **Real scripted AI opponent** (`src/sim/ai.ts`): the east `scripted_finite_state`
  slot harvests, builds an Infantry Center, fields a mixed force (scouts, MBTs,
  Line Rifle, Javelin teams), pushes the objective, and engages. Deterministic:
  same seed + command log reproduce the same result.
- **Real asset pack** (`public/assets/`, 20 SVGs): top-down 2.5D Coalition
  silhouettes for all six units and four V1 buildings, terrain tiles, objective
  beacon and resource node, plus FX (tracer, impact, smoke, capture, reveal,
  construction) and UI icons. Authored to the Coalition palette and the
  presentation contracts.
- **Playable front end** (`src/app/GameScene.ts`): Phaser renderer driven only by
  the simulation observation — sprites with facing, health bars, selection,
  order markers, minimap, command deck, production recipe panel, control groups
  (Ctrl+1..5 / 1..5), keyboard (Space pause, Esc clear), skippable onboarding,
  reduced-motion option, and victory/defeat/restart flow.
- **Verification harness**: `tools/check_content.mjs` (284 YAML records validated
  against schema families), `tools/audit_design.py` (Markdown link/reference
  audit), `npm run test:bench` (100-entity deterministic smoke; avg ~1.4 ms/tick
  against the 8 ms V1 budget), and `tools/svgrender.mjs` (Playwright rasterizer
  for authoring/verifying SVG assets).

## Validation evidence (this pass)

```text
npm run test:sim     -> simulation self-check passed b391e24d
npm run test:content -> content manifest self-check passed
npm run test:bench   -> PASS benchmark: 3000 ticks, 100 entities, avg ~1.4ms max ~6ms, digest 1da5cf5b
node tools/check_content.mjs -> checked 284 YAML content file(s)
python3 tools/audit_design.py -> Audited 1 Markdown files, No violations found
npm run build        -> Vite build succeeds
```

The in-browser game was driven through a full UI interaction sequence (select,
move, produce, construct, contest) in headless Chromium; screenshots are in
[`docs/media/`](media/). The AI captured and held the relay and the match ended
in a readable defeat screen.

## Version and naming

Version `0.1.0` is declared in `package.json`. Product name: **Iron Meridian**.
Preferred GitHub slug: `iron-meridian`; local folder `ra2` is preserved. Tags
use `vMAJOR.MINOR.PATCH`.

## Boundaries

V1 scope (`design/content/docs/global/v1.yml`) is a single-map Coalition-mirror
skirmish. Directorate and Irregular Network factions, campaign, aircraft, naval,
transport, multiplayer, MCP agents, saves/replays, and distributed modding remain
explicitly deferred to their owning contracts.

## Media and research

Reviewed screenshots were captured and saved under [`docs/media/`](media/). No
video or paper artifacts were created in this pass.
