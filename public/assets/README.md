# Asset Pack Contract

Every named asset is authored as SVG in this directory, with an exact filename
below. The runtime loads these via Phaser's SVG loader; each is a square canvas
(96×96 viewBox). Unit sprites face **up / north** (the game rotates them to the
movement heading). Buildings and terrain are axis-aligned (never rotated).

## Palette (Coalition) — the only colors allowed

- slate blue body: `#24314d` (dark), `#34456b` (mid), `#4a5f8a` (light)
- pale field gray: `#aeb6c2`, `#c8cede` (highlight), `#7d90bb` (glacis)
- signal cyan accent: `#56d8b0` (edge/sensor), `#bff4e0` (glow)
- safety yellow: `#eac56d` (chevrons/markers)
- track/undercarriage shadow: `#131a2a`; outlines `#0d1526`
- shadows are dark blue `#0b1533`, **never** pure black
- white specular highlight at `#ffffff` ~0.25–0.3 opacity

## Style rules

1. **Silhouette first.** At in-game size (a unit is ~10 px) the outline must read
   instantly: distinct hull/turret/antenna shapes, no thin detail that blurs.
2. **Top-down 2.5D.** Use multi-stop gradients (4+ stops, hue shift) + a
   specular highlight + a colored drop shadow. Never flat two-stop fills.
3. **Faction language.** Modular hardware, visible antennae, one bright cyan
   signal accent, small safety-yellow chevron. Coalition is modular/mobile.
4. **Reference:** `unit_tank.svg` is the canonical vehicle template (hull +
   tracks + turret + barrel + antennae + cyan sensor + yellow chevron). Copy its
   structure for vehicles; vary the shape to match each unit's role.
5. Keep the `<title>` and `<defs>`/gradient/filter `color-interpolation` and
   `color-interpolation-filters` = `linearRGB` exactly as in the template.

## Required files

Units (face up):
- `unit_scout.svg` — Lynx: compact 4-wheel chassis, roof lidar, thin antennae.
- `unit_infantry.svg` — Line Rifle: small squad (2–3 figures + blue ID tabs).
- `unit_tank.svg` — Valiant MBT (DONE — reference).
- `unit_anti_tank.svg` — Javelin team: infantry + launcher tube, shoulder mount.
- `unit_harvester.svg` — boxy hauler with a collector/arm and cargo pod.
- `unit_mcv.svg` — construction vehicle (chassis + crane/dozer + crane arm).

Buildings:
- `building_hq.svg` — 4×4 low modular command block, blue-white mast, grid pulse.
- `building_processor.svg` — 3×3 resource exchange (processor/hoppers).
- `building_assembly.svg` — 3×3 vehicle assembly (bay/garage doors).
- `building_infantry_center.svg` — 2×2 infantry center (barracks tubes).

Terrain (tile, repeatable, low contrast so units stay readable):
- `terrain_clear.svg` — clear buildable ground (subtle grass/rubble texture).
- `terrain_cover.svg` — line-of-sight cover (grove/rubble/sandbag mound) that
  reads darker/heavier than clear ground.

Objective / resource:
- `objective_beacon.svg` — central relay beacon (mast + ring, safety yellow).
- `resource_node.svg` — resource deposit (ore/crystal cluster, cyan tint).

## Verification loop (mandatory)

For EVERY asset: write → render → view → fix → repeat:

```bash
node tools/svgrender.mjs <filename.svg> /tmp/<name>.png 512 512
```

Then open `/tmp/<name>.png`, look at it, and fix problems (proportions, gaps,
overlap, color saturation, small-scale legibility) until it reads clearly. The
in-game target is tiny, so test that the silhouette is obvious at a glance.
