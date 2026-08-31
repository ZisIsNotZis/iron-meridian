#!/usr/bin/env node
/* Phase 1 content checker. Deliberately supports the small, strict YAML subset
 * used by authored content; add a dependency only when this ceiling is reached. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(process.argv.includes('--root') ? process.argv[process.argv.indexOf('--root') + 1] : '.');
const CONTENT = path.join(ROOT, 'design', 'content');
const ALIASES = new Set(['maxHp', 'max_health', 'health_max', 'maxHealth', 'attackPeriod', 'buildTime']);
const ID = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
const SEGMENT = /^[a-z][a-z0-9_]*$/;
const KEY = /^\$?[A-Za-z_][A-Za-z0-9_-]*$/;
const STATUS = new Set(['core', 'designed', 'optional', 'near-term', 'deferred', 'deprecated']);
const SPECIAL = new Set(['none', 'inherit', 'unavailable', 'not_applicable', 'deferred']);
const EXTENSIONS = {
  icon: ['.svg', '.webp', '.png'], texture: ['.webp', '.png'], model: ['.glb'],
  animation: ['.json', '.webp', '.png'], audio: ['.ogg', '.mp3'], fx: ['.json'], ui: ['.svg', '.webp', '.png']
};
const VALUE_PATH = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/;
const REFERENCE_CANDIDATE = /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/;
const EXPECTED_ROOTS = {
  armor: 'armors', locomotor: 'locomotors', targetability: 'targetabilities',
  targetabilities: 'targetabilities', sensing: 'sensing', collision: 'collisions',
  production: 'production', damage: 'damages', status_effect: 'statuses',
  map: 'maps', availability: 'scenarios', faction: 'factions',
  weapons: 'weapons', skills: 'skills', resolution: 'weapons', asset: 'assets'
};
const EXPECTED_FAMILIES = {
  armors: 'profile', damages: 'profile', locomotors: 'profile',
  targetabilities: 'profile', collisions: 'profile', sensing: 'profile',
  skills: 'profile', statuses: 'profile', weapons: 'profile',
  production: 'profile', recipes: 'profile', maps: 'map',
  scenarios: 'scenario', assets: 'asset', factions: 'faction',
  buildings: 'building', infantry: 'unit', vehicles: 'unit',
  aircraft: 'unit', naval: 'unit', neutral: 'unit'
};

function fail(message) { throw new Error(message); }
function stripComment(s) { let quote = ''; for (let i = 0; i < s.length; i++) { if ((s[i] === '"' || s[i] === "'") && (!i || s[i - 1] !== '\\')) quote = quote === s[i] ? '' : (quote || s[i]); if (s[i] === '#' && !quote && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i).trimEnd(); } return s; }
function scalar(s, file, line) {
  s = s.trim(); if (!s) return {};
  if (s === 'null' || s === '~') return null;
  if (s === 'true') return true; if (s === 'false') return false;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(s)) return Number(s);
  if ((s[0] === '"' && s.at(-1) === '"') || (s[0] === "'" && s.at(-1) === "'")) return s.slice(1, -1).replaceAll('\\"', '"');
  if (s.startsWith('[') && s.endsWith(']')) return splitFlow(s.slice(1, -1)).map(x => scalar(x, file, line));
  if (s.startsWith('{') && s.endsWith('}')) { const out = {}; let last = ''; for (const item of splitFlow(s.slice(1, -1))) { const i = item.indexOf(':'); if (i < 1) { if (!last) fail(`${file}:${line}: invalid flow mapping`); out[last] = `${out[last]}, ${item.trim()}`; continue; } const k = item.slice(0, i).trim(); if (k in out) fail(`${file}:${line}: duplicate key ${k}`); out[k] = scalar(item.slice(i + 1), file, line); last = k; } return out; }
  return s;
}
function splitFlow(s) { const out = []; let start = 0, depth = 0, quote = ''; for (let i = 0; i < s.length; i++) { const c = s[i]; if ((c === '"' || c === "'") && (!i || s[i - 1] !== '\\')) quote = quote === c ? '' : (quote || c); if (quote) continue; if ('[{'.includes(c)) depth++; if (']}'.includes(c)) depth--; if (c === ',' && depth === 0) { out.push(s.slice(start, i).trim()); start = i + 1; } } if (s.slice(start).trim()) out.push(s.slice(start).trim()); return out; }
function parseYaml(text, file) {
  const rows = text.split(/\r?\n/).map((raw, n) => ({ n: n + 1, indent: raw.match(/^ */)[0].length, text: stripComment(raw).trim() })).filter(x => x.text);
  if (!rows.length || rows[0].indent !== 0 || rows[0].text.startsWith('-')) fail(`${file}: root must be a mapping`);
  function block(at, indent) {
    if (at >= rows.length || rows[at].indent < indent) return [{}, at];
    const list = rows[at].text.startsWith('- '); const out = list ? [] : {};
    while (at < rows.length && rows[at].indent === indent) {
      const row = rows[at];
      if (list) {
        if (!row.text.startsWith('- ')) break;
        const rest = row.text.slice(2).trim();
        if (!rest) { const [v, next] = block(at + 1, indent + 2); out.push(v); at = next; continue; }
        const i = rest.indexOf(':');
        if (rest.startsWith('[') || rest.startsWith('{')) { out.push(scalar(rest, file, row.n)); at++; continue; }
        if (i > 0) {
          const obj = {};
          const k = rest.slice(0, i).trim();
          const first = rest.slice(i + 1).trim();
          if (first) { obj[k] = scalar(first, file, row.n); at++; }
          else { const [v, next] = block(at + 1, indent + 2); obj[k] = v; at = next; }
          const [extra, next] = block(at, indent + 2);
          if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
            for (const [extraKey, extraValue] of Object.entries(extra)) {
              if (extraKey in obj) fail(`${file}:${row.n}: duplicate key ${extraKey}`);
              obj[extraKey] = extraValue;
            }
            at = next;
          }
          out.push(obj); continue;
        }
        out.push(scalar(rest, file, row.n)); at++; continue;
      }
      const i = row.text.indexOf(':'); if (i < 1) fail(`${file}:${row.n}: expected mapping key`); const key = row.text.slice(0, i).trim(); if (!KEY.test(key)) fail(`${file}:${row.n}: invalid key ${key}`); if (key in out) fail(`${file}:${row.n}: duplicate key ${key}`); const rest = row.text.slice(i + 1).trim(); if (rest) { out[key] = scalar(rest, file, row.n); at++; } else { const [v, next] = block(at + 1, indent + 2); out[key] = v; at = next; }
    }
    return [out, at];
  }
  const [value, at] = block(0, 0); if (at !== rows.length) fail(`${file}:${rows[at].n}: unparsed YAML`); return value;
}
function walkFiles(dir, suffix) { if (!fs.existsSync(dir)) return []; const out = []; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) out.push(...walkFiles(p, suffix)); else if (!suffix || e.name.endsWith(suffix)) out.push(p); } return out; }
function validateSchema(value, schema, at, file, schemas) {
  if (!schema) fail(`${file}:${at || '<root>'}: schema is missing`);
  const bad = message => fail(`${file}:${at || '<root>'}: ${message}`);
  if (schema.$ref) return validateSchema(value, schemas[schema.$ref.split('/').at(-1)], at, file, schemas);
  if (schema.const !== undefined && value !== schema.const) bad(`must equal ${schema.const}`);
  if (schema.enum && !schema.enum.includes(value)) bad(`must be one of ${schema.enum.join(', ')}`);
  if (schema.oneOf && !schema.oneOf.some(s => { try { validateSchema(value, s, at, file, schemas); return true; } catch { return false; } })) bad('does not match any allowed form');
  if (schema.type === 'object') { if (!value || typeof value !== 'object' || Array.isArray(value)) bad('must be an object'); for (const k of schema.required ?? []) if (!(k in value)) bad(`missing required field ${k}`); for (const [k, v] of Object.entries(value)) { if (!schema.properties?.[k]) { if (schema.additionalProperties === false) bad(`unknown field ${k}`); continue; } validateSchema(v, schema.properties[k], at ? `${at}.${k}` : k, file, schemas); } }
  else if (schema.type === 'array') { if (!Array.isArray(value)) bad('must be an array'); if (schema.minItems !== undefined && value.length < schema.minItems) bad(`requires at least ${schema.minItems} items`); if (schema.items) for (let i = 0; i < value.length; i++) validateSchema(value[i], schema.items, `${at}[${i}]`, file, schemas); }
  else if (schema.type === 'string') { if (typeof value !== 'string') bad('must be a string'); if (schema.minLength !== undefined && value.length < schema.minLength) bad(`must have length >= ${schema.minLength}`); if (schema.pattern && !(new RegExp(schema.pattern).test(value))) bad(`does not match ${schema.pattern}`); }
  else if (schema.type === 'number' || schema.type === 'integer') { if (typeof value !== 'number' || !Number.isFinite(value) || (schema.type === 'integer' && !Number.isInteger(value))) bad(`must be a ${schema.type}`); if (schema.minimum !== undefined && value < schema.minimum) bad(`must be >= ${schema.minimum}`); }
  else if (schema.type === 'boolean' && typeof value !== 'boolean') bad('must be a boolean');
}
function schemaFor(parts, registry) {
  if (parts[0] === 'docs' && parts[1] === 'collections') return 'docs_collection';
  if (parts[0] === 'docs' && parts[1] === 'global') return 'docs_global';
  if (parts[0] === 'docs' && parts[1] === 'gameplay') return 'docs_gameplay';
  if (parts[0] === 'docs' && parts[1] === 'agents') return registry.families.docs_agents;
  if (parts[0] === 'docs' && ['modding', 'multiplayer', 'persistence'].includes(parts[1])) return 'docs_platform';
  if (parts[0] === 'docs' && parts[1] === 'world') return 'docs_world';
  if (parts[0] === 'docs' && parts[1] === 'factions') return 'docs_faction';
  if (parts[0] === 'docs' && parts[1] === 'gameplay' && parts.length === 3) return 'docs_gameplay';
  if (parts[0] === 'docs' && ['agents', 'ai', 'presentation'].includes(parts[1]) && parts.length === 3) {
    return registry.families[`docs_${parts[1]}`];
  }
  if (parts[0] === 'factions') return parts.length === 2 ? registry.families.factions : parts.at(-2) === 'buildings' ? registry.families.buildings : registry.families[parts.at(-2)] ?? registry.families.units;
  if (parts[0] === 'neutral') return parts.at(-2) === 'buildings' ? registry.families.buildings : registry.families.neutral;
  return registry.families[parts[0]];
}
function allKeys(obj, prefix = '') { const out = []; for (const [k, v] of Object.entries(obj)) { const p = prefix ? `${prefix}.${k}` : k; out.push(p); if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...allKeys(v, p)); } return out; }
function rejectEmpty(value, at, file) {
  if (value === null) fail(`${file}:${at || '<root>'}: empty placeholder value is forbidden`);
  if (value === 'not_applicable') return;
  if (typeof value === 'string' && !value.trim()) fail(`${file}:${at || '<root>'}: empty placeholder string is forbidden`);
  if (Array.isArray(value)) {
    if (value.length === 0) fail(`${file}:${at || '<root>'}: empty placeholder collection is forbidden`);
    value.forEach((entry, index) => rejectEmpty(entry, `${at}[${index}]`, file));
  } else if (value && typeof value === 'object') {
    if (Object.keys(value).length === 0) fail(`${file}:${at || '<root>'}: empty placeholder mapping is forbidden`);
    for (const [key, entry] of Object.entries(value)) rejectEmpty(entry, at ? `${at}.${key}` : key, file);
  }
}
function checkObject(file, relative, objectIds, assetFiles, schemas, registry) {
  const parts = relative.split(path.sep); const leaf = parts.at(-1); const stem = leaf.slice(0, -4); if (parts[0] !== 'docs' && (!SEGMENT.test(stem) || parts.some(x => x !== leaf && !SEGMENT.test(x)))) fail(`${relative}: path segments must be lowercase underscore identifiers`);
  if (parts[0] !== 'docs' && parts.includes('units')) fail(`${relative}: redundant units path segment`);
  const id = parts.slice(0, -1).join('.').replaceAll(path.sep, '.') + '.' + stem;
  if (parts[0] !== 'docs' && !ID.test(id)) fail(`${relative}: invalid derived ID ${id}`); if (parts[0] !== 'docs' && objectIds.has(id)) fail(`${relative}: duplicate derived ID ${id}`); if (parts[0] !== 'docs') objectIds.add(id);
  const data = parseYaml(fs.readFileSync(file, 'utf8'), relative); if (!data || Array.isArray(data) || typeof data !== 'object') fail(`${relative}: root must be a mapping`); if (parts[0] !== 'docs') rejectEmpty(data, '', relative);
  for (const key of allKeys(data)) {
    if (ALIASES.has(key.split('.').at(-1))) fail(`${relative}: forbidden runtime alias ${key}; use canonical definition names`);
    if (parts[0] !== 'docs' && key.split('.').at(-1) === 'id') fail(`${relative}: authored id is forbidden; identity comes from the path`);
  }
  const family = schemaFor(parts, registry); if (!family) fail(`${relative}: no schema family for path`);
  const schema = schemas[family]; if (!schema?.properties) fail(`${relative}: schema ${family} has no properties (schema keys: ${Object.keys(schema ?? {}).join(',')})`);
  if (parts[0] === 'docs') return { id, data };
  validateSchema(data, schema, '', relative, schemas);
  const allowed = new Set(Object.keys(schema.properties));
  if (parts[0] !== 'docs' && schema.additionalProperties === false) for (const key of Object.keys(data)) if (!allowed.has(key)) fail(`${relative}: unknown field ${key} for ${family}`);
  for (const key of schema.required ?? []) if (data[key] === undefined) fail(`${relative}: missing required field ${key}`);
  for (const key of ['display_name', 'description']) if (data[key] !== undefined && (typeof data[key] !== 'string' || !data[key].trim())) fail(`${relative}: invalid ${key}`);
  if (data.status !== undefined && !STATUS.has(data.status)) fail(`${relative}: invalid status ${data.status}`);
  if (['unit', 'building'].includes(family) && (!Number.isFinite(data.hpmax) || data.hpmax <= 0)) fail(`${relative}: hpmax must be positive`);
  if (data.faction !== undefined && (!ID.test(data.faction) || !data.faction.startsWith('factions.'))) fail(`${relative}: faction must be an exact factions.* ID`);
  for (const key of ['armor', 'locomotor', 'targetability', 'faction', 'sensing', 'collision', 'production', 'product', 'producer', 'map', 'availability', 'damage', 'resolution', 'status_effect']) if (typeof data[key] === 'string' && !SPECIAL.has(data[key]) && data[key] !== 'construction' && !ID.test(data[key])) fail(`${relative}: ${key} must be an exact dotted ID or special value`);
  for (const key of ['weapons', 'skills', 'references', 'targetabilities']) if (data[key] !== undefined && (!Array.isArray(data[key]) || data[key].some(x => typeof x !== 'string' || !ID.test(x)))) fail(`${relative}: ${key} must contain exact dotted IDs`);
  if (family === 'asset') {
    const extension = path.extname(data.file);
    if (!EXTENSIONS[data.kind]?.includes(extension)) fail(`${relative}: extension ${extension} is not allowed for ${data.kind}`);
    const logical = data.file.slice(0, -extension.length).replaceAll(path.sep, '/');
    const assetIdPath = id.split('.').slice(1).join('/');
    if (logical !== `assets/${assetIdPath}`) fail(`${relative}: asset file must match its logical path assets/${assetIdPath}`);
    const asset = path.normalize(path.join(ROOT, data.file));
    if (assetFiles.has(asset)) fail(`${relative}: duplicate static asset path ${data.file}`);
    if (!fs.existsSync(asset)) fail(`${relative}: static asset does not exist: ${data.file}`);
    assetFiles.add(asset);
  }
  return { id, data };
}
function isValuePathReference(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === 2 && 'object' in value && 'path' in value;
}
function references(value, at = '', key = '') {
  const out = [];
  if (isValuePathReference(value)) {
    out.push({ kind: 'value', object: value.object, path: value.path, at, expectedRoot: expectedRoot(at) });
  } else if (typeof value === 'string' && REFERENCE_CANDIDATE.test(value) && !SPECIAL.has(value) && key !== 'path') {
    // Strings are object references. Value paths use the explicit object/path
    // form so a dotted string can never be interpreted ambiguously.
    out.push({ kind: 'object', id: value, at, expectedRoot: expectedRoot(at) });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => out.push(...references(v, `${at}[${i}]`, key)));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) out.push(...references(v, at ? `${at}.${k}` : k, k));
  }
  return out;
}
function expectedRoot(at) {
  const fields = at.replace(/\[\d+\]/g, '').split('.');
  return EXPECTED_ROOTS[fields.at(-1)];
}
function familyForId(id, registry) {
  const parts = id.split('.');
  if (parts[0] === 'factions') return parts.length === 2 ? registry.families.factions : registry.families[parts[2]];
  if (parts[0] === 'neutral') return parts[1] === 'buildings' ? registry.families.buildings : registry.families.neutral;
  return registry.families[parts[0]];
}
function valueAt(object, propertyPath) {
  let current = object;
  for (const segment of propertyPath.split('.')) {
    if (!current || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, segment)) return undefined;
    current = current[segment];
  }
  return current;
}
function validateReferenceShape(ref, ownerId, byId, registry) {
  const failAt = `${ownerId}:${ref.at}`;
  const expected = ref.expectedRoot;
  const checkExpected = id => {
    if (expected && !id.startsWith(`${expected}.`)) fail(`${failAt}: expected ${expected}.* reference, got ${id}`);
  };
  const checkObject = id => {
    if (!ID.test(id)) fail(`${failAt}: object reference must be an exact dotted ID: ${id}`);
    if (!byId.has(id)) fail(`${failAt}: unresolved object reference ${id}`);
    checkExpected(id);
    const expectedFamily = expectedFamilyFor(ref.at, registry);
    if (expectedFamily && familyForId(id, registry) !== expectedFamily) fail(`${failAt}: expected ${expectedFamily} reference, got ${id}`);
  };
  const checkValue = (objectId, propertyPath) => {
    if (typeof objectId !== 'string' || typeof propertyPath !== 'string') fail(`${failAt}: value-path reference requires string object and path fields`);
    if (!ID.test(objectId)) fail(`${failAt}: value-path object must be an exact dotted ID: ${objectId}`);
    if (!VALUE_PATH.test(propertyPath)) fail(`${failAt}: invalid value path ${propertyPath}`);
    if (!byId.has(objectId)) fail(`${failAt}: unresolved value-path object ${objectId}`);
    checkExpected(objectId);
    const expectedFamily = expectedFamilyFor(ref.at, registry);
    if (expectedFamily && familyForId(objectId, registry) !== expectedFamily) fail(`${failAt}: expected ${expectedFamily} value-path object, got ${objectId}`);
    if (valueAt(byId.get(objectId), propertyPath) === undefined) fail(`${failAt}: value path ${objectId}.${propertyPath} does not exist`);
  };
  if (ref.kind === 'value') return checkValue(ref.object, ref.path);
  if (ref.kind === 'object') return checkObject(ref.id);
}
function expectedFamilyFor(at, registry) {
  const fields = at.replace(/\[\d+\]/g, '').split('.');
  const root = EXPECTED_ROOTS[fields.at(-1)];
  return root ? EXPECTED_FAMILIES[root] : undefined;
}
function check(root = ROOT) {
  const content = path.join(root, 'design', 'content');
  const registry = path.join(root, 'design', 'schema', 'registry.yml');
  if (!fs.existsSync(registry)) fail('design/schema/registry.yml is missing');
  const registryData = parseYaml(fs.readFileSync(registry, 'utf8'), 'design/schema/registry.yml');
  if (!registryData.families || typeof registryData.families !== 'object') fail('schema registry must define families');
  const schemas = {}; for (const file of walkFiles(path.join(root, 'design/schema'), '.yml')) schemas[path.basename(file, '.yml')] = parseYaml(fs.readFileSync(file, 'utf8'), path.relative(root, file));
  for (const family of new Set(Object.values(registryData.families))) if (!schemas[family]) fail(`schema registry references missing schema ${family}`);
  if (!fs.existsSync(content)) return 0;
  const files = walkFiles(content, '.yml').map(x => path.relative(content, x));
  for (const rel of files) {
    const stem = rel.slice(0, -4);
    // A faction card owns the canonical factions/<faction>.yml path while its
    // typed objects live below factions/<faction>/. Those two paths are
    // intentionally siblings in the content model.
    const relParts = rel.split(path.sep);
    const isFactionCard = relParts.length === 2 && relParts[0] === 'factions';
    if (isFactionCard) continue;
    if (fs.existsSync(path.join(content, stem)) && fs.statSync(path.join(content, stem)).isDirectory()) fail(`${rel}: object file and same-named directory are forbidden`);
  }
  const ids = new Set(), assets = new Set(), records = [];
  for (const rel of files) records.push(checkObject(path.join(content, rel), rel, ids, assets, schemas, registryData));
  for (const r of records) { const family = schemaFor(r.id.split('.'), registryData); validateSchema(r.data, schemas[family], '', r.id, schemas); }
  const byId = new Map(records.map(r => [r.id, r.data]));
  // Faction cards are not migrated yet. This is the only unresolved-reference
  // boundary; once those cards exist, these references must resolve normally.
  const pendingFactionObject = id => /^factions\.[a-z][a-z0-9_]*$/.test(id)
    || /^factions\.[a-z][a-z0-9_]*\.(?:infantry|vehicles|aircraft|naval|buildings)\.[a-z][a-z0-9_]*$/.test(id);
  for (const r of records) for (const ref of references(r.data)) {
    if (r.id.startsWith('docs.')) continue;
    if (r.id.startsWith('docs.') && ref.kind === 'object') continue;
    if (ref.kind === 'object' && pendingFactionObject(ref.id) && !byId.has(ref.id)) continue;
    validateReferenceShape(ref, r.id, byId, registryData);
  }
  const scenario = records.find(r => r.id === 'scenarios.v1_meridian_crossing');
  const map = records.find(r => r.id === 'maps.meridian_crossing');
  if (scenario) {
    for (const id of [...(scenario.data.availability?.recipes ?? []), ...(scenario.data.availability?.player_exposed_recipes ?? [])]) if (!byId.has(id)) fail(`${scenario.id}: unresolved recipe ${id}`);
    if (scenario.data.map && !byId.has(scenario.data.map)) fail(`${scenario.id}: unresolved map ${scenario.data.map}`);
    for (const spawn of scenario.data.setup?.spawns ?? []) {
      if (spawn.content.startsWith('factions.')) continue;
      if (!byId.has(spawn.content)) fail(`${scenario.id}: unresolved spawn content ${spawn.content}`);
    }
  }
  if (map) {
    if (map.data.dimensions.width !== 64 || map.data.dimensions.height !== 40) fail(`${map.id}: V1 dimensions must be 64x40`);
    for (const entry of map.data.layers.cover_rectangles ?? []) if (entry.bounds && entry.bounds.length !== 4) fail(`${map.id}: cover rectangle ${entry.id} must be x,y,width,height`);
    for (const anchor of map.data.anchors.player ?? []) {
      const west = anchor.west.bounds ?? anchor.west.point;
      const east = anchor.east.bounds ?? anchor.east.point;
      if (!west || !east || west.length !== east.length) fail(`${map.id}: anchor ${anchor.id} west/east geometry is incomplete`);
    }
  }
  return records.length;
}
function coverage(root = ROOT) {
  const files = walkFiles(path.join(root, 'design'), '.md'); const items = files.map(file => { const relative = path.relative(root, file); const parts = relative.split(path.sep); const base = parts.at(-1).replace(/\.md$/, ''); let destination = null; let status = 'review-required'; if (base === 'README') status = 'retained-principle-or-index'; else if (parts.includes('factions')) { const i = parts.indexOf('factions'); destination = `factions.${parts.slice(i + 1, -1).filter(x => x !== 'units').join('.')}`; status = 'candidate'; } else { const rootName = ['armors','damages','locomotors','targetabilities','collisions','sensing','skills','statuses','weapons','maps','scenarios','campaign','world','production'].find(x => parts.includes(x)); if (rootName) { destination = `${rootName}.${base}`; status = 'candidate'; } } const text = fs.readFileSync(file, 'utf8'); const headings = [...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(x => x[1].trim()); return { source: relative, current_id: (text.match(/^id:\s*(.+)$/m) || [])[1] ?? null, kind: (text.match(/^kind:\s*(.+)$/m) || [])[1] ?? 'prose', candidate: destination, status, headings, tables: (text.match(/^\s*\|.*\|\s*$/gm) || []).length, numeric_tokens: (text.match(/\b(?:hp|health|damage|range|radius|speed|ticks?|resource|cost|capacity|percent|%|\d+(?:\.\d+)?)\b/gi) || []).length }; }); const unmapped = items.filter(x => !x.candidate && x.status !== 'retained-principle-or-index'); console.log(JSON.stringify({ generated_for: 'temporary coverage audit', markdown_files: items.length, unmapped: unmapped.length, items }, null, 2)); return items.length; }
function selfCheck() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ra2-content-'));
  fs.mkdirSync(path.join(dir, 'design/content/factions/coalition/infantry'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'design/schema'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'design/content/armors'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'design/content/maps'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'design/schema/registry.yml'), 'families:\n  factions: faction\n  infantry: unit\n  armors: profile\n  maps: map\n');
  fs.writeFileSync(path.join(dir, 'design/schema/faction.yml'), 'type: object\nproperties:\n  display_name: {type: string}\n  description: {type: string}\n');
  fs.writeFileSync(path.join(dir, 'design/schema/unit.yml'), 'type: object\nrequired: [display_name, description, hpmax]\nproperties:\n  display_name: {type: string}\n  description: {type: string}\n  hpmax: {type: number}\n  armor:\n    oneOf:\n      - {type: string}\n      - {type: object, additionalProperties: false, required: [object, path], properties: {object: {type: string}, path: {type: string}}}\n');
  fs.writeFileSync(path.join(dir, 'design/schema/profile.yml'), 'type: object\nrequired: [display_name, description, status, kind]\nproperties:\n  display_name: {type: string}\n  description: {type: string}\n  status: {type: string}\n  kind: {type: string}\n  profile: {type: object, properties: {name: {type: string}}}\n');
  fs.writeFileSync(path.join(dir, 'design/schema/map.yml'), 'type: object\nproperties:\n  display_name: {type: string}\n  description: {type: string}\n');
  fs.writeFileSync(path.join(dir, 'design/content/armors/personnel.yml'), 'display_name: Personnel\ndescription: Armor\nstatus: designed\nkind: armor\n');
  fs.writeFileSync(path.join(dir, 'design/content/maps/test_map.yml'), 'display_name: Test Map\ndescription: Map fixture\n');
  const good = 'display_name: Rifleman\ndescription: Line infantry\nhpmax: 100\narmor: armors.personnel\n';
  fs.writeFileSync(path.join(dir, 'design/content/factions/coalition/infantry/rifleman.yml'), good);
  if (check(dir) !== 3) fail('self-check: valid fixture rejected');
  const reject = (name, content, expected) => {
    fs.writeFileSync(path.join(dir, 'design/content/factions/coalition/infantry/bad.yml'), content);
    try { check(dir); fail(`self-check: ${name} accepted`); } catch (e) { if (!String(e).includes(expected)) throw e; }
  };
  reject('forbidden alias', 'display_name: Bad\ndescription: Bad\nhpmax: 1\nmaxHp: 2\n', 'forbidden runtime alias');
  reject('unknown field', 'display_name: Bad\ndescription: Bad\nhpmax: 1\ncomment: no\n', 'unknown field');
  reject('duplicate key', 'display_name: Bad\ndisplay_name: Again\ndescription: Bad\nhpmax: 1\n', 'duplicate key');
  fs.rmSync(path.join(dir, 'design/content/factions/coalition/infantry/bad.yml'), { force: true });
  fs.writeFileSync(path.join(dir, 'design/content/factions/coalition/infantry/value_path.yml'), 'display_name: Value Path\ndescription: Reads a nested value\nhpmax: 1\narmor: {object: armors.personnel, path: display_name}\n');
  if (check(dir) !== 4) fail('self-check: valid value-path fixture rejected');
  reject('nested value reference', 'display_name: Bad\ndescription: Bad\nhpmax: 1\narmor: {object: armors.personnel, path: missing}\n', 'value path armors.personnel.missing does not exist');
  reject('wrong reference family', 'display_name: Bad\ndescription: Bad\nhpmax: 1\narmor: maps.test_map\n', 'expected armors.* reference');
  fs.rmSync(dir, { recursive: true, force: true }); console.log('content checker self-check passed');
}
try { if (process.argv.includes('--self-check')) selfCheck(); else if (process.argv.includes('--coverage')) coverage(); else console.log(`checked ${check()} YAML content file(s)`); } catch (e) { console.error(`content check failed: ${e.message}`); process.exitCode = 1; }
