id: design.index
title: Design Source of Truth
purpose: Navigation for the data-driven Iron Meridian design tree. This tree is the
  single source of truth; top-level README and CONTEXT only describe and gloss it.

## Layout

The design tree is data, stored as small strict-YAML documents that the runtime
resolves and the content checker validates. There are no authored Markdown
design docs; prose lives inside the YAML `description`, `purpose`, and `design`
fields.

- [`content/`](content/) — all game rules, entities, factions, maps, scenarios,
  and the documentation records themselves.
- [`schema/`](schema/) — JSON-schema-style definitions and the family registry
  the content checker uses to validate every authored record.

## Documentation records

Author-facing design documents are records under
[`content/docs/`](content/docs/). Each world-facing domain has a global
contract; faction-specific material lives under its faction folder.

### Global contracts

- [`game.yml`](content/docs/global/game.yml) — the product promise and match loop.
- [`v1.yml`](content/docs/global/v1.yml) — the authoritative V1 scope, exclusions,
  roster, recipe allow-list, and acceptance gates.
- [`architecture.yml`](content/docs/global/architecture.yml) — simulation/command/
  observation boundary and determinism rules.
- [`implementation.yml`](content/docs/global/implementation.yml) — delivery stages
  and implementation boundaries.
- [`testing.yml`](content/docs/global/testing.yml) — test taxonomy, fixtures,
  browser, security, privacy, release, and operations.
- [`units.yml`](content/docs/global/units.yml), [`buildings.yml`](content/docs/global/buildings.yml),
  [`maps.yml`](content/docs/global/maps.yml), [`scenarios.yml`](content/docs/global/scenarios.yml),
  [`production.yml`](content/docs/global/production.yml), [`recipes.yml`](content/docs/global/recipes.yml),
  [`tech.yml`](content/docs/global/tech.yml), [`progression.yml`](content/docs/global/progression.yml),
  [`objectives.yml`](content/docs/global/objectives.yml), [`campaign.yml`](content/docs/global/campaign.yml).

### Presentation, world, and systems

- [`content/docs/presentation/index.yml`](content/docs/presentation/index.yml) and
  [`content/docs/presentation/v1_spec.yml`](content/docs/presentation/v1_spec.yml) —
  rendering, readability, FX, audio, accessibility, and performance targets.
- [`content/docs/collections/`](content/docs/collections/) — shared object
  collections: armors, damages, locomotors, sensing, skills, statuses,
  targetabilities, weapons, production tiers.
- [`content/docs/world/`](content/docs/world/) — world and character material.
- [`content/docs/agents/`](content/docs/agents/), [`content/docs/ai/`](content/docs/ai/),
  [`content/docs/modding/`](content/docs/modding/),
  [`content/docs/multiplayer/`](content/docs/multiplayer/),
  [`content/docs/persistence/`](content/docs/persistence/) — deferred-system contracts.

### Factions

- [`content/docs/factions/`](content/docs/factions/) — faction index plus
  Coalition, Directorate, and Irregular Network identity, doctrine, units, and
  buildings.
- [`content/docs/factions/coalition/index.yml`](content/docs/factions/coalition/index.yml),
  [`content/docs/factions/directorate/index.yml`](content/docs/factions/directorate/index.yml),
  [`content/docs/factions/irregular_network/README.yml`](content/docs/factions/irregular_network/README.yml).

## Gameplay data

Concrete definitions live under [`content/`](content/) in the owning
collection or faction folder (armors, damages, locomotors, weapons, factions,
maps, scenarios, recipes, production, and world). A runtime content ID is the
record's path, so `factions/coalition/vehicles/valiant_mbt.yml` is
`factions.coalition.vehicles.valiant_mbt`.

## Validation

- `node tools/check_content.mjs` — validates every YAML record against its
  schema family and resolves all references.
- `python3 tools/audit_design.py` — checks retained Markdown links and canonical
  references (now minimal, since designs moved to YAML).
- `npm run test:sim` — deterministic headless simulation self-check.
- `npx tsx tests/content/manifest.ts` — content manifest resolution self-check.

## Rules for changing the tree

1. The runtime loads only named records; never add implicit defaults.
2. Every authored value has exactly one owning record; derived values name their
   source.
3. A record ID is its path; identity never comes from an `id` field.
4. Prefer editing an existing owning record over inventing a new object.
5. Keep any prose under 200 lines and link to existing records, not missing ones.
