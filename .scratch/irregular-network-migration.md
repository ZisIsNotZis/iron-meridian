# Irregular Network content migration report

## Status

Final cleanup status: the migrated concrete Markdown cards are now removed;
the retention statement below is historical migration-phase evidence.

- Migration complete for 36 canonical records: 1 faction, 8 infantry, 10 vehicles, 4 aircraft, 4 naval, and 9 buildings.
- Canonical object paths are under `design/content/factions/irregular_network/`; no sibling object directories or generic asset objects were created.
- Final cleanup deleted 70 superseded Markdown files: 35 entity cards and 35 matching `assets.md` files.
- Entity asset facts are in each owning YAML's typed `presentation`, `audio`, and `fx` fields. Faction-wide asset facts are in the faction YAML's typed `presentation`, `audio`, and `fx` fields.
- No schema change was made.

## Canonical destinations

| Source group | Destination pattern | Count |
| --- | --- | ---: |
| Faction card and faction-wide identity/doctrine/background/assets | `design/content/factions/irregular_network.yml` | 1 |
| Infantry | `design/content/factions/irregular_network/infantry/<slug>.yml` | 8 |
| Vehicles | `design/content/factions/irregular_network/vehicles/<slug>.yml` | 10 |
| Aircraft | `design/content/factions/irregular_network/aircraft/<slug>.yml` | 4 |
| Naval | `design/content/factions/irregular_network/naval/<slug>.yml` | 4 |
| Buildings | `design/content/factions/irregular_network/buildings/<slug>.yml` | 9 |

The retained faction index, production matrix, tech index, buildings index,
and units index remain Markdown source documentation. Their principles and
availability boundaries are represented in the faction/entity descriptions and
typed design fields. The concrete entity cards and matching asset manifests
were deleted only after that verification.

## Final cleanup accounting

- Deleted: 70 Irregular Network faction entity Markdown files (35 cards + 35 matching assets manifests).
- Retained: faction README, identity, doctrine, background, assets, production, units/buildings indexes, and tech README contracts.
- Canonical YAML preserved: 36 Irregular Network records under `design/content/factions/`.

## Validation evidence

### Migration-only strict check: PASS

Command:

```text
node tools/check_content.mjs --root <temporary tree containing the existing shared content plus only factions/irregular_network>
```

Result (current tree):

```text
checked 77 YAML content file(s)
```

The temporary tree included the existing shared profiles/content and only the
new Irregular Network records. It did not alter the working tree. The checker
self-test also passes:

```text
content checker self-check passed
```

### Repository-wide strict check: PASS

Command:

```text
node tools/check_content.mjs
```

Exact result (current tree):

```text
checked 176 YAML content file(s)
```

The repository-wide check is clean in the current working tree. Earlier
failures referenced in the initial report were stale baseline/generated-content
state and are not present in this validation run; no unrelated faction content
was changed as part of this migration.

## Exact unmapped source facts

No Irregular Network gameplay, numeric, skill, state, counterplay,
player-experience, visual, audio, or FX fact was left without a destination.
Facts that have no standalone typed scalar in the current schema are preserved
verbatim in the owning typed `description`, `design.*`, `presentation.*`,
`audio.*`, or `fx.*` fields rather than guessed into new schema fields.

The only source material not represented as an independent object field is
index/principle prose whose destination is the faction or owning entity rather
than a separate object:

- `design/factions/irregular-network/README.md`: canonical context links and
  roster/index prose; the faction contract, constraints, availability classes,
  matchup rules, campaign role, and balance facts are in the faction record.
- `design/factions/irregular-network/units/README.md`: roster links and index
  prose; unit roles, constraints, rejected boundaries, and invariants are in
  the faction/entity records.
- `design/factions/irregular-network/buildings/README.md`: site roster/index
  prose; site facts are in the eight building records and faction record.
- `design/factions/irregular-network/tech/README.md`: technology graph and
  node names; current schema has no technology family, so these remain in the
  retained Markdown tech index and are not guessed into unit/building fields.
- `design/factions/irregular-network/production.md`: the full availability
  matrix and rejected products; producer, queue, cost/build time, and
  availability behavior are preserved on owning records, while the matrix
  remains the authoritative cross-record index because no recipe records were
  requested by this migration.

The Markdown files above are intentionally retained, so their index/prose
facts remain available and are not silently discarded.
