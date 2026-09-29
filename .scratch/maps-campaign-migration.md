# Maps, scenarios, and campaign migration report

Date: 2026-08-27

Scope: `design/maps/*.md` except `README.md`, `design/scenarios/*.md`, and
`design/campaign/*.md`.

## Result

Final cleanup deleted all nine superseded concrete Markdown documents listed
below. The three README/index contracts remain retained.

Migration is complete for all nine concrete source documents:

| Source | Canonical YAML | Derived ID |
|---|---|---|
| `design/maps/meridian-crossing.md` | `design/content/maps/meridian_crossing.yml` | `maps.meridian_crossing` |
| `design/maps/relay-yard.md` | `design/content/maps/relay_yard.yml` | `maps.relay_yard` |
| `design/maps/salt-line.md` | `design/content/maps/salt_line.yml` | `maps.salt_line` |
| `design/maps/three-arches.md` | `design/content/maps/three_arches.yml` | `maps.three_arches` |
| `design/scenarios/v1-meridian-crossing.md` | `design/content/scenarios/v1_meridian_crossing.yml` | `scenarios.v1_meridian_crossing` |
| `design/campaign/contact.md` | `design/content/campaigns/contact.yml` | `campaigns.contact` |
| `design/campaign/breakthrough.md` | `design/content/campaigns/breakthrough.yml` | `campaigns.breakthrough` |
| `design/campaign/isolation.md` | `design/content/campaigns/isolation.yml` | `campaigns.isolation` |
| `design/campaign/decision.md` | `design/content/campaigns/decision.yml` | `campaigns.decision` |

`design/maps/README.md` is explicitly excluded. `design/scenarios/README.md`
and `design/campaign/README.md` are retained index/contract documents rather
than concrete map, scenario, or mission objects; their non-object facts are
listed below as retained source material.

The Markdown campaign IDs (`campaign.mission.*`) were normalized to the exact
path-derived `campaigns.*` IDs. No YAML `id` fields were authored.

## Coverage

### Maps

- Meridian Crossing retains the complete `64 × 40` coordinate contract, cell
  flags and precedence, border, cover, route, construction-exclusion,
  build-pocket, HQ/processor/assembly, combat-exit, harvester,
  construction-start, objective, and all resource anchors.
- Meridian retains all numeric values: `1,000` distance units per cell,
  `24,000` home reserves, `12,000` contested reserve, `4`-cell capture,
  `8`-cell objective no-build, `2`-cell node exclusion, and the full
  deterministic neighbor order.
- Meridian retains all route waypoints, reachability/retreat constraints,
  reflection rules, cover/vision behavior, renderer authority, V1 exclusions,
  ten validation invariants, and the `8–12` minute / `50–80` entity target.
- Relay Yard retains the `64 × 40` grid, mirrored base/HQ/resource/objective
  geometry, `24,000`/`12,000` reserves, `4`/`8`/`2` radii, `y=10` and `y=30`
  routes, relay corridors at `x=20`, `x=32`, and `x=44`, route strategy,
  reachability, build-space, and non-authoritative relay decoration rules.
- Salt Line retains the `72 × 36` grid, all base/HQ/node/objective values,
  the three route bands, all four `3 × 2` cover blocks and their reflected
  centers, long-lane strategy, retreat/recovery contract, and validation
  boundaries.
- Three Arches retains the `64 × 40` grid, all base/HQ/node/objective values,
  three `3`-cell-wide approaches, six `4 × 2` cover blocks and centers,
  offset south-center block rule, `x=24`/`x=40` connections, route choices,
  retreat paths, and shared-rule boundaries.

Map-specific explicit schema additions are `center`, `size_cells`, and
`decorative_only` cover geometry, plus `corridors` and route `connectors`.

### V1 scenario

The YAML retains the two faction slots, sides, facing, controller, `1,500`
bank, zero reserve, all nine deterministic spawn rows and positions, exact
creation order, completion/order/cargo state, map anchors, spawn ordering,
full entity allow-list, recipe allow-list, player-facing recipe list, disabled
features, recovery allow-list and policy, fog, progression, pause, AI,
surrender, defeat, victory, no-draw, same-tick HQ priority, seed
`0x56315f4d45524944`, and the `8–12` minute / `50–80` active-entity
deterministic-fixture target.

Scenario-specific explicit schema additions are spawn `anchor`, availability
`unavailable_entities`, `closed_world`, `recovery_policy`,
`recovery_recipes`, and rules `objective_hold_seconds`, `same_tick_priority`,
and `human_harness`.

### Campaign missions

Each mission YAML retains its purpose, map, player/opponent factions and sides,
behavior difficulty, bank, starting structures and units, health overrides,
recipe availability, fog/progression, primary/optional/failure objectives,
all thresholds, trigger events/timers/conditions/actions/warnings/visibility,
briefing/success/failure dialogue, plain-text and voice policy, checkpoint
boundaries, restart behavior, optional-outcome behavior, and fairness rules.

The campaign schema is a strict `campaign_mission` family with named fields
for setup, availability, objectives, triggers, dialogue, checkpoints,
fairness, and campaign design. The registry now maps `campaigns` to this
schema; no campaign mission is stored as a generic profile.

## Exact unmapped facts

No gameplay, numeric, setup, geometry, objective, trigger, narrative, or
design fact in the scoped Markdown bodies is unmapped.

The retained non-object documents contain shared contracts rather than another
addressable object:

- `design/scenarios/README.md`: scenario ownership of map/faction/player/
  initial-entity/recipe/mode/victory setup; the closed-world rule that
  unlisted content is unavailable; stable spawn keys and deterministic
  creation order; the rule that metadata is descriptive only; and the V1
  Meridian Crossing index entry. Concrete values are in
  `scenarios.v1_meridian_crossing`.
- `design/campaign/README.md`: campaign ownership of mission sequencing,
  briefing/debrief, and bounded progression; near-term solo scope; the four
  mission sequence Contact → Breakthrough → Isolation → Decision; shared
  simulation/economy/fog/objective rules; minimum mission fields; pacing and
  authored-fairness rules; fixed-order unlock/rejoin behavior; checkpoint and
  continuity constraints; V1's lack of campaign continuity; and far-vision
  boundaries. These are campaign-wide contract/index prose, not a fifth
  mission object, so they remain in Markdown rather than being guessed into a
  mission record.

The following source-only reference prose is intentionally not represented as
runtime object references because it points to retained Markdown indexes rather
than concrete content objects:

- `design/campaign/contact.md:14` references `../objectives/README.md`.
  The objective contract itself is represented by the typed objective fields
  and rules in the mission and scenario YAML; the README remains the source
  index.
- Campaign front matter references to Markdown map cards were replaced by the
  canonical `maps.*` references. Legacy unit references were replaced by the
  exact `factions.*` setup and reference IDs.
- Scenario front matter references to faction/map Markdown indexes were
  replaced by canonical content IDs. The retained Markdown links are not
  additional gameplay facts.

No generic `comment`, `metadata`, `notes`, or `extra` field was added. Existing
named `design`, `description`, `rules`, `validation`, `dialogue`, and
`fairness` fields carry prose only where no more specific typed field exists.

## Final cleanup accounting

- Deleted: 9 files (4 maps, 1 scenario, 4 campaign missions).
- Retained: `design/maps/README.md`, `design/scenarios/README.md`, and
  `design/campaign/README.md`.
- Canonical YAML preserved: 9 records (4 maps, 1 scenario, 4 campaigns).

## Validation evidence

Commands run:

```text
node tools/check_content.mjs --root .
checked 187 YAML content file(s)

node tools/check_content.mjs --self-check
content checker self-check passed

python3 tools/audit_design.py --root .
Audited 106 Markdown files
No violations found
```
