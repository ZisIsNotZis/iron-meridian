# All-Markdown-to-YAML schema plan

Status: proposal only. No Markdown or existing content/schema YAML was changed.

## Decision

Replace the 106 files under design/ one-for-one with typed YAML design
objects. Keep authored runtime content under design/content/ and runtime
schemas under design/schema/. Design contracts and runtime records are
different object families.

The migration must not turn prose into a large design, notes, text, metadata,
comment, or extra bag. Every sentence is assigned to a named home: a
principle, rule, rationale, narrative fact, implementation contract, typed
table row, index entry, acceptance criterion, or TODO. If a sentence has no
home, migration stops and adds a named schema family or field.

The checker should derive document identity from the path, as it already does
for content objects. YAML design documents do not author an id field.

## Inspected baseline

- 106 Markdown files under design/.
- Root README.md and CONTEXT.md.
- 187 authored content YAML files under design/content/.
- 11 YAML schemas under design/schema/, including registry.yml.
- tools/check_content.mjs and tools/audit_design.py.
- node tools/check_content.mjs: checked 187 YAML content file(s).
- node tools/check_content.mjs --coverage: 106 Markdown files and 28 files
  currently unmapped by the temporary heuristic.
- python3 tools/audit_design.py: 106 Markdown files, no violations.

The existing content shape is useful but not a sufficient documentation shape.
The registry maps infantry, vehicles, aircraft, naval, neutral, and reusable
collections through a small set of families. Most reusable collections share
the broad profile.yml union. common.yml also has a generic design object.
Those are runtime-content migration concerns; they must not become the model
for documentation.

The content checker is strict for runtime content: additionalProperties false,
path-derived IDs, exact dotted references, and no empty placeholders. It does
not validate Markdown meaning. audit_design.py checks links, limited front
matter, and retained principle files; its Markdown PRINCIPLE_DOCS allow-list
becomes obsolete after migration.

## Canonical layout

Use semantic filenames. index.yml is only a navigation/collection object;
contract.yml is a rule-owning document. A YAML file is never a Markdown
wrapper with one giant body string.

### Root families

| Family | Path | Typed ownership |
| --- | --- | --- |
| project_principles | project.yml | Project name, documentation ownership rules, Rule zero and ordered priorities. |
| glossary | context.yml | Terms and exact links to canonical design/content IDs; no duplicated decisions. |
| design_index | design/index.yml | Naming rules, domain tree, and canonical owner for each domain. |
| todo_index | design/todo.yml | Deferred tracks, contract IDs, scope, and promotion requirements. |

project.yml replaces root README.md; context.yml replaces CONTEXT.md;
design/index.yml replaces design/README.md; design/todo.yml replaces
design/TODO.md.

### System contract family

Use one registry family named system_contract with a required system
discriminator. The registry must select a closed schema branch per
discriminator; this is not an unrestricted sections map.

| Source | Destination | system |
| --- | --- | --- |
| design/game/README.md | design/game/contract.yml | game |
| design/architecture/README.md | design/architecture/contract.yml | architecture |
| design/implementation/README.md | design/implementation/contract.yml | implementation |
| design/control.md | design/control/contract.yml | control |
| design/combat/README.md | design/combat/contract.yml | combat |
| design/combat/interactions.md | design/combat/interactions.yml | combat_interactions |
| design/construction/README.md | design/construction/contract.yml | construction |
| design/economy/README.md | design/economy/contract.yml | economy |
| design/movement/README.md | design/movement/contract.yml | movement |
| design/interactions/README.md | design/interactions/contract.yml | world_interactions |
| design/objectives/README.md | design/objectives/contract.yml | objectives |
| design/progression/README.md | design/progression/contract.yml | progression |
| design/production/README.md | design/production/contract.yml | production |
| design/production/recipes/README.md | design/production/recipes/contract.yml | recipe_contract |
| design/tech/README.md | design/tech/contract.yml | technology |
| design/ai/README.md | design/ai/contract.yml | ai |
| design/ai/near-term.md | design/ai/near_term.yml | ai_profile |
| design/agents/README.md | design/agents/contract.yml | agent_control |
| design/multiplayer/README.md | design/multiplayer/contract.yml | multiplayer |
| design/modding/README.md | design/modding/contract.yml | modding |
| design/persistence/README.md | design/persistence/contract.yml | persistence |
| design/testing/README.md | design/testing/contract.yml | testing |
| design/presentation/README.md | design/presentation/contract.yml | presentation |
| design/presentation/accessibility.md | design/presentation/accessibility.yml | accessibility |
| design/presentation/animation.md | design/presentation/animation.yml | animation |
| design/presentation/assets.md | design/presentation/assets.yml | asset_production |
| design/presentation/audio.md | design/presentation/audio.yml | audio |
| design/presentation/camera.md | design/presentation/camera.yml | camera |
| design/presentation/fx.md | design/presentation/fx.yml | fx |
| design/presentation/logo/README.md | design/presentation/logo/index.yml | brand |
| design/presentation/performance.md | design/presentation/performance.yml | performance |
| design/presentation/ui-feedback.md | design/presentation/ui_feedback.yml | ui_feedback |
| design/presentation/v1-spec.md | design/presentation/v1.yml | presentation_scope |
| design/air-operations.md | design/air-operations.yml | air_operations |
| design/naval-operations.md | design/naval-operations.yml | naval_operations |
| design/transport.md | design/transport.yml | transport |
| design/numerics.md | design/numerics.yml | numerics |
| design/v1/README.md | design/v1/contract.yml | v1_scope |

Branches are domain-shaped. For example, architecture owns boundary,
simulation_loop, command_boundary, observation_boundary, determinism,
future_seams, and verification. Combat owns attack_resolution, hit_models,
range_and_acquisition, cooldowns, damage_and_armor, status_rules,
phase_order, acceptance_cases, and role_spine. Presentation owns goal,
v1_target, information_grammar, animation, audio, fx, camera, budgets, and
asset_ownership. None has generic sections or body.

### Reusable collection families

Each reusable collection keeps two distinct objects: principles and an index.

| Sources | Destinations |
| --- | --- |
| armors.md, armors/README.md | armors/principles.yml, armors/index.yml |
| collisions.md, collisions/README.md | collisions/principles.yml, collisions/index.yml |
| damages.md, damages/README.md | damages/principles.yml, damages/index.yml |
| locomotors.md, locomotors/README.md | locomotors/principles.yml, locomotors/index.yml |
| sensing.md, sensing/README.md | sensing/principles.yml, sensing/index.yml |
| skills.md, skills/README.md | skills/principles.yml, skills/index.yml |
| status-effects.md, statuses/README.md | statuses/principles.yml, statuses/index.yml |
| targetabilities.md, targetabilities/README.md | targetabilities/principles.yml, targetabilities/index.yml |
| weapons.md, weapons/README.md | weapons/principles.yml, weapons/index.yml |

The family is principle_contract for principles and object_collection_index for
indexes. A principle contract has named fields such as principles,
object_shape, separation_rules, counterplay_rules, and deferred_choices.
Fields vary by collection and are closed.

An object_collection_index has schema_id, object_ids, catalog_entries, and
ownership. Catalog entries are typed references and selection guidance, never
duplicate object values. Existing runtime files remain canonical, such as
design/content/armors/personnel.yml and design/content/weapons/service_pistol.yml.

### Faction families

Existing runtime faction cards stay under design/content/factions/. The
following are documentation objects.

| Source role | Destination pattern | Family | Typed homes |
| --- | --- | --- | --- |
| factions/README.md | factions/index.yml | faction_index | canonical_factions, shared_role_matrix, balance_rules, ownership |
| faction README.md | faction/index.yml | faction_contract | availability, roster_policy, balance_position, campaign_role, matchup_rules, canonical_content |
| faction/background.md | faction/background.yml | faction_background | origin, public_claim, internal_conflict, story_posture, scope_use |
| faction/doctrine.md | faction/doctrine.yml | faction_doctrine | strategic_idea, battlefield_habits, production_philosophy, matchup_expression, exclusions |
| faction/identity.md | faction/identity.yml | faction_identity | symbols, palette, materials, silhouette_language, naming, scope |
| faction/assets.md | faction/assets.yml | faction_presentation | visual_language, audio_language, fx_language, animation_rules, near_term_rules |
| faction/buildings/README.md | faction/buildings/index.yml | roster_index | entries, production_relationships, defense_rules, scope_decisions |
| faction/units/README.md | faction/units/index.yml | roster_index | entries, roster_coverage, shared_constraints, rejected_candidates |
| faction/units/<platform>/README.md | faction/units/<platform>.yml | roster_index | entries, coverage, platform_constraints |
| irregular-network/production.md | irregular-network/production.yml | faction_production_matrix | availability_classes, rows, rejected_rows, salvage_ownership |
| irregular-network/tech/README.md | irregular-network/tech/index.yml | faction_technology | nodes, edges, ruleset_resolution, campaign_introduction |

Roster entries are typed rows with object, platform, roles, availability,
producer, reason, replacement, and (for rejected rows) rejection_reason.
Health, cost, weapons, and presentation remain on runtime cards.

### World families

| Source | Destination | Family | Typed homes |
| --- | --- | --- | --- |
| world/README.md | world/index.yml | world_index | canonical_documents, scope_boundaries, world_promise |
| world/geography.md | world/geography.yml | world_geography | regions, battlefields, infrastructure_stakes, climate_material, scope |
| world/history.md | world/history.yml | world_history | eras, crisis, political_consequences, story_posture |
| world/identity.md | world/identity.yml | world_identity | tone, global_marks, naming_language, sound_motif, scope_rule |
| world/organizations.md | world/organizations.yml | world_organizations | union_institutions, successor_institutions, network_institutions, naming_rule |
| world/relationships.md | world/relationships.yml | world_relationships | claims_matrix, network_position, foreign_pressure, campaign_use |
| world/technology.md | world/technology.yml | world_technology | technological_ceiling, industrial_inheritance, digital_systems, presentation_rules |
| world/characters/README.md | world/characters/index.yml | character_index | cast, dialogue_ownership, constraints |

The four existing world_character runtime records remain the homes for
character identity, affiliation, relationships, visual, voice, and narrative
facts. The index only indexes them.

### Migration gate

design/schema/coverage-ambiguities.md becomes design/schema/coverage.yml,
family migration_gate. It must contain typed entries:

  kind: migration_gate
  unresolved:
    - source: design/ai/near-term.md
      question: ownership of AI profile versus system rules
      candidate_homes: [ai_contract, ai_profile]
      decision: pending
      blocking: true
  decision_rule:
    require_named_owner: true
    forbid_untyped_fallback: true

The unresolved item schema is {source, question, candidate_homes, decision,
blocking}; decision is required before closure. This preserves the audit gate
as data.

## Shared record vocabulary

These are reusable record definitions referenced by closed family schemas.
They are not extension points.

### Principles

principles is an ordered array of principle_entry:

  principles:
    - key: game_quality
      priority: 1
      statement: Make a good game.
      lower_priority_must_not_damage: true

Required fields are key and statement. priority is required when order is
meaningful. Optional typed fields are lower_priority_must_not_damage,
player_consequence, and scope. Ordered priorities are data, not numbered prose.

### Rules

rules is an ordered array of rule_entry, but contracts also have domain rule
fields. A rule entry is limited to key, condition, must, must_not, result,
order, and owner. Numeric thresholds, enum values, commands, states, and
events must be sibling typed fields in their owning branch.

Combat owns phase_order; architecture owns command_order; sensing owns
information_levels. A rule entry cannot become a paragraph escape hatch.

### Rationale

rationale is an explicit object with decision, reason, tradeoffs,
rejected_alternatives, and evidence. Tradeoffs and rejected alternatives are
typed records with option, reason, and optionally cost. Use it for one-resource
scope, no open-ended captured-unit production, and similar design choices.

### Narrative

Narrative is split by subject. Allowed homes include premise, origin,
public_claim, internal_conflict, political_claims, eras, setting_use,
story_posture, briefing, success, failure, dialogue, voice_policy,
visual_language, and sound_motif. Each family declares its allowed homes.
There is no narrative.data map.

Campaign dialogue uses purpose, briefing, success, failure,
plain_text_equivalent, and voice_policy. Character narrative keeps use and
constraints, matching the existing world_character schema.

### Implementation guidance

Implementation facts have explicit homes:

- implementation_plan: stages[], dependencies[], boundaries, pipeline[],
  failure_recovery, deferred[], promotion_gates[].
- System branches may own phase_order, state_machine, command_contract,
  validation, rejection_codes, events, visibility, determinism,
  resource_effects, and presentation_effects only when declared by that branch.
- test_contract: test_taxonomy, fixtures[], acceptance_runs[], evidence_fields,
  and release_gates.

An implementation stage has key, scope, steps[], inputs, outputs, excludes, and
gate. A step has order, action, owner_module, and evidence.

### Indexes and references

Indexes have typed entries. Each entry uses an exact target ID and only
family-approved fields such as title, kind, purpose, status, scope, canonical,
platform, role, availability, or producer.

Markdown links become exact IDs in owns, consumes, children, depends_on,
supersedes, derived_from, or references, chosen by relationship meaning.
Labels are not a second source of truth.

Runtime references remain exact dotted object-ID arrays. Design documents should
prefer precise relationship names and use external_sources only for actual
external URLs.

### TODOs

todo_index.tracks[] has key, contract, scope, status,
promotion_requirements, and acceptance_evidence. A detailed TODO item has
subject, owner, blocked_by, decision_needed, next_action, and reason.

status is one of deferred, ready, in_progress, done, or rejected. No empty
placeholder or miscellaneous bucket is allowed. The current deferred table
becomes nine typed tracks: air, naval, transport, Network promotion,
multiplayer, agents, mod packages, saves/replays, and release/verification.
The final paragraph becomes a promotion rule requiring explicit scope
decision and acceptance evidence.

### Acceptance, states, protocols, tables

- acceptance is an array of key, criterion, scope, blocking, evidence, and
  fixture. V1 gates cover content/boundary, determinism, player experience,
  presentation/accessibility/performance, and stop-ship rules.
- State diagrams become states[] and transitions[] with named states, trigger,
  timing, interruption, cancellation, and result.
- Protocol examples become actual schema trees. Agent tools become operations[]
  with name, purpose, input, output, errors, and limits. Architecture commands
  become commands[] and observation becomes a typed view tree.
- Tables become named arrays whose row schema names every column: hit_models,
  observation_levels, difficulty_profiles, role_matrix, included_systems,
  command_allowlist, ui_surfaces, performance_budgets, fixture_inventory.
- ASCII diagrams become flow arrays or transitions. Wireframes become layout
  with named regions and ordered children, never code-fence strings.

## Domain-specific homes that prevent fact loss

### Scope, game, architecture

v1_scope owns product_goal, player_experience[], authority,
included_systems[], canonical_match, initial_content[], recipe_allowlist[],
unavailable_content[], command_allowlist[], ui_surfaces[], acceptance[],
post_v1_boundaries, and reconciliation_decisions[]. It stores allow-lists and
ownership decisions only; scenario/map/entity YAML owns coordinates and values.

architecture owns the fixed 30 Hz tick, command sort key, phase order, stable
IDs, seeded randomness, command envelope fields, command matrix, rejection
taxonomy, fog-filtered GameView field tree, event cursor rules, persistence
seams, and verification invariants.

### Simulation systems

Combat must preserve typed resolution stages, hit models, target-domain
matrix, cooldown semantics, damage/armor conversion, status precedence,
destruction phase, movement interaction, deterministic tie-breakers, V1
acceptance fixtures, and role spine.

Economy must preserve resource lifecycle, node reservation, cargo,
extraction/unloading atomicity, processor channels, reservation/refund rules,
ordering, recovery, and deferred systems.

Construction must preserve lifecycle states, placement predicates, builder and
blueprint rules, construction/production interaction, refund behavior,
recovery, and deferred features.

Movement must preserve pathfinding, formations, facing, attack movement,
separation, failure states, and deferred extensions.

### Operations and future contracts

Air, naval, and transport each get a branch with ownership, schemas, states,
commands, rejection_codes, interaction_rules, edge_cases, events, and
presentation. Their current exclusions are typed as scope.excluded. Do not
flatten air facility lifecycle, surface/dive state, boarding, unloading, or
service queues into a generic future list.

Agents and multiplayer use typed protocol operations, auth/scope rules, limits,
fairness, errors, cursors, audit records, and acceptance cases.

Modding uses manifest, archive, asset, override, dependency, trust, script
budget, error, and lifecycle records. Persistence uses artifact kinds, envelope
fields, save/checkpoint/replay records, atomic storage, migration, privacy,
and ownership. Testing uses test taxonomy and evidence schema.

### Presentation and accessibility

Presentation contracts own information hierarchy, visual channels, animation
state matrices, audio buses/voice limits, FX families/lifetimes, camera values,
asset ownership/fallback, accessibility requirements, and performance budgets.

The V1 presentation object owns HUD regions, concrete UI states, interaction
mapping, shared event mappings, animation/FX/audio profiles, and placeholder
asset IDs. Asset entries point to existing assets.* objects; they do not
introduce simulation states or gameplay numbers.

### Factions and world

Faction objects keep doctrine, identity, background, political claims,
production relationships, availability classes, campaign reveal posture, roster
decisions, rejected candidates, and faction-specific art/audio/FX in their
owning paths. Shared role language stays in the faction index.

World objects keep Union history, Meridian Crisis, regions, infrastructure as
stakes, institutions, legitimacy claims, relationships, technology ceiling,
naming, tone, and sound motifs. Narrative paragraphs become ordered eras,
institutions, claims, regions, or explicit posture fields. World remains
mission and presentation support, not a second simulation.

## Strictness rules

1. Every design YAML document has a path-derived ID, kind, title, and status.
   scope is present only where that family owns scope; it is not universal
   metadata.
2. Every family and every nested record has a closed property set. Unknown keys
   fail validation.
3. Deny comment, comments, metadata, meta, extra, extras, notes, misc, other,
   custom, arbitrary, and untyped at every depth. Do not add generic design,
   sections, data, or params fields.
4. Empty strings, null placeholders, empty required collections, and omitted
   required decisions fail validation. Explicit absence uses a field-specific
   enum such as none, not_applicable, unavailable, or deferred.
5. Numbers carry units in field names: *_ticks, *_seconds, *_cells,
   *_degrees, *_percent, *_bytes, *_fps. Ranges, enums, commands, states, and
   IDs are typed.
6. Narrative is allowed only in named narrative fields. A long explanation is
   split into ordered facts or a named rationale/constraint field.
7. Ownership is explicit. A document may link to another owner but may not
   duplicate its values. The checker should detect duplicate scope allow-lists,
   roster values, map geometry, entity stats, and runtime formulas.
8. Local references resolve to a design ID or content ID. Relative Markdown
   paths are forbidden after migration.
9. Rejected and deferred decisions are first-class records. Do not delete a
   recorded exclusion or candidate merely because it is not implemented.

## Registry and checker changes

Add a design registry separate from the runtime registry:

  families:
    project: project_principles
    context: glossary
    design: design_index
    todo: todo_index
    system: system_contract
    principle: principle_contract
    collection: object_collection_index
    faction: faction_contract
    faction_background: faction_background
    faction_doctrine: faction_doctrine
    faction_identity: faction_identity
    faction_presentation: faction_presentation
    roster: roster_index
    world: world_index
    narrative: world_history
    migration: migration_gate

The real registry must enumerate every discriminator and path rule; this
snippet is not a permissive fallback.

Extend the checker with design mode that:

- discovers exact YAML design paths and derives IDs;
- validates registry branches, closed nested objects, enums, units, and
  non-empty values;
- rejects the generic-key deny-list;
- resolves typed design/content references and relationship direction;
- detects duplicate canonical owners and duplicate V1 allow-list facts;
- checks every source in the migration manifest has a destination;
- checks headings, lists, tables, code examples, state transitions, diagrams,
  numeric tokens, rejected/deferred decisions, and acceptance criteria each
  have evidence in a named field;
- reports unresolved migration-gate entries instead of treating them as
  successful coverage.

Retire the Markdown PRINCIPLE_DOCS rule only after project principles,
collection principles, and domain indexes are in the YAML registry. Keep a
temporary source manifest with source, destination, coverage_status, and
evidence until all 106 files are migrated. It is audit data, not runtime
metadata.

## Complete source inventory

The following is the exact 106-file inventory inspected. Destination is
derived by the tables above; small README files are included intentionally.

Root and systems:
- design/README.md
- design/TODO.md
- design/agents/README.md
- design/ai/README.md
- design/ai/near-term.md
- design/air-operations.md
- design/architecture/README.md
- design/armors.md
- design/armors/README.md
- design/buildings/README.md
- design/campaign/README.md
- design/collisions.md
- design/collisions/README.md
- design/combat/README.md
- design/combat/interactions.md
- design/construction/README.md
- design/control.md
- design/damages.md
- design/damages/README.md
- design/economy/README.md
- design/game/README.md
- design/implementation/README.md
- design/interactions/README.md
- design/locomotors.md
- design/locomotors/README.md
- design/maps/README.md
- design/modding/README.md
- design/movement/README.md
- design/multiplayer/README.md
- design/naval-operations.md
- design/numerics.md
- design/objectives/README.md
- design/persistence/README.md
- design/presentation/README.md
- design/presentation/accessibility.md
- design/presentation/animation.md
- design/presentation/assets.md
- design/presentation/audio.md
- design/presentation/camera.md
- design/presentation/fx.md
- design/presentation/logo/README.md
- design/presentation/performance.md
- design/presentation/ui-feedback.md
- design/presentation/v1-spec.md
- design/production-tiers.md
- design/production/README.md
- design/production/recipes/README.md
- design/progression/README.md
- design/scenarios/README.md
- design/schema/README.md
- design/schema/coverage-ambiguities.md
- design/sensing.md
- design/sensing/README.md
- design/skills.md
- design/skills/README.md
- design/status-effects.md
- design/statuses/README.md
- design/targetabilities.md
- design/targetabilities/README.md
- design/tech/README.md
- design/testing/README.md
- design/transport.md
- design/units/README.md
- design/v1/README.md
- design/weapons.md
- design/weapons/README.md

Faction sources:
- design/factions/README.md
- design/factions/coalition/README.md
- design/factions/coalition/assets.md
- design/factions/coalition/background.md
- design/factions/coalition/buildings/README.md
- design/factions/coalition/doctrine.md
- design/factions/coalition/identity.md
- design/factions/coalition/units/README.md
- design/factions/coalition/units/aircraft/README.md
- design/factions/coalition/units/infantry/README.md
- design/factions/coalition/units/naval/README.md
- design/factions/coalition/units/vehicles/README.md
- design/factions/directorate/README.md
- design/factions/directorate/assets.md
- design/factions/directorate/background.md
- design/factions/directorate/buildings/README.md
- design/factions/directorate/doctrine.md
- design/factions/directorate/identity.md
- design/factions/directorate/units/README.md
- design/factions/directorate/units/aircraft/README.md
- design/factions/directorate/units/infantry/README.md
- design/factions/directorate/units/naval/README.md
- design/factions/directorate/units/vehicles/README.md
- design/factions/irregular-network/README.md
- design/factions/irregular-network/assets.md
- design/factions/irregular-network/background.md
- design/factions/irregular-network/buildings/README.md
- design/factions/irregular-network/doctrine.md
- design/factions/irregular-network/identity.md
- design/factions/irregular-network/production.md
- design/factions/irregular-network/tech/README.md
- design/factions/irregular-network/units/README.md

World sources:
- design/world/README.md
- design/world/characters/README.md
- design/world/geography.md
- design/world/history.md
- design/world/identity.md
- design/world/organizations.md
- design/world/relationships.md
- design/world/technology.md

The blocks contain 66 root/system/collection sources, 32 faction sources,
and 8 world sources: 106 total. Every source has a destination family; no
README is silently discarded.

## Migration and evidence order

1. Add design registry, shared record definitions, source manifest, and checker
   mode; do not delete Markdown.
2. Migrate root principles, glossary, indexes, TODO, and coverage gate.
3. Migrate reusable collection principles/indexes, then system contracts.
4. Migrate world and faction narrative, roster, and index objects.
5. Audit every source for headings, lists, numbered rules, tables, code examples,
   links, numeric tokens, state transitions, rejected/deferred decisions, and
   acceptance criteria; record destination field evidence.
6. Resolve every migration_gate entry. No ambiguity may hide in a generic field.
7. Run existing content checks and the new design checker; update audit tooling
   to validate YAML references and source coverage.
8. Only after all checks pass, remove the 106 design Markdown files and root
   Markdown files, update code/docs links to IDs, and run the current test/E2E
   suite.

Completion evidence is zero Markdown under design/, zero generic-key violations,
zero unresolved design references, zero duplicate owners, zero unmapped source
facts, green current content checks, and a report preserving V1 allow-lists,
map/scenario identity, numeric values, command/event contracts, faction rosters,
narrative facts, implementation boundaries, indexes, and TODO decisions.
