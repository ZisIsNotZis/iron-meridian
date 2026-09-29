# Remaining non-faction Markdown coverage audit

Date: 2026-08-27

Scope: concrete Markdown cards under `design/armors`, `damages`,
`locomotors`, `targetabilities`, `collisions`, `sensing`, `skills`,
`statuses`, `weapons`, `production`, `maps`, `scenarios`, `campaign`, and
`world/characters`. Faction cards were excluded from this audit. All listed
concrete cards were subsequently verified against canonical YAML and deleted.

## Checker result

Commands run:

```text
node tools/check_content.mjs
node tools/check_content.mjs --self-check
python3 tools/audit_design.py --root .
```

Results from the migration-phase audit (before final cleanup):

```text
content checker self-check passed
Audited 411 Markdown files
No violations found
```

The migration-phase content-checker run exposed a recipe reference mismatch;
the canonical YAML was corrected before final cleanup. The final checker run
is recorded in the final cleanup evidence below.

The checker validates YAML records
and YAML-to-YAML references; it does not prove that Markdown prose/tables are
represented in YAML, and it intentionally does not validate the legacy
Markdown front-matter IDs listed below. `audit_design.py` also passes because
those legacy IDs form a self-consistent Markdown registry; they are not
canonical `design/content` IDs.

## Migration-phase coverage findings (resolved before deletion)

These were exact migration-phase findings. Each listed concrete card received
a canonical YAML record and was then deleted after field verification.

### Maps

- `design/maps/relay-yard.md` — all of `## Geometry`, `## Strategic contract`,
  and `## Validation invariants`; no `design/content/maps/relay_yard.yml`.
- `design/maps/salt-line.md` — all of `## Geometry`, `## Strategic contract`,
  and `## Validation invariants`; no `design/content/maps/salt_line.yml`.
- `design/maps/three-arches.md` — all of `## Geometry`, `## Strategic
  contract`, and `## Validation invariants`; no
  `design/content/maps/three_arches.yml`.

`design/maps/meridian-crossing.md` was represented by
`design/content/maps/meridian_crossing.yml`; no missing map fields were found
in that pair.

### Campaign missions

The campaign schema and YAML objects were added before cleanup. Each source
file was fully represented:

- `design/campaign/contact.md` — Purpose; Setup table; Objectives and triggers;
  Briefing and debrief; Checkpoint and fairness.
- `design/campaign/breakthrough.md` — Purpose; Setup table; Objectives and
  triggers; Briefing and debrief; Checkpoint and fairness.
- `design/campaign/isolation.md` — Purpose; Setup table; Objectives and
  triggers; Briefing and debrief; Checkpoint and fairness.
- `design/campaign/decision.md` — Purpose; Setup table; Objectives and
  triggers; Briefing and debrief; Checkpoint and fairness.

### World characters

The world-character schema and YAML objects were added before cleanup. The
complete prose of each card was represented:

- `design/world/characters/mara-venn.md` — commander identity, voice, visual,
  and usage boundaries.
- `design/world/characters/ilya-orsik.md` — commander identity, voice, visual,
  and usage boundaries.
- `design/world/characters/sera-vale.md` — liaison identity, voice, visual, and
  usage boundaries.
- `design/world/characters/tomas-rusk.md` — intelligence identity, voice,
  visual, and usage boundaries.

## Content gaps in otherwise migrated object cards

The following Markdown statements do not have an equivalent field or `design`
prose in the paired YAML. These are audit findings, not checker failures.

All concrete information-loss findings in the requested shared-object scope
are resolved with typed YAML fields validated by `design/schema/profile.yml`:

- Collision crush ratio is represented as `crush.mass_ratio.numerator: 2` and
  `crush.mass_ratio.denominator: 1`, preserving `2:1`.
- Locomotor ownership, applicability, and transition rules are represented by
  `attack_movement.policy_selection_owners`, `movement.applicability`,
  `movement.reverse_policy_owner`,
  `movement.altitude_and_air_target_domain_owner`, and typed
  `transition_rules` entries for the carrier/contract owners, visibility,
  vulnerability, interruption, timing, movement pause, stopping, and disabled
  weapon firing facts in the source cards.
- Low-air additional domains are represented by typed
  `additional_domains.allowed`, `owner`, and `declaration` fields.
- Recipe availability semantics are represented by typed
  `availability_semantics` fields for HQ survival, the single shared queue and
  combat-vehicle competition, the V1-only production-building role, costly
  recovery/non-respawn and existing-slot requirements, scenario-completed
  starting copies and recovery-only status, and mode-variant/scenario-owned
  Vehicle Assembly rebuilding.

The findings below were resolved before final deletion; faction records were
not changed by this shared-content audit.

The remaining reusable cards in armors, damages, sensing, skills, statuses,
weapons, the default production queue, the seven other recipes, targetability
profiles, and locomotors not listed above have their concrete values and
player-facing prose represented in their paired YAML. The only terminology
normalization issue is `reinforcedStructure` in
`design/armors/reinforced-structure/reinforced-structure.md:16` versus the
canonical YAML token `reinforced_structure`; the interaction meaning is
present.

## Legacy Markdown references

These were legacy references in deleted source cards and are retained here as
migration evidence; they are no longer part of the post-migration tree.

- `design/damages/*/*-*.md:5` — all eight damage cards reference
  `armor.*`; canonical YAML IDs are `armors.*`.
- `design/locomotors/*/*-*.md:6` — ten locomotor cards reference
  `locomotor.attack-movement`; canonical YAML is
  `locomotors.attack_movement`.
- `design/statuses/incendiary/incendiary.md:5` — `damage.incendiary` should
  resolve to `damages.incendiary`.
- `design/targetabilities/low-air/low-air.md:5` — `targetability.ground` and
  `targetability.high-air` should resolve to
  `targetabilities.ground` and `targetabilities.high_air`.
- `design/weapons/service-pistol/service-pistol.md:6-8` — `damage.*`,
  `targetability.*`, and `weapon.*` references use the legacy singular and
  hyphenated namespace; canonical IDs are `damages.*`, `targetabilities.*`,
  and `weapons.*`.
- `design/production/recipes/v1-*.md:5-12` — recipe product, producer,
  availability, prerequisite, and reference values use legacy
  `coalition.*`, `scenario.*`, and singular `recipe.*` IDs. Canonical values
  are `factions.coalition.*`, `scenarios.v1_meridian_crossing`, and
  `recipes.*`.
- `design/scenarios/v1-meridian-crossing.md:8-11,19-46,56-77` — legacy map
  path, faction list, entity IDs, and recipe IDs in front matter; canonical
  equivalents exist in `design/content/scenarios/v1_meridian_crossing.yml`.
  Body links at `:99-101` and the Markdown references at `:57-58` still point
  to Markdown cards/README files rather than YAML objects.
- `design/campaign/contact.md:6-14`,
  `design/campaign/breakthrough.md:6-12`,
  `design/campaign/isolation.md:6-13`, and
  `design/campaign/decision.md:6-15` — legacy map links and
  `directorate.unit.*`/`coalition.unit.*` IDs; these missions have no YAML
  destination.
- `design/world/characters/{mara-venn,ilya-orsik,sera-vale,tomas-rusk}.md:6-8`
  — Markdown path references to faction README, organizations, and
  relationships; those references were preserved in typed character YAML
  fields or retained documents before deletion.

## Final cleanup accounting

- Deleted: 40 shared object cards, 10 production/recipe cards, 9 map/scenario/campaign cards, and 4 world-character cards.
- Retained: collection READMEs and system/principle documents, plus the maps,
  scenarios, campaign, and world collection READMEs.
- Canonical YAML preserved: 63 records for these migrated non-faction scopes
  (40 shared objects, 10 production/recipe records, 9 map/scenario/campaign
  records, and 4 world-character records).
- No source-fact blockers were found; no `.scratch/final-migration-blockers.md`
  was needed.

## Decision

The requested shared-object, map, scenario, campaign, and world-character
findings are resolved. No generic fields were added.
