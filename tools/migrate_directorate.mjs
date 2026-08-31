import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'design', 'factions', 'directorate');
const outRoot = path.join(root, 'design', 'content', 'factions', 'directorate');

const categories = ['infantry', 'vehicles', 'aircraft', 'naval', 'buildings'];
const sourceCategory = category => category === 'buildings' ? 'buildings' : path.join('units', category);
const titles = {
  'breach-team': 'Breach Team', 'combat-engineer': 'Combat Engineer', 'field-marshal': 'Field Marshal',
  'rifle-squad': 'Rifle Squad', 'riot-section': 'Riot Section', 'rocket-section': 'Rocket Section',
  'shock-troopers': 'Shock Troopers', 'siege-grenadiers': 'Siege Grenadiers',
  'aegis-carrier': 'Aegis Carrier', ballista: 'Ballista', bastion: 'Bastion', bulwark: 'Bulwark',
  hammerhead: 'Hammerhead', harvester: 'Harvester', lancer: 'Lancer', mastodon: 'Mastodon',
  mcv: 'Mobile Construction Vehicle (MCV)', 'mobile-command-post': 'Mobile Command Post',
  'recovery-carrier': 'Recovery Carrier', sentinel: 'Sentinel', warden: 'Warden',
  'atlas-gunship': 'Atlas Gunship', 'firestorm-bomber': 'Firestorm Bomber', interceptor: 'Interceptor',
  skyhammer: 'Skyhammer', vulture: 'Vulture', 'hunter-submarine': 'Hunter Submarine',
  'landing-barge': 'Landing Barge', 'missile-corvette': 'Missile Corvette', monitor: 'Monitor',
  'aegis-emplacement': 'Aegis Emplacement', 'air-command': 'Air Command',
  'ballistic-bastion': 'Ballistic Bastion', barracks: 'Barracks', 'construction-yard': 'Construction Yard',
  'forward-command-post': 'Forward Command Post', 'garrison-blockhouse': 'Garrison Blockhouse',
  'heavy-works': 'Heavy Works', 'munitions-foundry': 'Munitions Foundry', 'naval-yard': 'Naval Yard',
  'ore-refinery': 'Ore Refinery', 'recovery-depot': 'Recovery Depot', 'vehicle-plant': 'Vehicle Plant'
};

const slug = s => s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const id = (family, name) => `factions.directorate.${family}.${slug(name)}`;
const yamlId = value => String(value).replaceAll('-', '_');
const q = s => JSON.stringify(String(s).replace(/\s+/g, ' ').trim());
const arr = xs => `[${xs.map(x => q(x)).join(', ')}]`;
const scalar = (key, value) => `${key}: ${typeof value === 'number' || typeof value === 'boolean' ? value : q(value)}`;
const norm = s => s.replaceAll('`', '').replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
const ref = (kind, value) => {
  const v = norm(value).toLowerCase();
  if (kind === 'armor') return `armors.${slug(v.replace(/^armor[.: ]*/, ''))}`;
  if (kind === 'locomotor') return `locomotors.${slug(v.replace(/^locomotor[.: ]*/, ''))}`;
  if (kind === 'targetability') return `targetabilities.${slug(v.replace(/^targetability[.: ]*/, ''))}`;
  if (kind === 'sensing') return `sensing.${slug(v.replace(/^sensing[.: ]*/, ''))}`;
  if (kind === 'collision') return `collisions.${slug(v.replace(/^collision[.: ]*/, ''))}`;
  if (kind === 'production') return `production.${slug(v.replace(/^production[.: ]*/, ''))}`;
  if (kind === 'weapon') return `weapons.${slug(v.replace(/^weapon[.: ]*/, ''))}`;
  if (kind === 'skill') return `skills.${slug(v.replace(/^skill[.: ]*/, ''))}`;
  if (kind === 'status') return `statuses.${slug(v.replace(/^status[.: ]*/, ''))}`;
  return v;
};
const read = file => fs.readFileSync(file, 'utf8');
const body = text => text.replace(/^---[\s\S]*?---\s*/, '').replace(/\r/g, '');
const lines = text => body(text).split('\n');
const bullet = (text, label) => {
  const m = text.match(new RegExp(`^- \\*\\*${label}:\\*\\*\\s*(.+)$`, 'm'));
  return m ? norm(m[1]) : '';
};
const section = (text, name) => {
  const m = body(text).match(new RegExp(`^## ${name}\\n([\\s\\S]*?)(?=^## |\\s*$)`, 'm'));
  return m ? m[1].trim() : '';
};
const h1 = text => (body(text).match(/^# (.+)$/m) || ['', ''])[1].trim();
const tableRows = text => lines(text).filter(x => /^\|/.test(x) && !/^\|\s*:?-+/.test(x)).map(x => x.split('|').slice(1, -1).map(norm));
const row = (rows, first) => rows.find(r => r[0].toLowerCase() === first.toLowerCase());
const number = (s, pattern) => { const m = norm(s).match(pattern); return m ? Number(m[1]) : undefined; };
const sourceFront = text => {
  const fm = (text.match(/^---\n([\s\S]*?)\n---/) || ['', ''])[1];
  const get = key => (fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm')) || ['', ''])[1].trim();
  const list = key => { const m = fm.match(new RegExp(`^${key}:\\n(?:  - .+\\n?)+`, 'm')); return m ? [...m[0].matchAll(/^  - (.+)$/gm)].map(x => x[1]).join(' ') : get(key); };
  return { status: get('status'), platform: get('platform'), tier: get('tier'), armor: get('armor'), locomotor: list('locomotor'), targetability: list('targetability'), sensing: get('sensing'), collision: get('collision') };
};
const roleNames = s => s.split(';').map(x => slug(x.replace(/\b(primary|secondary)\b/g, ''))).filter(Boolean).slice(0, 6);
const domainRefs = s => {
  const out = [];
  const x = norm(s).toLowerCase();
  if (/ground/.test(x)) out.push('targetabilities.ground');
  if (/low air/.test(x)) out.push('targetabilities.low_air');
  if (/high air/.test(x)) out.push('targetabilities.high_air');
  if (/naval surface/.test(x)) out.push('targetabilities.naval_surface');
  if (/submerged/.test(x)) out.push('targetabilities.submerged');
  if (/structure/.test(x)) out.push('targetabilities.structure');
  return [...new Set(out)];
};
const damageRef = s => {
  const x = norm(s).toLowerCase();
  if (/rifle/.test(x)) return 'damages.rifle_small_arms';
  if (/anti-armor/.test(x)) return 'damages.anti_armor_penetrator';
  if (/air-to-ground/.test(x)) return 'damages.air_to_ground_strike';
  if (/naval torpedo/.test(x)) return 'damages.naval_torpedo';
  if (/machine gun|autocannon/.test(x)) return 'damages.machine_gun_autocannon';
  if (/incendiary/.test(x)) return 'damages.incendiary';
  if (/siege|structural/.test(x)) return 'damages.siege_structural';
  if (/explosive/.test(x)) return 'damages.explosive_area';
  return '';
};
const facilityRef = s => {
  const x = norm(s).toLowerCase();
  const names = ['construction yard', 'ore refinery', 'barracks', 'vehicle plant', 'air command', 'naval yard', 'heavy works', 'munitions foundry', 'recovery depot'];
  const found = names.find(n => x.includes(n));
  return found ? id('buildings', found) : '';
};
const parseStats = (rows, kind) => {
  const hp = row(rows, 'HP / armor');
  const move = row(rows, 'Move / footprint radius');
  const sight = row(rows, 'Vision / alert / acquisition');
  const out = {};
  if (hp) out.hpmax = number(hp[1], /(\d+(?:\.\d+)?)/);
  if (move) { out.movespeed = number(move[1], /(\d+(?:\.\d+)?)\s*cells\/s/); out.radius = number(move[1], /\/\s*(\d+(?:\.\d+)?)\s*cell/); }
  if (sight) { out.vision = number(sight[1], /(\d+(?:\.\d+)?)/); out.alert = number(sight[1], /\/\s*(\d+(?:\.\d+)?)/); out.acquire = number(sight[1], /\/\s*(\d+(?:\.\d+)?)\s*ticks/); }
  if (kind === 'building') {
    const fp = row(rows, 'Footprint / placement');
    if (fp) { const m = fp[1].match(/(\d+)\s*[×x]\s*(\d+)/); if (m) { out.width = Number(m[1]); out.height = Number(m[2]); } }
  }
  return out;
};
const parseWeapons = (text, rows) => {
  const out = [];
  const start = rows.findIndex(r => r[0].toLowerCase() === 'weapon');
  if (start >= 0) for (const r of rows.slice(start + 1)) {
    if (!r[0] || /^(skill|field|hp|move|vision)$/i.test(r[0])) break;
    if (r.length < 4 || /^[-—]$/.test(r[0])) continue;
    const a = r[1], b = r[2], c = r[3];
    const w = { name: r[0], damage: damageRef(a), domains: domainRefs(a), range: number(b, /^(\d+(?:\.\d+)?)/), damageAmount: number(b, /\/\s*(\d+(?:\.\d+)?)/), period: number(b, /\/\s*(\d+(?:\.\d+)?)\s*ticks/), delivery: c, source: r.join(' | ') };
    if (w.damage || w.range !== undefined || w.damageAmount !== undefined) out.push(w);
  }
  const defense = bullet(text, 'Defense weapon');
  if (defense) {
    const m = defense.match(/^([^;]+);\s*([^;]+);\s*range\s+([\d.]+),\s*damage\s+([\d.]+),\s*period\s+([\d.]+)\s*ticks/i);
    if (m) out.push({ name: m[1], damage: damageRef(m[1]), domains: domainRefs(m[2]), range: Number(m[3]), damageAmount: Number(m[4]), period: Number(m[5]), delivery: defense, source: defense });
  }
  return out;
};
const parseSkill = (text, rows) => {
  const out = [];
  const start = rows.findIndex(r => r[0].toLowerCase() === 'skill');
  if (start >= 0) for (const r of rows.slice(start + 1)) {
    if (r.length < 2 || /^[-—]$/.test(r[0])) continue;
    if (/^presentation/i.test(r[0])) break;
    const s = norm(r[1]);
    const get = re => number(s, re);
    out.push({ name: r[0], setup: get(/(\d+)[- ]tick (?:setup|plant|lock|activation|deploy)/i), active: get(/(\d+)[- ]tick active/i), recovery: get(/(\d+)[- ]tick recovery/i), cooldown: get(/(\d+)[- ]tick cooldown/i), targetrange: get(/(?:within|placement range|range)\s+([\d.]+)\s*cell/i), source: r.join(' | ') });
  }
  return out;
};
const prereqs = s => {
  const found = []; const x = norm(s).toLowerCase();
  for (const n of ['construction yard', 'ore refinery', 'barracks', 'vehicle plant', 'air command', 'naval yard', 'heavy works', 'munitions foundry', 'recovery depot']) if (x.includes(n)) found.push(id('buildings', n));
  return [...new Set(found)];
};
const productionInfo = (text, building) => {
  const rows = tableRows(text); const cost = row(rows, 'Resource cost'); const bt = row(rows, 'Build time'); const fac = row(rows, 'Facility / prerequisites'); const queue = row(rows, 'Queue / category'); const cap = row(rows, 'Capacity / replacement');
  const out = { facility: fac ? facilityRef(fac[1]) : '', prereqs: fac ? prereqs(fac[1]) : [], cost: cost ? number(cost[1], /(\d+(?:\.\d+)?)/) : undefined, buildtime: bt ? number(bt[1], /(\d+(?:\.\d+)?)/) : undefined, category: queue ? slug(queue[1].split('/').at(-1)) : '', capacity: cap ? cap[1] : '' };
  const max = out.capacity.match(/maximum\s+(\d+)/i); if (max) out.max = Number(max[1]);
  return out;
};
const assetLine = file => norm((read(file).match(/^- (.+)$/m) || ['', ''])[1]);
const yaml = (obj, indent = 0) => {
  const pad = ' '.repeat(indent), out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === '' || v === null) continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      if (v.every(x => x === null || ['string', 'number', 'boolean'].includes(typeof x))) out.push(`${pad}${k}: ${arr(v)}`);
      else {
        out.push(`${pad}${k}:`);
        for (const item of v) {
          if (!item || typeof item !== 'object' || Array.isArray(item)) { out.push(`${pad}  - ${q(item)}`); continue; }
          const entries = Object.entries(item).filter(([, value]) => value !== undefined && value !== '' && value !== null && (!Array.isArray(value) || value.length));
          if (!entries.length) continue;
          const [firstKey, firstValue] = entries[0];
          if (Array.isArray(firstValue) || (firstValue && typeof firstValue === 'object')) {
            out.push(`${pad}  - ${firstKey}:`);
            out.push(yaml({[firstKey]: firstValue}, indent + 6).split('\n').slice(1).join('\n'));
          } else out.push(`${pad}  - ${scalar(firstKey, firstValue)}`);
          const rest = Object.fromEntries(entries.slice(1));
          if (Object.keys(rest).length) out.push(yaml(rest, indent + 4));
        }
      }
      continue;
    }
    if (typeof v === 'object') { out.push(`${pad}${k}:`); out.push(yaml(v, indent + 2)); continue; }
    out.push(`${pad}${scalar(k, v)}`);
  }
  return out.join('\n');
};

function entity(category, name) {
  const dir = path.join(sourceRoot, sourceCategory(category), name);
  const cardFile = path.join(dir, `${name}.md`);
  const text = read(cardFile), f = sourceFront(text), title = h1(text) || titles[name];
  const kind = category === 'buildings' ? 'building' : 'unit';
  const rows = tableRows(text), stats = parseStats(rows, kind), roles = bullet(text, 'Roles'), prod = productionInfo(text, kind === 'building');
  const weapons = parseWeapons(text, rows), skills = parseSkill(text, rows), asset = assetLine(path.join(dir, 'assets.md'));
  const refs = ['weapons.default_resolution', 'skills.default_lifecycle', ref('armor', f.armor), ref('sensing', f.sensing), ref('collision', f.collision)];
  const bases = f.targetability.split(/\s+/).filter(Boolean).map(x => ref('targetability', x));
  const locomotors = f.locomotor.split(/\s+/).filter(Boolean).map(x => ref('locomotor', x));
  refs.push(...bases, ...locomotors, ...weapons.flatMap(w => [w.damage, ...w.domains]).filter(Boolean));
  if (prod.facility) refs.push(prod.facility); refs.push(...prod.prereqs);
  const design = {
    tactical_identity: roles,
    player_decision: bullet(text, 'Player experience'),
    counterplay: bullet(text, 'Counterplay'),
    offense_behavior: bullet(text, 'Offense'), defense_behavior: bullet(text, 'Defense'), support_behavior: bullet(text, 'Support'),
    locomotion_behavior: bullet(text, 'Locomotion'), targetability_behavior: bullet(text, 'Targetability'),
    production_behavior: bullet(text, 'Production'), economy_behavior: section(text, 'Economy'),
    acquisition_behavior: section(text, 'Acquisition and lock semantics'), lock_behavior: section(text, 'Acquisition and lock semantics'),
    design_rationale: [section(text, 'Combat and abilities').replace(/\|[^\n]+\|/g, '').replace(/\n+/g, ' '), ...weapons.map(w => w.source), ...skills.map(s => s.source)].filter(Boolean).join(' ')
  };
  const presentation = { fallback_policy: 'inherit', silhouette: asset, readability: 'Icon, selection, health/damage, construction or deployment, operational, disabled, and destruction states follow the global presentation contract.' };
  const audio = { identity: asset };
  const fx = { identity: asset };
  const data = { display_name: title, description: `${title} Directorate ${kind} card.`, status: f.status, faction: 'factions.directorate', platform: category === 'buildings' ? slug(f.platform) : category, tier: f.tier, battlefield_roles: kind === 'unit' ? roles.split(';').map(x => slug(x.replace(/\b(primary|secondary)\b/g, ''))).filter(Boolean) : undefined, building_roles: kind === 'building' ? roleNames(bullet(text, 'Role')) : undefined, hpmax: stats.hpmax, armor: ref('armor', f.armor), locomotor: kind === 'building' ? 'not_applicable' : ref('locomotor', f.locomotor), targetability: bases, sensing: ref('sensing', f.sensing), collision: ref('collision', f.collision), movespeed: stats.movespeed, visionrange: stats.vision, alertrange: stats.alert, acquisitiondelay_ticks: stats.acquire, footprint: { radius_cells: stats.radius, width_cells: stats.width, height_cells: stats.height }, references: [...new Set(refs.filter(Boolean))], presentation, audio, fx, design };
  if (kind === 'unit') {
    data.production = { producer: prod.facility || 'factions.directorate.buildings.construction_yard', queue: 'default_queue', category: prod.category || category, cost: { resource: prod.cost }, buildtime: prod.buildtime, capacity: { max_active: prod.max } };
    data.weapon_mounts = weapons.map(w => ({ weapon: 'weapons.default_resolution', mount_name: w.name, damage: w.damage || undefined, targetability: w.domains, attackrange: w.range, attackdamage: w.damageAmount, attackperiod: w.period, delivery: slug(w.delivery), design: { tactical_use: w.source, counterplay: bullet(text, 'Counterplay') } }));
    data.skill_bindings = skills.map(s => ({ skill: 'skills.default_lifecycle', skill_name: s.name, activation: 'active', setup_ticks: s.setup, active_ticks: s.active, recovery_ticks: s.recovery, cooldown_ticks: s.cooldown, targetrange: s.targetrange, movement_allowed: !/movement disabled|prevents movement/i.test(s.source), design: { player_decision: bullet(text, 'Player experience'), counterplay: bullet(text, 'Counterplay'), interruption_readability: s.source } }));
  } else {
    data.construction = { cost: { resource: prod.cost }, buildtime: prod.buildtime, builder: prod.facility || 'factions.directorate.buildings.construction_yard', prerequisites: prod.prereqs.map(object => ({ object, state: 'operational' })) };
    data.placement = { terrain: 'ground', anchor: 'construction_anchor', route_exclusion: true, objective_exclusion: true, facing: 'cardinal' };
    data.production = { max_operational: prod.max, replacement_allowed: /replacement is allowed|may replace|replacement/.test(prod.capacity), replacement_scope: 'per_player', replacement_competes_with_new: false };
    data.weapon_mounts = weapons.map(w => ({ weapon: 'weapons.default_resolution', mount_name: w.name, damage: w.damage || undefined, targetability: w.domains, attackrange: w.range, attackdamage: w.damageAmount, attackperiod: w.period, delivery: slug(w.delivery) }));
    data.skill_bindings = skills.map(s => ({ skill: 'skills.default_lifecycle', skill_name: s.name, activation: 'active', setup_ticks: s.setup, active_ticks: s.active, recovery_ticks: s.recovery, cooldown_ticks: s.cooldown, design: { player_decision: bullet(text, 'Player decision'), counterplay: bullet(text, 'Counterplay'), interruption_readability: s.source } }));
  }
  return { file: `${category}/${yamlId(name)}.yml`, content: yaml(data) + '\n' };
}

function faction() {
  const assets = norm((read(path.join(sourceRoot, 'assets.md')).match(/## Visual language\n([\s\S]*?)\n##/ ) || ['', ''])[1]);
  const identity = norm(read(path.join(sourceRoot, 'identity.md')).replace(/^#[^\n]*\n/, ''));
  const doctrine = norm(read(path.join(sourceRoot, 'doctrine.md')).replace(/^#[^\n]*\n/, ''));
  const background = norm(read(path.join(sourceRoot, 'background.md')).replace(/^#[^\n]*\n/, ''));
  const audioText = norm((read(path.join(sourceRoot, 'assets.md')).match(/## Audio, FX, animation\n([\s\S]*?)\n##/) || ['', ''])[1]);
  return { file: '../directorate.yml', content: yaml({ display_name: 'Directorate', description: 'Emergency government of security ministries, central industrial boards, and loyal garrisons; it prevents warlords from seizing strategic weapons while suppressing dissent and treating autonomy as a threat.', status: 'core', playable: true, presentation: { visual_identity: identity, palette: assets, materials: assets, silhouette_language: assets, placeholder_asset: 'iron-block' }, audio: { voice_language: audioText, identity: audioText, order_style: 'Orders are concise and procedural.', event_language: audioText }, fx: { identity: audioText, material_language: assets, event_language: audioText }, design: { strategic_idea: doctrine, battlefield_habits: ['Protect the repair and command core before extending the front.', 'Use armor and prepared positions to convert time into pressure.', 'Advance in phases: screen, fix, break, then occupy.', 'Treat exposed flanks and disconnected support as the price of mass.', 'Force the opponent to spend mobility answering a slow but credible threat.'], production_philosophy: doctrine, economy_identity: doctrine, matchup_expression: doctrine, player_decision: doctrine, counterplay: doctrine, narrative_identity: background, scope: 'near_term' } }) + '\n' };
}

const files = [faction()];
for (const category of categories) for (const entry of fs.readdirSync(path.join(sourceRoot, sourceCategory(category))).sort()) if (fs.existsSync(path.join(sourceRoot, sourceCategory(category), entry, `${entry}.md`))) files.push(entity(category, entry));
let patch = '*** Begin Patch\n';
for (const file of files) {
  const target = path.join(outRoot, file.file).replaceAll('\\', '/');
  patch += `*** Add File: ${target}\n` + file.content.split('\n').map(line => `+${line}`).join('\n') + '\n';
}
patch += '*** End Patch\n';
process.stdout.write(patch);
