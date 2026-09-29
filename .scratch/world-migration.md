# World character migration report

## Status

Final cleanup status: all four migrated concrete character cards are deleted;
the canonical YAML records remain. Earlier source-retention wording is
historical migration-phase evidence.

- Migrated all four in-scope concrete character cards under
  `design/world/characters/` (excluding `README.md`).
- Added the explicit `world_character` schema and `world: world_character`
  registry entry.
- Added four canonical records under
  `design/content/world/characters/<slug>.yml`.
- Source Markdown cards were deleted after canonical YAML verification.
- No generic `notes`, `metadata`, `extra`, or catch-all content field was used.

## Canonical records

| Source | Canonical path | Derived ID |
| --- | --- | --- |
| `design/world/characters/ilya-orsik.md` | `design/content/world/characters/ilya_orsik.yml` | `world.characters.ilya_orsik` |
| `design/world/characters/mara-venn.md` | `design/content/world/characters/mara_venn.yml` | `world.characters.mara_venn` |
| `design/world/characters/sera-vale.md` | `design/content/world/characters/sera_vale.yml` | `world.characters.sera_vale` |
| `design/world/characters/tomas-rusk.md` | `design/content/world/characters/tomas_rusk.yml` | `world.characters.tomas_rusk` |

IDs are path-derived; no authored `id` field was added to YAML. Hyphenated
Markdown slugs become the required lowercase underscore YAML path segments.

## Field ownership

The strict `world_character` schema preserves each card's structured content in
named homes:

- `identity`: role, background, beliefs, capabilities, and limitations.
- `affiliation`: faction where stated, organization, position, region, and
  sector.
- `relationships`: explicit subject/nature records for each character's
  described institutional, personal, or information relationship.
- `presentation.visual`: the complete visual fact from each card.
- `audio.voice`: the complete voice fact from each card.
- `narrative.use` and `narrative.constraints`: briefing/debrief use and each
  card's authored narrative boundary.
- `source_document` and `source_references`: exact source card and front-matter
  reference paths, retained as provenance rather than runtime object data.

Sera Vale has no faction field because her source card identifies her as a
Rail-and-Works Authority liaison but does not assign her to a faction.

## Final cleanup accounting

- Deleted: 4 concrete world-character Markdown cards.
- Retained: `design/world/characters/README.md` and world system/narrative
  documents.
- Canonical YAML preserved: 4 `world_character` records.
- No source-fact blockers were found.

## Validation evidence

Commands run:

```text
node tools/check_content.mjs
checked 187 YAML content file(s)

node tools/check_content.mjs --self-check
content checker self-check passed
```

The four source cards and four canonical YAML records were enumerated and
matched by slug-derived destination before deletion.
