# Documentation consistency pass

Date: 2026-08-27

Scope: retained `README.md`, `CONTEXT.md`, and `design/**/*.md` only. YAML,
schemas, runtime, and deleted files were not modified.

## Changes

- Replaced stale singular IDs with path-derived canonical IDs, including
  `scenarios.v1_meridian_crossing`, `maps.meridian_crossing`,
  `weapons.service_pistol`, `weapons.default_resolution`,
  `recipes.v1_*`, and `factions.*.*.*` entity IDs.
- Replaced all retained Irregular Network `irregular-network.unit.*` and
  `irregular-network.building.*` examples with exact
  `factions.irregular_network.<platform|buildings>.*` IDs.
- Updated shared-object references to current `design/content/<collection>/`
  YAML paths.
- Updated faction/entity ownership and asset-layout prose from legacy
  `units/` and per-entity `assets.md` layouts to owning YAML records and typed
  `presentation`, `audio`, and `fx` fields.

Files changed:

`design/armors.md`, `design/buildings/README.md`, `design/collisions.md`,
`design/damages.md`, `design/factions/README.md`,
`design/factions/coalition/README.md`,
`design/factions/coalition/buildings/README.md`,
`design/factions/coalition/identity.md`,
`design/factions/coalition/units/README.md`,
`design/factions/directorate/README.md`,
`design/factions/directorate/buildings/README.md`,
`design/factions/directorate/identity.md`,
`design/factions/directorate/units/README.md`,
`design/factions/irregular-network/README.md`,
`design/factions/irregular-network/identity.md`,
`design/factions/irregular-network/production.md`,
`design/factions/irregular-network/units/README.md`,
`design/locomotors.md`, `design/persistence/README.md`,
`design/presentation/README.md`, `design/presentation/assets.md`,
`design/production/recipes/README.md`, `design/sensing.md`,
`design/skills.md`, `design/status-effects.md`, `design/targetabilities.md`,
`design/units/README.md`, `design/v1/README.md`, `design/weapons.md`,
`design/weapons/README.md`, and `design/world/technology.md`.

## Validation

```text
python3 tools/audit_design.py --root .
Audited 106 Markdown files
No violations found

node tools/check_content.mjs
checked 187 YAML content file(s)
```

Focused legacy-ID/path scan returned no stale canonical-ID, faction-unit-ID,
legacy faction-path, or entity-asset-layout matches. Its remaining textual
matches are intentional:

- `design/modding/README.md`: a namespaced third-party package manifest example
  (`example.frontier-expedition.scenario.frontier`), not a game content ID.
- `design/combat/README.md`, `design/factions/coalition/doctrine.md`, and
  `design/schema/coverage-ambiguities.md`: ordinary prose or links containing
  collection names such as `locomotors`, `sensing`, `targetability`, and
  `design/sensing.md`; these are not dotted content IDs.
