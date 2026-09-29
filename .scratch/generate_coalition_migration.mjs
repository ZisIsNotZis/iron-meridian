import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'design', 'factions', 'coalition');
const destinationRoot = path.join(root, 'design', 'content', 'factions', 'coalition');

function read(file) { return fs.readFileSync(file, 'utf8'); }
function body(text) { return text.replace(/^---\n[\s\S]*?\n---\n/, '').trim(); }
function frontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  const result = {};
  if (!match) return result;
  const lines = match[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const item = lines[i].match(/^([a-z_]+):\s*(.*)$/);
    if (!item) continue;
    const values = [];
    if (item[2].trim()) values.push(item[2].trim());
    while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) values.push(lines[++i].replace(/^\s*-\s+/, '').trim());
    result[item[1]] = values.join(', ');
  }
  return result;
}
function title(text) { return (body(text).match(/^# (.+)$/m) ?? [,'Untitled'])[1]; }
function quote(value) { return JSON.stringify(String(value).replaceAll('\r', '')); }
function slug(value) { return value.toLowerCase().replaceAll('-', '_').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''); }
function number(value) { const match = String(value ?? '').match(/-?\d+(?:\.\d+)?/); return match ? Number(match[0]) : undefined; }
function bullet(text, label) {
  const match = text.match(new RegExp(`^- \\*\\*${label}:?\\*\\*:?\\s*([\\s\\S]*?)(?=\\n- \\*\\*|\\n\\n|(?![\\s\\S]))`, 'm'));
  return match ? match[1].replace(/\n\s+/g, ' ').trim() : '';
}
function tableRows(text, header) {
  const lines = text.split('\n');
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes(header) || !lines[i].trim().startsWith('|')) continue;
    for (let j = i + 2; j < lines.length && lines[j].trim().startsWith('|'); j++) {
      if (lines[j].includes('---')) continue;
      result.push(lines[j].split('|').slice(1, -1).map(x => x.trim()));
    }
    if (result.length) return result;
  }
  return result;
}
function firstTableRow(text, header) { return tableRows(text, header)[0] ?? []; }
function allTableRows(text, header) {
  const lines = text.split('\n');
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes(header) || !lines[i].trim().startsWith('|')) continue;
    for (let j = i + 2; j < lines.length && lines[j].trim().startsWith('|'); j++) {
      if (!lines[j].includes('---')) result.push(lines[j].split('|').slice(1, -1).map(x => x.trim()));
    }
  }
  return result;
}
function oldId(value, rootName) {
  const match = String(value ?? '').match(/(?:^|\s)(?:${rootName}\\.)?([a-z0-9-]+)/i);
  return match ? `${rootName}.${slug(match[1])}` : undefined;
}
function refFrom(value, rootName) {
  const match = String(value ?? '').match(new RegExp(`${rootName}\\.([a-z0-9-]+)`, 'i'));
  return match ? `${rootName}.${slug(match[1])}` : undefined;
}
function armour(value) {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('reinforced')) return 'armors.reinforced_structure';
  if (text.includes('personnel')) return 'armors.personnel';
  if (text.includes('heavy')) return 'armors.heavy';
  return 'armors.light';
}
function idFor(type, objectSlug) { return `factions.coalition.${type}.${objectSlug}`; }
function objectPath(type, objectSlug) { return path.join(destinationRoot, type, `${objectSlug}.yml`); }
function flowArray(values) { return `[${values.map(value => typeof value === 'string' && /^[{[]/.test(value) ? value : quote(value)).join(', ')}]`; }
function flowValue(value) { return typeof value === 'string' && /^[{[]/.test(value) ? value : quote(value); }
function flowObject(entries) {
  return `{${entries.filter(([, value]) => value !== undefined).map(([key, value]) => `${key}: ${typeof value === 'string' ? flowValue(value) : value}`).join(', ')}}`;
}
function add(lines, key, value, indent = '') { if (value !== undefined && value !== '') lines.push(`${indent}${key}: ${value}`); }
function yamlValue(value) { return typeof value === 'string' && /^[\[{]/.test(value) ? value : quote(value); }
function nestedYaml(key, entries) {
  return `${key}:\n${entries.filter(([, value]) => value !== undefined && value !== '').map(([name, value]) => `  ${name}: ${typeof value === 'string' ? yamlValue(value) : value}`).join('\n')}`;
}
function addNested(lines, key, entries, indent = '') {
  const values = entries.filter(([, value]) => value !== undefined && value !== '');
  if (!values.length) return;
  lines.push(`${indent}${key}:`);
  for (const [name, value] of values) lines.push(`${indent}  ${name}: ${typeof value === 'string' ? yamlValue(value) : value}`);
}
function blockText(text, label) {
  const match = text.match(new RegExp(`^[-*]?\\s*\\*\\*${label}\\*\\*:?\\s*([\\s\\S]*?)(?=\\n(?:###|##|\\*\\*|[-*] \\*\\*)|$)`, 'm'));
  return match ? match[1].replace(/\n\s+/g, ' ').trim() : '';
}
function sourceAsset(file) {
  const text = read(file);
  const source = body(text);
  return {
    visual: (source.match(/^## Visual identity\n\n([\s\S]*?)(?=\n##|(?![\s\S]))/m) ?? [,''])[1].trim(),
    requirements: (source.match(/^## Asset requirements\n\n([\s\S]*)$/m) ?? [,''])[1].trim(),
  };
}
function canonicalTargetability(meta, building) {
  const values = [...String(meta.targetability ?? '').matchAll(/targetability\.([a-z0-9-]+)/gi)]
    .map(x => `targetabilities.${slug(x[1])}`);
  return [...new Set(values.length ? values : [building ? 'targetabilities.structure' : 'targetabilities.ground'])];
}
function canonicalLocomotor(meta) {
  const match = String(meta.locomotor ?? '').match(/locomotor\.([a-z0-9-]+)/i);
  return match ? `locomotors.${slug(match[1])}` : 'locomotors.default_ground';
}
function weaponMount(text) {
  const row = firstTableRow(text, '| Weapon |');
  if (!row.length || /^none$/i.test(row[0])) return undefined;
  const damageText = row[1] ?? '';
  const details = row[3] ?? '';
  const delivery = row[4] ?? '';
  const damage = damageText.toLowerCase().includes('rifle') ? 'damages.rifle_small_arms'
    : damageText.toLowerCase().includes('machine gun') || damageText.toLowerCase().includes('autocannon') ? 'damages.machine_gun_autocannon'
    : damageText.toLowerCase().includes('anti-armor') ? 'damages.anti_armor_penetrator'
    : damageText.toLowerCase().includes('naval torpedo') ? 'damages.naval_torpedo'
    : damageText.toLowerCase().includes('air-to-ground') ? 'damages.air_to_ground_strike'
    : damageText.toLowerCase().includes('siege') ? 'damages.siege_structural'
    : 'damages.explosive_area';
  const targets = [];
  const lower = damageText.toLowerCase();
  if (/ground|personnel|vehicle|light|structure|special asset|shore/.test(lower)) targets.push('targetabilities.ground');
  if (/structure/.test(lower)) targets.push('targetabilities.structure');
  if (/naval/.test(lower)) targets.push('targetabilities.naval_surface');
  if (/high-air/.test(lower)) targets.push('targetabilities.high_air');
  if (/low-air/.test(lower)) targets.push('targetabilities.low_air');
  if (/special asset/.test(lower)) targets.push('targetabilities.special_asset');
  const period = details.match(/;\s*(\d+)\s*ticks?/i);
  const projectile = delivery.match(/(?:projectile|speed)\s+([\d.]+)/i);
  return flowObject([
    ['weapon', 'weapons.default_resolution'], ['mount_name', slug(row[0])], ['damage', damage],
    ['targetability', flowArray([...new Set(targets.length ? targets : ['targetabilities.ground'])])],
    ['attackrange', number(row[2])], ['attackdamage', number(details)],
    ['attackperiod', period ? Number(period[1]) : undefined], ['projectile_speed', projectile ? Number(projectile[1]) : undefined],
    ['delivery', /attack run/i.test(delivery) ? 'attack_run' : 'projectile'],
    ['hit_model', /area/i.test(delivery) ? 'area' : 'point'], ['tracking', /no homing|no post-launch tracking/i.test(delivery) ? 'none' : /homing|tracking/i.test(delivery) ? 'homing' : 'none'],
    ['acquisition', /lock/i.test(delivery) ? 'lock' : 'direct'], ['requires_observation', true],
  ]);
}
function skillBinding(text) {
  const skill = bullet(text, 'Skill');
  if (!skill) return undefined;
  const name = (text.match(/^- \*\*Skill:\*\* \*\*([^*]+)\*\*/m) ?? [,''])[1];
  const combined = `${name} — ${skill}`;
  const setup = combined.match(/(\d+)-tick setup/i);
  const duration = combined.match(/(?:lasts|for) (\d+) ticks/i);
  const cooldown = combined.match(/(\d+)-tick cooldown/i);
  const targetrange = combined.match(/within `?([\d.]+)`? cells/i);
  const targetradius = combined.match(/(?:service|bubble|radius) `?([\d.]+)`? cells/i);
  const entries = [
    ['skill', 'skills.default_lifecycle'], ['skill_name', name],
    ['activation', /passive/i.test(skill) ? 'passive' : 'active'],
    ['setup_ticks', setup ? Number(setup[1]) : undefined], ['duration_ticks', duration ? Number(duration[1]) : undefined],
    ['cooldown_ticks', cooldown ? Number(cooldown[1]) : undefined], ['targetrange', targetrange ? Number(targetrange[1]) : undefined],
    ['targetradius', targetradius ? Number(targetradius[1]) : undefined],
    ['movement_allowed', /prevents movement|stationary|anchors|immobiliz|cannot turn|movement is disabled/i.test(combined) ? false : undefined],
    ['interruption_conditions', /movement|EMP|damage|jamming|smoke/i.test(combined) ? flowArray(['movement', 'emp']) : undefined],
  ];
  return flowObject(entries);
}
function facilityId(text) {
  const facility = (bullet(text, 'Production').match(/facility: `([^`]+)`/i) ?? [,''])[1];
  const key = slug(facility);
  return key === 'vehicle_assembly' ? 'factions.coalition.buildings.vehicle_assembly'
    : key === 'infantry_center' ? 'factions.coalition.buildings.infantry_center'
    : key === 'air_operations' ? 'factions.coalition.buildings.air_operations'
    : key === 'littoral_dock' ? 'factions.coalition.buildings.littoral_dock'
    : undefined;
}
function prerequisiteIds(text) {
  const production = bullet(text, 'Production');
  const result = [];
  const known = [
    ['Coalition HQ', 'factions.coalition.buildings.coalition_hq'],
    ['Infantry Center', 'factions.coalition.buildings.infantry_center'],
    ['Vehicle Assembly', 'factions.coalition.buildings.vehicle_assembly'],
    ['Signals Laboratory', 'factions.coalition.buildings.signals_laboratory'],
    ['Mobility Workshop', 'factions.coalition.buildings.mobility_workshop'],
  ];
  for (const [name, id] of known) if (production.includes(name)) result.push(flowObject([['object', id], ['state', 'operational']]));
  return result;
}
function productionBlock(text, isBuilding) {
  const production = bullet(text, 'Production');
  if (!production) return undefined;
  const cost = production.match(/cost: `([\d.]+) resource/i);
  const buildtime = production.match(/build time: `([\d.]+) ticks/i);
  const queue = production.match(/queue\/category: `([^`]+)`/i);
  const maximum = production.match(/maximum (\d+)/i);
  const entries = [];
  if (cost) entries.push(['cost', flowObject([['resource', Number(cost[1])]])]);
  if (buildtime) entries.push(['buildtime', Number(buildtime[1])]);
  if (!isBuilding) {
    const producer = facilityId(text);
    if (producer) entries.push(['producer', producer]);
    if (queue) entries.push(['queue', slug(queue[1].split('/')[0])], ['category', slug(queue[1].split('/').slice(1).join('_') || queue[1])]);
    if (maximum) entries.push(['capacity', flowObject([['max_active', Number(maximum[1])], ['replacement_allowed', /replacement allowed/i.test(production)], ['replacement_competes_with_new', /replacement competes with new/i.test(production)]])]);
  }
  return flowObject(entries);
}
function assetFields(assetFile) {
  const asset = sourceAsset(assetFile);
  return [
    ['presentation', flowObject([
      ['fallback_policy', 'inherit'], ['silhouette', asset.visual],
      ['material_language', 'Coalition faction accents; bespoke artwork is pending.'], ['readability', asset.requirements],
    ])],
    ['audio', flowObject([['identity', 'Inherit global event taxonomy and Coalition audio language; no entity-specific cue list is recorded.']])],
    ['fx', flowObject([['identity', 'Inherit global semantic FX vocabulary and Coalition material language; bespoke presets are pending.']])],
  ];
}
function commonLines(name, description, meta, platform, tier, status) {
  return [
    `display_name: ${quote(name)}`, `description: ${quote(description)}`, `status: ${status}`,
    `faction: factions.coalition`, `platform: ${platform}`, `tier: ${tier}`,
  ];
}
function migrateObject(file, type) {
  const text = read(file), meta = frontMatter(text), source = body(text), name = title(text);
  const objectSlug = slug(path.basename(file, '.md'));
  const isBuilding = type === 'buildings';
  const destinationType = isBuilding ? 'buildings' : type;
  const output = objectPath(destinationType, objectSlug);
  const hpRows = firstTableRow(source, '| HP |');
  const stateRows = allTableRows(source, '| State |');
  const rows = hpRows.length ? hpRows : (stateRows[0] ?? []);
  const armorValue = hpRows.length ? hpRows[1] : (stateRows[0]?.[2] || meta.armor);
  const targetability = canonicalTargetability(meta, isBuilding);
  const references = [...new Set([
    'sensing.default_sensing', 'collisions.default_collision', 'weapons.default_resolution', 'skills.default_lifecycle',
    armour(armorValue), canonicalLocomotor(meta), ...targetability,
  ].filter(x => x && !['not_applicable'].includes(x)))];
  const asset = assetFields(path.join(path.dirname(file), 'assets.md'));
  const lines = commonLines(name, `${name} migrated from its Coalition design card.`, meta,
    isBuilding ? 'building' : type === 'infantry' ? 'infantry' : type === 'vehicles' ? 'vehicle' : type,
    meta.tier || 'field', meta.status || 'core');
  const buildingRole = (bullet(source, 'Production').match(/Role: ([^;]+)/i) ?? [,'support'])[1];
  if (isBuilding) {
    const footprint = (source.match(/\*\*Footprint:\*\* `([^`]+)`/) ?? [,'1 × 1'])[1].match(/([\d.]+)\s*[×x]\s*([\d.]+)/) ?? [,'1','1'];
    const health = number((source.match(/Health \/ protection:\*\* ([\d.]+)/i) ?? [,'100'])[1]);
    add(lines, 'building_roles', flowArray(buildingRole.split(/,| and /).map(slug).filter(Boolean)));
    add(lines, 'hpmax', health); add(lines, 'armor', armour(meta.armor)); add(lines, 'locomotor', 'not_applicable');
    add(lines, 'targetability', flowArray(targetability)); add(lines, 'sensing', 'sensing.default_sensing'); add(lines, 'collision', 'collisions.default_collision');
    add(lines, 'footprint', flowObject([['width_cells', Number(footprint[1])], ['height_cells', Number(footprint[2])], ['facings', 'cardinal']]));
    const production = bullet(source, 'Production');
    const cost = production.match(/cost: `([\d.]+) resource/i), buildtime = production.match(/build time: `([\d.]+) ticks/i), maximum = production.match(/maximum (\d+)/i);
    const prerequisites = prerequisiteIds(source);
    addNested(lines, 'construction', [['cost', cost ? flowObject([['resource', Number(cost[1])]]) : undefined], ['buildtime', buildtime ? Number(buildtime[1]) : 0], ['builder', production.includes('scenario start') ? undefined : 'factions.coalition.vehicles.mcv'], ['prerequisites', prerequisites.length ? flowArray(prerequisites) : undefined]]);
    if (maximum) add(lines, 'production', flowObject([['max_operational', Number(maximum[1])], ['replacement_allowed', /replacement allowed/i.test(production)]]));
  } else {
    const roleText = bullet(source, 'Roles');
    const roles = roleText.split(/[;,]/).map(x => slug(x.replace(/\b(primary|secondary)\b/gi, '').trim())).filter(x => x && /^[a-z]/.test(x));
    const speed = number(hpRows.length ? rows[2] : rows[3]);
    const vision = number(hpRows.length ? rows[4] : rows[5]);
    const alert = number(hpRows.length ? rows[5] : rows[6]);
    add(lines, 'battlefield_roles', flowArray([...new Set(roles.length ? roles : ['combined_arms'])]));
    add(lines, 'hpmax', number(hpRows.length ? rows[0] : rows[1]) || 100); add(lines, 'armor', armour(armorValue)); add(lines, 'locomotor', canonicalLocomotor(meta));
    add(lines, 'targetability', flowArray(targetability)); add(lines, 'sensing', 'sensing.default_sensing'); add(lines, 'collision', 'collisions.default_collision');
    if (speed !== undefined) add(lines, 'movespeed', speed); if (vision !== undefined) add(lines, 'visionrange', vision); if (alert !== undefined) add(lines, 'alertrange', alert);
    const radius = number((source.match(/Footprint radius[^|]*\|\s*([\d.]+)/i) ?? [,''])[1]); if (radius !== undefined) add(lines, 'footprint', flowObject([['radius_cells', radius]]));
    if (stateRows.length) add(lines, 'states', flowArray(stateRows.map((row, index) => flowObject([
      ['state', slug(row[0])], ['initial', index === 0], ['hpmax', number(row[1])], ['armor', armour(row[2])], ['movespeed', number(row[3])], ['visionrange', number(row[5])], ['alertrange', number(row[6])], ['footprint', flowObject([['radius_cells', number(row[4])]])],
    ]))));
    const weapon = weaponMount(source); if (weapon) add(lines, 'weapon_mounts', flowArray([weapon]));
    const skill = skillBinding(source); if (skill) add(lines, 'skill_bindings', flowArray([skill]));
    const production = productionBlock(source, false); if (production) add(lines, 'production', production);
    if (/Field repair/i.test(source)) add(lines, 'repair', flowObject([['available', true], ['target', 'allied_units'], ['range_cells', 2.5], ['interrupted_by_damage', true]]));
  }
  add(lines, 'references', flowArray(references));
  const designEntries = isBuilding ? [
    ['tactical_identity', buildingRole || undefined],
    ['construction_behavior', bullet(source, 'Placement') || undefined],
    ['production_behavior', bullet(source, 'Production') || undefined],
    ['defense_behavior', bullet(source, 'Targetability') || undefined],
    ['capture_behavior', bullet(source, 'Skill / passive') || undefined],
    ['repair_behavior', bullet(source, 'Player decision') || undefined],
    ['lifecycle_behavior', bullet(source, 'Counterplay') || undefined],
    ['player_decision', bullet(source, 'Player decision') || undefined],
    ['counterplay', bullet(source, 'Counterplay') || undefined],
    ['visual_identity', sourceAsset(path.join(path.dirname(file), 'assets.md')).visual || undefined],
    ['design_rationale', source],
  ] : [
    ['tactical_identity', bullet(source, 'Roles') || undefined], ['offense_behavior', bullet(source, 'Offense/defense') || undefined],
    ['locomotion_behavior', bullet(source, 'Locomotion') || undefined], ['targetability_behavior', bullet(source, 'Targetability') || undefined],
    ['acquisition_behavior', (source.match(/^- \*\*Acquisition:\*\* ([^\n]+)/m) ?? [,''])[1]],
    ['lock_behavior', (source.match(/^- \*\*Lock \/ tracking:\*\* ([^\n]+)/m) ?? [,''])[1]],
    ['production_behavior', bullet(source, 'Production') || undefined], ['player_decision', bullet(source, 'Player experience') || bullet(source, 'Player decision') || undefined],
    ['counterplay', bullet(source, 'Counterplay') || undefined], ['visual_identity', sourceAsset(path.join(path.dirname(file), 'assets.md')).visual || undefined],
    ['design_rationale', source],
  ];
  addNested(lines, 'design', designEntries);
  for (const [key, value] of asset) add(lines, key, value);
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, `${lines.join('\n')}\n`);
}

const groups = [
  ['buildings', path.join(sourceRoot, 'buildings')], ['infantry', path.join(sourceRoot, 'units', 'infantry')],
  ['vehicles', path.join(sourceRoot, 'units', 'vehicles')], ['aircraft', path.join(sourceRoot, 'units', 'aircraft')],
  ['naval', path.join(sourceRoot, 'units', 'naval')],
];
for (const [type, directory] of groups) for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
  if (entry.isDirectory()) migrateObject(path.join(directory, entry.name, `${entry.name}.md`), type);
}

const factionSource = ['identity.md', 'assets.md', 'background.md', 'doctrine.md'].map(file => read(path.join(sourceRoot, file)));
const assets = body(factionSource[1]);
const visual = (assets.match(/^## Visual language\n\n([\s\S]*?)(?=\n##|(?![\s\S]))/m) ?? [,''])[1].trim();
const audioFx = (assets.match(/^## Audio, FX, animation\n\n([\s\S]*?)(?=\n##|(?![\s\S]))/m) ?? [,''])[1].trim();
const rules = (assets.match(/^## Near-term presentation rules\n\n([\s\S]*?)(?=\n##|(?![\s\S]))/m) ?? [,''])[1].trim();
const doctrine = body(factionSource[3]), background = body(factionSource[2]), identity = body(factionSource[0]);
const faction = [
  `display_name: ${quote('Coalition')}`, `description: ${quote('Major successor faction seeking to rebuild a federation through regional consent, information, mobility, and combined-arms adaptation.')}`,
  'status: core', 'playable: true',
  `references: ${flowArray(['sensing.default_sensing', 'collisions.default_collision', 'weapons.default_resolution', 'skills.default_lifecycle'])}`,
];
addNested(faction, 'presentation', [['visual_identity', `${visual} ${identity}`], ['palette', 'slate blue, pale field gray, signal cyan, and small safety-yellow accents'], ['materials', 'bolt-on armor, antenna clusters, external cables, mixed paint batches, and repair plates'], ['silhouette_language', rules], ['placeholder_asset', 'slate-frame']]);
addNested(faction, 'audio', [['voice_language', audioFx], ['identity', audioFx], ['order_style', 'Orders are specific and conversational.'], ['event_language', 'Confirmed and uncertain contacts use different cadence.']]);
addNested(faction, 'fx', [['identity', audioFx], ['material_language', rules], ['event_language', rules]]);
addNested(faction, 'design', [['strategic_idea', bullet(doctrine, 'Strategic idea')], ['battlefield_habits', flowArray([...doctrine.matchAll(/^- (.+)$/gm)].map(x => x[1]))], ['production_philosophy', bullet(doctrine, 'Production philosophy')], ['economy_identity', 'Information support improves warning, coordination, and precision; it never becomes a prerequisite for ordinary movement or fire.'], ['matchup_expression', bullet(doctrine, 'Matchup expression')], ['player_decision', 'The central political question is consent or speed. Regional vetoes protect autonomy and slow unified action.'], ['counterplay', 'Mobility creates exposure and coordination creates a valuable support target.'], ['narrative_identity', `${background}\n\n${identity}`], ['scope', 'near_term']]);
fs.mkdirSync(destinationRoot, { recursive: true }); fs.writeFileSync(path.join(destinationRoot, 'coalition.yml'), `${faction.join('\n')}\n`);
