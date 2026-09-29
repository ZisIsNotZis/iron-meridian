import fs from 'node:fs';

const root = process.cwd();

function read(file) {
  const source = `${root}/${file}`;
  if (fs.existsSync(source)) return fs.readFileSync(source, 'utf8');
  const destination = file.replace(/^design\/(?:combat\/README|combat\/interactions|construction\/README|economy\/README|interactions\/README|movement\/README|collisions(?:\/README)?|control|air-operations|naval-operations|numerics|transport)(?:\.md)?$/, match => {
    const names = {
      'combat/README': 'combat', 'combat/interactions': 'combat_interactions',
      'construction/README': 'construction', 'economy/README': 'economy',
      'interactions/README': 'interactions', 'movement/README': 'movement',
      collisions: 'collisions', 'collisions/README': 'collisions', control: 'control', 'air-operations': 'air_operations',
      'naval-operations': 'naval_operations', numerics: 'numerics', transport: 'transport'
    };
    const key = match.replace(/^design\//, '').replace(/\.md$/, '');
    return `design/content/docs/gameplay/${names[key]}.yml`;
  });
  if (fs.existsSync(`${root}/${destination}`)) return fs.readFileSync(`${root}/${destination}`, 'utf8');
  throw new Error(`missing source ${file}`);
}

function sections(file) {
  const result = { overview: [] };
  let current = 'overview';
  for (const line of read(file).split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      current = heading[1].trim().toLowerCase();
      result[current] = [];
      continue;
    }
    if (line.trim()) result[current].push(line);
  }
  return result;
}

function q(value) { return JSON.stringify(String(value)); }

function yaml(value, indent = 0) {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) return value.map(item => {
    if (item && typeof item === 'object') {
      const entries = Object.entries(item);
      const [firstKey, firstValue] = entries[0];
      let out = `${pad}- ${firstKey}: ${scalar(firstValue, indent + 2)}`;
      for (const [key, child] of entries.slice(1)) out += `\n${pad}  ${key}: ${format(child, indent + 2)}`;
      return out;
    }
    return `${pad}- ${scalar(item, indent + 2)}`;
  }).join('\n');
  return Object.entries(value).map(([key, child]) => `${pad}${key}: ${format(child, indent)}`).join('\n');
}

function scalar(value, indent) {
  return value && typeof value === 'object' ? `\n${yaml(value, indent)}` : q(value);
}

function format(value, indent) {
  return value && typeof value === 'object' ? `\n${yaml(value, indent + 2)}` : q(value);
}

function list(s, ...names) {
  const out = [];
  for (const name of names) out.push(...(s[name] ?? []));
  return out.length ? out : ['not_applicable'];
}

function prose(s, name) {
  return list(s, name).join(' ');
}

function cmd(rows) {
  return rows.map(([command, required_payload, accepted_when]) => ({ command, required_payload, accepted_when }));
}

const combat = sections('design/combat/README.md');
const combatInteractions = sections('design/combat/interactions.md');
const construction = sections('design/construction/README.md');
const economy = sections('design/economy/README.md');
const movement = sections('design/movement/README.md');
const interactions = sections('design/interactions/README.md');
const air = sections('design/air-operations.md');
const naval = sections('design/naval-operations.md');
const transport = sections('design/transport.md');
const numerics = sections('design/numerics.md');
const collision = sections('design/collisions.md');
const collisionReadme = sections('design/collisions/README.md');

const docs = [
  ['design/content/docs/gameplay/combat.yml', {
    kind: 'combat_contract', document_id: 'gameplay.combat', title: 'Combat Design', source_document: 'design/combat/README.md',
    ownership: [prose(combat, 'overview')], combat_promise: [prose(combat, 'combat promise')],
    attack_resolution: { definition: prose(combat, 'attack resolution'), fire_time_validation: list(combat, 'fire-time validation'), fire_failure: 'If fire-time validation fails, no damage occurs and the weapon remains ready unless its definition spends a shot on a miss.', impact_time_validation: list(combat, 'impact-time validation'), deterministic_hit_test: 'Compare integer squared distances and fixed radii; do not use frame-rate-dependent continuous collision callbacks.', v1_hit_test: list(combat, 'impact-time validation') },
    hit_models: { ownership_rule: prose(combat, 'hit models'), table: [
      ['Point', 'One impact point applies damage to one legal target.', 'Dodge, cover, break lock, or force a cheaper target.'], ['Projectile', 'A moving point with speed and collision radius.', 'Move, intercept, use terrain, or leave the target domain.'], ['Beam', 'A ray checked from source to endpoint during active ticks.', 'Break line of sight, outrange, or interrupt windup.'], ['Area', 'A pulse or impact around a center, with distance falloff.', 'Spread out, leave the warning, or attack the delivery unit.'], ['Arc', 'A sector from source orientation with maximum angle and radius.', 'Attack from the rear/side, flank, or leave the sector.'], ['Line', 'A corridor from source to endpoint with width and ordered hits.', 'Cross the corridor, use cover, or force a bad facing.'], ['Attack run', 'A fixed-wing or similar pass firing along a declared path.', 'Anti-air, dispersal, and moving away from the run.']
    ].map(([model, meaning, counterplay]) => ({ model, meaning, counterplay })), area_arc_line_semantics: list(combat, 'area, arc, and line semantics'), area_falloff: prose(combat, 'area, arc, and line semantics'), v1_friendly_fire: prose(combat, 'area, arc, and line semantics') },
    range_vision_acquisition: { distance: prose(combat, 'range, vision, and acquisition'), information: prose(combat, 'range, vision, and acquisition'), policies: [['Direct', 'fire at a currently visible and legal target.'], ['Lock', 'acquire for a windup; movement, stealth, EMP, or broken line of sight can break the lock.'], ['Point/designated', 'fire at a visible point or ally-designated position; the shot can miss if the target leaves it.'], ['Indirect', 'fire at a known point without direct line of sight, but requires a valid observation, designation, or remembered position.']].map(([name, rule]) => ({ name, rule })), auto_attack: prose(combat, 'range, vision, and acquisition'), v1_auto_attack: list(combat, 'range, vision, and acquisition'), targetability: prose(combat, 'range, vision, and acquisition') },
    cooldown_rate_of_fire: { states: prose(combat, 'cooldown and rate of fire'), timing_definition: prose(combat, 'cooldown and rate of fire'), minimum_repeat_period: 'windupTicks + recoveryTicks + cooldownTicks', interruption: prose(combat, 'cooldown and rate of fire'), burst: prose(combat, 'cooldown and rate of fire'), v1_exclusions: list(combat, 'cooldown and rate of fire'), facing: prose(combat, 'cooldown and rate of fire') },
    damage_and_armor: { formula: list(combat, 'damage and armor'), ownership: prose(combat, 'damage and armor'), application_order: prose(combat, 'damage and armor'), same_tick_order: prose(combat, 'damage and armor'), channels: [['Health', 'removes hit points after armor conversion.'], ['Protection condition', 'fills a bounded condition track and exposes the declared ratio at threshold.'], ['Structural', 'uses the structure column and is normally absent or weak on mobile units.'], ['Incendiary', 'creates a bounded hazard or damage-over-time effect.'], ['Suppression', 'fills a bounded track that reduces weapon performance.'], ['EMP', 'applies electronic disable/degradation and never directly removes health.'], ['Freeze', 'fills a threshold track and changes state as described.']].map(([name, meaning]) => ({ name, meaning })) },
    health_repair_destruction: { health: prose(combat, 'health, repair, and destruction'), destruction: prose(combat, 'health, repair, and destruction'), repair: prose(combat, 'health, repair, and destruction'), v1_repair: prose(combat, 'health, repair, and destruction') },
    status_rules: { general: prose(combat, 'status rules'), suppression: prose(combat, 'suppression'), emp: prose(combat, 'emp'), freeze: list(combat, 'freeze'), freeze_platform_rule: prose(combat, 'freeze') },
    movement_attack_interaction: list(combat, 'movement and attack interaction'), deterministic_combat_order: { steps: list(combat, 'deterministic combat order'), presentation: prose(combat, 'deterministic combat order'), zero_health: prose(combat, 'deterministic combat order') }, acceptance_cases: list(combat, 'v1 combat acceptance cases'), role_spine: list(combat, 'v1 role spine')
  }],
  ['design/content/docs/gameplay/combat_interactions.yml', {
    kind: 'combat_interaction_contract', document_id: 'gameplay.combat_interactions', title: 'Combat Interaction Matrix', source_document: 'design/combat/interactions.md', ownership: [prose(combatInteractions, 'overview')], resolution_pipeline: { flow: prose(combatInteractions, 'resolution pipeline'), stages: list(combatInteractions, 'resolution pipeline') }, hit_result_closure: list(combatInteractions, 'v1 hit result closure'), domain_matrix: [
      ['Ground','legal if weapon permits','illegal unless weapon permits low-air','illegal by default','illegal','illegal','illegal'], ['Low-air','legal only for weapons declaring low-air/ground interception','legal','legal only if declared','illegal by default','illegal','illegal'], ['High-air','illegal by default','illegal by default','legal if weapon permits high-air','illegal','illegal','illegal'], ['Naval-surface','illegal by default','illegal by default','legal only for declared air-to-naval weapons','legal','legal only for declared depth/transition weapons','illegal'], ['Submerged','illegal','illegal','illegal by default','illegal by default','legal only for declared submerged weapons','illegal'], ['Structure','legal only for anti-structure declarations','legal only for declared strike weapons','legal only for declared strike weapons','legal only for declared naval/shore weapons','illegal by default','legal']
    ].map(([target_state, ground, low_air, high_air, naval_surface, submerged, structure]) => ({ target_state, ground, low_air, high_air, naval_surface, submerged, structure })), armor_and_damage: list(combatInteractions, 'armor and damage'), status_and_domain_transitions: list(combatInteractions, 'status and domain transitions'), interaction_examples: list(combatInteractions, 'interaction examples'), status_precedence: list(combatInteractions, 'v1 status precedence'), authoring_validation: list(combatInteractions, 'authoring and validation requirements'), v1_restrictions: list(combatInteractions, 'authoring and validation requirements')
  }],
  ['design/content/docs/gameplay/construction.yml', { kind: 'construction_contract', document_id: 'gameplay.construction', title: 'Construction Design', source_document: 'design/construction/README.md', ownership: [prose(construction, 'overview')], v1_building_set: list(construction, 'v1 building set'), build_lifecycle: { builder: prose(construction, 'build lifecycle'), flow: prose(construction, 'build lifecycle'), steps: list(construction, 'build lifecycle'), channel_rules: list(construction, 'build lifecycle'), blueprint_rules: list(construction, 'placement validation'), hq_rule: prose(construction, 'build lifecycle') }, placement_validation: { predicates: list(construction, 'placement validation'), anchors: list(construction, 'placement validation'), radius_measurement: list(construction, 'placement validation'), conflict_order: list(construction, 'placement validation'), geometry: list(construction, 'placement validation') }, production_interaction: list(construction, 'production interaction'), recovery_counterplay: list(construction, 'recovery and counterplay'), acceptance_cases: list(construction, 'recovery and counterplay'), deferred: list(construction, 'explicitly deferred') }],
  ['design/content/docs/gameplay/economy.yml', { kind: 'economy_contract', document_id: 'gameplay.economy', title: 'Economy Design', source_document: 'design/economy/README.md', ownership: list(economy, 'ownership'), resource_lifecycle: { currency: prose(economy, 'v1 resource lifecycle'), flow: prose(economy, 'v1 resource lifecycle'), rules: list(economy, 'v1 resource lifecycle'), scenario_start: prose(economy, 'v1 resource lifecycle') }, income_spending: list(economy, 'income timing and spending'), harvester_behavior: { flow: prose(economy, 'harvester behavior'), rules: list(economy, 'harvester behavior'), authority: prose(economy, 'harvester behavior') }, edge_cases_ordering: list(economy, 'v1 edge cases and ordering'), acceptance_cases: list(economy, 'v1 economy acceptance cases'), recovery_counterplay: list(economy, 'recovery and counterplay'), deferred: list(economy, 'explicitly deferred') }],
  ['design/content/docs/gameplay/movement.yml', { kind: 'movement_contract', document_id: 'gameplay.movement', title: 'Movement and Group Control', source_document: 'design/movement/README.md', ownership: [prose(movement, 'overview')], movement_pipeline: { flow: prose(movement, 'movement pipeline'), rules: list(movement, 'movement pipeline'), tie_break: prose(movement, 'movement pipeline'), ownership: prose(movement, 'overview') }, pathfinding: list(movement, 'v1 pathfinding contract'), formations: list(movement, 'formations'), facing_attack_movement: list(movement, 'facing and attack movement'), separation_contact: list(movement, 'separation and contact'), required_fields_failure_states: list(movement, 'required object fields and failure states'), player_facing_rules: list(movement, 'player-facing movement rules'), deferred: list(movement, 'deferred extensions') }],
  ['design/content/docs/gameplay/interactions.yml', { kind: 'interaction_contract', document_id: 'gameplay.interactions', title: 'World Interactions', source_document: 'design/interactions/README.md', ownership: [prose(interactions, 'overview')], common_contract: list(interactions, 'common contract'), capture: list(interactions, 'capture'), garrison_evacuate: list(interactions, 'garrison and evacuate'), repair_heal: list(interactions, 'repair and heal'), reclaim_salvage: list(interactions, 'reclaim and salvage'), neutral_objects: list(interactions, 'neutral objects'), ordering: list(interactions, 'interaction ordering'), cross_system_player_facing: list(interactions, 'cross-system and player-facing contract'), deferred: list(interactions, 'deferred extensions') }],
  ['design/content/docs/gameplay/air_operations.yml', { kind: 'air_operations_contract', document_id: 'gameplay.air_operations', title: 'Air Operations', source_document: 'design/air-operations.md', ownership: [prose(air, 'overview')], airspace_boundary: list(air, 'airspace and collision'), facility_schema: list(air, 'ownership and schema'), aircraft_schema: list(air, 'ownership and schema'), airspace_collision: list(air, 'airspace and collision'), facility_lifecycle: list(air, 'facility lifecycle'), takeoff_flight_return: list(air, 'takeoff, flight, and return'), landing_service: list(air, 'landing and service'), commands: cmd([['produce','recipe and facility','recipe is available and FIFO/cap are valid'],['launch','aircraft ID','aircraft is parked and lane/stand are clear'],['move','aircraft ID and air point/path','path is legal in the air layer'],['attack','aircraft ID and target/point','acquisition and movement are legal'],['attack-run','aircraft ID and lane/target','card owns attack-run delivery'],['hold','aircraft ID','aircraft has a stable hold state'],['return','aircraft ID','aircraft is not destroyed or already parked'],['land','aircraft ID and facility','facility and approach are valid'],['service','aircraft ID','aircraft is in a legal service state'],['skill','aircraft ID and skill payload','card skill is legal in current state']]), sensing_targeting_combat: list(air, 'sensing, targeting, and combat'), interruptions: list(air, 'interruptions and edge cases'), presentation_events: list(air, 'presentation, events, and map interaction'), scope: [prose(air, 'overview')] }],
  ['design/content/docs/gameplay/naval_operations.yml', { kind: 'naval_operations_contract', document_id: 'gameplay.naval_operations', title: 'Naval Operations', source_document: 'design/naval-operations.md', ownership: [prose(naval, 'overview')], water_boundary: list(naval, 'ownership and schemas'), facility_schema: list(naval, 'ownership and schemas'), unit_schema: list(naval, 'ownership and schemas'), movement_collision: list(naval, 'water movement and collision'), states: list(naval, 'surface, dive, and amphibious states'), production_launch_repair_capture: list(naval, 'production, launch, repair, and capture'), commands: cmd([['produce','recipe and facility','facility, region, queue, and recipe are valid'],['move','vessel ID and water point/path','locomotor and full footprint stay legal'],['attack','vessel ID and target/point','weapon domain, detection, and geometry pass'],['hold','vessel ID','vessel has a stable anchored/hold state'],['dive','vessel ID','card allows diving from current stable state'],['surface','vessel ID','card allows surfacing and depth is legal'],['board','carrier and passenger IDs','transport interaction passes'],['unload','carrier and destination/shore ID','exit footprint and passenger platform are legal'],['beach','vessel ID and shore interaction ID','card and map allow beaching'],['repair','source and target ID','repair source and target domain are valid'],['skill','vessel ID and skill payload','card skill is legal in current state']]), sensing_targetability: list(naval, 'sensing and targetability'), combat_interactions: list(naval, 'combat and interactions'), transport_shore: list(naval, 'transport and shore lifecycle'), edge_cases: list(naval, 'edge cases and deterministic behavior'), presentation_events: list(naval, 'presentation, events, and map interaction'), scope: [prose(naval, 'overview')] }],
  ['design/content/docs/gameplay/transport.yml', { kind: 'transport_contract', document_id: 'gameplay.transport', title: 'Transport Operations', source_document: 'design/transport.md', ownership: [prose(transport, 'overview')], scope: [prose(transport, 'overview')], carrier_schema: list(transport, 'ownership and schemas'), transfer_record: list(transport, 'embarked state'), eligibility_reservation: list(transport, 'eligibility and reservation'), boarding: list(transport, 'boarding lifecycle'), embarked: list(transport, 'embarked state'), unloading: list(transport, 'unloading lifecycle'), commands: cmd([['board','carrier ID and ordered passenger IDs','eligibility and capacity pass'],['unload','carrier ID and destination/interaction ID','exit validation can begin'],['unload-one','carrier ID, passenger ID, destination','named passenger is embarked'],['hold-unload','carrier ID','active channel may stop before next passenger'],['cancel-transfer','carrier and passenger IDs','channel is cancellable'],['move','carrier ID and route','carrier state and route allow movement'],['return','carrier ID and facility/shore ID','carrier operation owns return'],['skill','carrier ID and skill payload','card skill permits cargo state']]), platform_rules: list(transport, 'platform-specific interaction'), destruction: list(transport, 'combat, sensing, ownership, and destruction'), edge_cases: list(transport, 'edge cases and deterministic behavior'), presentation_events: list(transport, 'presentation and events') }],
  ['design/content/docs/gameplay/numerics.yml', { kind: 'numerics_contract', document_id: 'gameplay.numerics', title: 'Numeric Principles', source_document: 'design/numerics.md', ownership: list(numerics, 'overview'), representation: list(numerics, 'representation'), time_determinism: list(numerics, 'time and determinism'), ownership_inheritance: list(numerics, 'ownership and inheritance'), ownership_map: [['Entity health, footprint, movement, sensing, weapon/skill parameters, cost, build time, and capacity','The unit or building card; a genuinely shared complete definition may own it instead.'],['Damage/armor ratios and reusable timing or geometry defaults','The referenced first-class damage, armor, weapon, status, locomotor, sensing, or production object.'],['Resource-node coordinates, reserves, exclusions, and map-local objective geometry','The specific map.'],['Starting bank, starting roster, scenario-only availability, and mission setup','The specific scenario or mission.'],['Capture/reward thresholds and objective state-machine values','The objective definition; a scenario may override them explicitly.'],['Lifecycle ordering, rejection rules, reservation semantics, and deterministic tie-breaks','The owning system document.']].map(([value, canonical_owner]) => ({ value, canonical_owner })), validation: list(numerics, 'validation') }],
  ['design/content/docs/gameplay/collisions.yml', { kind: 'collision_contract', document_id: 'gameplay.collisions', title: 'Collision Principles', source_document: 'design/collisions.md; design/collisions/README.md', ownership: [prose(collision, 'overview')], profiles: [prose(collision, 'overview'), prose(collisionReadme, 'schema')], crush: [prose(collision, 'overview')], required_fields: [prose(collisionReadme, 'schema')] }]
];

for (const [file, data] of docs) {
  fs.mkdirSync(`${root}/design/content/docs/gameplay`, { recursive: true });
  fs.writeFileSync(`${root}/${file}`, `${yaml(data)}\n`);
}
