# All remaining Markdown links and path references

Audit date: 2026-08-27. Read-only audit; no source Markdown or YAML was edited.

## Result

Scanned all 106 retained `design/**/*.md` files and the repository Markdown
files, including `.scratch` reports. The Markdown-link scan found 222 links to
Markdown, 174 links to YAML, and 19 links to directories. Every live link
target resolves on disk; no stale live Markdown, YAML, or directory link was
found. The current checks also pass:

```text
python3 tools/audit_design.py --root .
Audited 106 Markdown files
No violations found

node tools/check_content.mjs --root .
checked 187 YAML content file(s)
```

The Markdown links below are therefore not broken-link fixes. They are
conversion candidates. Existing concrete object links already use canonical
YAML. System, navigation, narrative, and schema documents do not have a
truthful single YAML destination in the current registry.

## Exact live Markdown-link lines and disposition

The following are the exact source lines that still point at retained Markdown
documents. Repeated occurrences are grouped by source target. All targets are
live.

| Source lines | Target | Recommendation |
|---|---|---|
| `CONTEXT.md:13,16,27,31,34`; `design/README.md:11,15,16`; `design/TODO.md:4`; `design/game/README.md:23`; `design/maps/README.md:23,43,103`; `design/presentation/v1-spec.md:20`; `design/production/recipes/README.md:40`; `design/scenarios/README.md:8` | `design/v1/README.md` / `v1/README.md` | Retain. V1 is a cross-record product/scope contract. Related canonical object: `scenarios.v1_meridian_crossing` -> `design/content/scenarios/v1_meridian_crossing.yml`. |
| `README.md:9` | `design/README.md` | Retain. Repository design navigation has no YAML object owner. |
| `design/README.md:15` | `game/README.md` | Retain. Product/system contract; no existing YAML owner. |
| `design/README.md:17`; `design/agents/README.md:163`; `design/combat/README.md:23`; `design/interactions/README.md:84`; `design/multiplayer/README.md:176`; `design/scenarios/README.md:27`; `design/v1/README.md:93` | `architecture/README.md` | Retain. Architecture contract, not content data. |
| `design/README.md:18`; `design/TODO.md:16`; `design/architecture/README.md:207` | `multiplayer/README.md` | Retain. Future platform contract; no YAML owner. |
| `design/README.md:18`; `design/TODO.md:17`; `design/architecture/README.md:208` | `agents/README.md` | Retain. Future platform contract; no YAML owner. |
| `design/README.md:18`; `design/TODO.md:18`; `design/architecture/README.md:208`; `design/implementation/README.md:88` | `modding/README.md` | Retain. Package contract, not built-in content. |
| `design/README.md:18`; `design/TODO.md:19`; `design/architecture/README.md:209`; `design/implementation/README.md:88` | `persistence/README.md` | Retain. Future platform contract; no YAML owner. |
| `design/README.md:18`; `design/TODO.md:20`; `design/architecture/README.md:209`; `design/v1/README.md:97,295` | `testing/README.md` | Retain. Validation contract; no YAML owner. |
| `design/README.md:19`; `design/TODO.md:20` | `implementation/README.md` | Retain. Delivery contract; no YAML owner. |
| `design/README.md:20`; `design/world/README.md:7-13` | `world/README.md`, `world/history.md`, `world/geography.md`, `world/technology.md`, `world/organizations.md`, `world/relationships.md`, `world/identity.md`, `world/characters/README.md` | Retain. Narrative/world contracts have no single YAML owner. Concrete characters already use `world.characters.<name>` YAML. |
| `design/README.md:21`; `design/world/geography.md:23`; `design/maps/README.md` internal links | `maps/README.md` | Retain. Collection/index contract; concrete maps are `maps.meridian_crossing`, `maps.relay_yard`, `maps.salt_line`, `maps.three_arches`. |
| `design/README.md:22`; `design/combat/README.md:350`; `design/factions/irregular-network/README.md:131`; `design/world/technology.md:15` | `factions/README.md` | Retain as cross-faction/index contract. Faction records are `factions.coalition`, `factions.directorate`, and `factions.irregular_network`. |
| `design/README.md:23`; `design/combat/README.md:357`; `design/factions/README.md:11`; `design/factions/coalition/units/README.md:18`; `design/factions/irregular-network/units/README.md:12` | `units/README.md` | Retain. Shared unit system contract; individual entity YAML owns values. |
| `design/README.md:24`; `design/construction/README.md:8`; `design/factions/*/buildings/README.md` | `buildings/README.md` | Retain. Shared building contract; individual building YAML owns values. |
| `design/README.md:25`; `design/buildings/README.md:11`; faction doctrine/index lines | `combat/README.md` | Retain. Cross-axis system contract. |
| `design/README.md:25`; `design/buildings/README.md:10`; faction/index lines | `economy/README.md` | Retain. System contract; no single YAML owner. |
| `design/README.md:25`; `design/buildings/README.md:9`; faction/index lines | `construction/README.md` | Retain. System contract; no single YAML owner. |
| `design/README.md:25`; `design/interactions/README.md:30` | `objectives/README.md` | Retain. Objective system contract; instances are scenario-owned. |
| `design/README.md:26`; `design/factions/irregular-network/tech/README.md:6,117` | `tech/README.md` | Retain. Shared technology contract; Network graph needs a separate schema decision. |
| `design/README.md:27`; `design/architecture/README.md:8`; `design/economy/README.md:10`; `design/objectives/README.md:5`; `design/units/README.md:35` | `numerics.md` | Retain. Numeric authoring/ownership rules, not a content object. |
| `design/README.md:28`; `design/presentation/v1-spec.md:46`; `design/ai/near-term.md:10` | `control.md` | Retain. Player-control/command contract; no existing YAML owner. |
| `design/README.md:29`; `design/TODO.md:12-14`; faction unit index lines | `transport.md`, `air-operations.md`, `naval-operations.md` | Retain. Domain operation contracts; no single existing YAML owner. |
| `design/README.md:30`; `design/combat/README.md:4-7`; faction doctrine lines | `armors.md`, `damages.md`, `locomotors.md`, `sensing.md`, `targetabilities.md`, `status-effects.md`, `weapons.md` | Retain collection/system contracts. Concrete IDs are already YAML: `armors.*`, `damages.*`, `locomotors.*`, `sensing.default_sensing`, `targetabilities.*`, `statuses.*`, `weapons.*`. |
| `design/README.md:30`; `design/production/README.md:13`; `design/v1/README.md:91` | `production/README.md`, `production/recipes/README.md` | Retain schema/index contracts. Concrete recipe IDs are already YAML under `recipes.*`. |
| `design/README.md:31`; `design/buildings/README.md:183`; `design/units/README.md:44`; faction asset lines | `presentation/README.md`, `presentation/assets.md` | Retain global presentation/asset contracts. Entity/faction presentation already belongs in owning YAML fields. |
| `design/README.md:32`; `design/implementation/README.md:42,88` | `TODO.md` | Retain navigation for deferred work. |
| `design/factions/README.md:7-9`; faction README/identity/building/unit index lines | faction `README.md`, `background.md`, `identity.md`, `doctrine.md`, `assets.md` | Candidate sole owners for faction-owned facts are `factions.coalition`, `factions.directorate`, and `factions.irregular_network` at `design/content/factions/<faction>.yml`. Index/navigation prose has no one-record replacement. |
| `design/factions/irregular-network/README.md:56,117,131`; `design/factions/irregular-network/units/README.md:8,12,16-17`; `design/factions/irregular-network/buildings/README.md:60`; `design/production/README.md:26` | Network `production.md`, unit/building indexes, and shared contracts | Keep indexes/contracts. The production matrix is cross-record relation data and cannot move into an existing entity YAML. |
| `design/presentation/README.md:7,39,86`; `design/presentation/v1-spec.md:46,105`; `design/presentation/assets.md:160` | presentation subdocuments | Keep global contracts. Add named asset/audio/FX schema objects before conversion. |

## Exact canonical YAML-link lines

All YAML links resolve. The canonical path is derived from the ID by replacing
dots with slashes under `design/content/` and adding `.yml`.

| Source-line groups | Canonical replacement IDs/paths |
|---|---|
| `design/campaign/README.md:34-37` | `campaigns.contact`, `campaigns.breakthrough`, `campaigns.isolation`, `campaigns.decision` -> `design/content/campaigns/{contact,breakthrough,isolation,decision}.yml` |
| `design/maps/README.md:21,27,68,70,72,74` | `maps.meridian_crossing`, `maps.relay_yard`, `maps.three_arches`, `maps.salt_line` -> `design/content/maps/{meridian_crossing,relay_yard,three_arches,salt_line}.yml` |
| `design/scenarios/README.md:36`; `design/v1/README.md:83,108,134` | `scenarios.v1_meridian_crossing` -> `design/content/scenarios/v1_meridian_crossing.yml` |
| `design/world/characters/README.md:10,12,14,16` | `world.characters.mara_venn`, `world.characters.ilya_orsik`, `world.characters.sera_vale`, `world.characters.tomas_rusk` -> `design/content/world/characters/*.yml` |
| all faction building indexes | `factions.<faction>.buildings.<slug>` -> `design/content/factions/<faction>/buildings/<slug>.yml` |
| all faction infantry/vehicle/aircraft/naval indexes | `factions.<faction>.<platform>.<slug>` -> `design/content/factions/<faction>/<platform>/<slug>.yml` |
| `design/locomotors/README.md:19-34` | `locomotors.foot`, `locomotors.wheeled`, `locomotors.tracked`, `locomotors.helicopter`, `locomotors.fixed_wing`, `locomotors.surface_naval`, `locomotors.submerged`, `locomotors.amphibious`, `locomotors.hovering`, `locomotors.transforming` -> `design/content/locomotors/*.yml` |
| `design/production/recipes/README.md:45-53` | `recipes.v1_resource_exchange`, `recipes.v1_vehicle_assembly`, `recipes.v1_infantry_center`, `recipes.v1_lynx_scout_car`, `recipes.v1_line_rifle`, `recipes.v1_valiant_mbt`, `recipes.v1_javelin_team`, `recipes.v1_harvester`, `recipes.v1_mcv` -> `design/content/recipes/*.yml` |

## Exact non-link stale or noncanonical references

These lines are not live Markdown links but are path/ID references requiring
attention in a future all-YAML pass.

- `design/modding/README.md:67` — `docs/README.md`. This is an archive-local package example path, not a repository path; do not rewrite.
- `design/schema/README.md:52` — `design/schema/coverage-ambiguities.md`. Live migration-gate path; retain Markdown.
- `design/schema/coverage-ambiguities.md:10-45` — lists retained system documents as unresolved ownership cases. These are intentional migration gates, not stale links; retain until each gets a named schema/object.
- `design/factions/irregular-network/tech/README.md:31-39` — `tech.irregular-network.safehouse`, `tech.irregular-network.cells`, `tech.irregular-network.workshop`, `tech.irregular-network.exchange`, `tech.irregular-network.hideout`, `tech.irregular-network.advanced-cells`, `tech.irregular-network.jammer`, `tech.irregular-network.coastal`, `tech.irregular-network.relay`. These IDs use stale hyphenated namespace. Candidate normalized IDs: `tech.irregular_network.<node>` -> `design/content/tech/irregular_network/<node>.yml`; blocked because no tech schema/registry exists.
- `design/factions/irregular-network/production.md:28-49,60-64,74-76,86-89` — canonical faction/entity IDs are already correct: `factions.irregular_network.<platform>.<slug>`. They are matrix rows, not new entity definitions; preserve as references and add a typed relation owner if YAML conversion is required.
- `design/v1/README.md:154-156,169-174,178` — `factions.coalition.*` IDs are canonical IDs, but the exact listed references should be checked against the corresponding `design/content/factions/coalition/{buildings,vehicles,infantry}/*.yml` paths during any link rewrite.
- `design/modding/README.md:31,35,87` — `example.frontier-expedition.*` and `iron-meridian.vehicle.scout` are package/example protocol IDs, not repository built-in IDs; do not convert them to `design/content` paths.
- `design/presentation/assets.md:55-56` — `directorate.rifle-squad.fire` and `coalition.capture-pulse` are event examples, not content IDs. Define event-ID ownership before normalizing them.

## Ownership/conversion queue

1. Consolidate faction-owned background, identity, doctrine, and asset facts in
   `factions.coalition`, `factions.directorate`, and
   `factions.irregular_network` YAML records; leave indexes as navigation.
2. Add a named tech schema and choose graph-edge ownership before creating
   `tech.irregular_network.<node>` YAML.
3. Add a typed cross-record production-matrix owner before moving
   `design/factions/irregular-network/production.md`.
4. Keep global systems, presentation, world narrative, V1 scope, platform
   contracts, and schema/migration gates in Markdown until named YAML schemas
   exist. Do not put them in generic `notes`, `metadata`, `comment`, or
   unrestricted prose fields.
5. Keep `.scratch` migration reports unchanged: deleted Markdown paths in them
   are historical provenance, not live references.

No source files were edited.
