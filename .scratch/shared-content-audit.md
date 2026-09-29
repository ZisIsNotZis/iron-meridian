# Shared schema/content audit

- [x] Inventory in-scope Markdown, YAML, schemas, and references
- [x] Identify truthful shared-content/schema mismatches; exclude faction content
- [x] Patch minimal in-scope files and preserve unresolved ownership blockers
- [x] Run content/coverage/design/runtime checks and inspect final diff

## Result

Final cleanup status: the migrated concrete Markdown cards are deleted after
canonical YAML verification; earlier retention statements are historical
migration-phase evidence.

Shared schemas and reusable content were patched for the audited armors,
damages, locomotors, collisions, sensing, targetabilities, skills, statuses,
weapons, maps, scenarios, production, and recipes. Faction Markdown was
handled by the separate faction migration; retained faction contracts were not
deleted.

Checks passed on 2026-08-27:

- `node tools/check_content.mjs --root .` — 187 YAML files
- `node tools/check_content.mjs --root . --self-check`
- `python3 tools/audit_design.py` — 106 Markdown files, no violations
- YAML parse check — 187 content files
- `node --experimental-strip-types tests/sim/self-check.ts` — `c85cdc0d`
- trailing-whitespace check — clean

Final cleanup accounting:

- Deleted 305 superseded Markdown files: 242 faction entity cards/assets,
  40 shared object cards, 10 production/recipe cards, 9 map/scenario/campaign
  cards, and 4 world-character cards.
- Retained 106 Markdown files: README/index/principle/system/narrative
  documents, faction identity/doctrine/background/assets/production contracts,
  collection contracts, and schema documentation.
- Preserved all 187 canonical YAML records; no YAML was deleted.

## Blockers

- No source-fact blocker remains. Canonical YAML fields and schemas cover every
  deleted concrete card; retained contracts remain Markdown by design.
