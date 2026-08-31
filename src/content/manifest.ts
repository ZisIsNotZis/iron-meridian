import fs from "node:fs";
import path from "node:path";
import { parseYaml, YamlContentError } from "./yaml.ts";

export type ContentId = string;
export type Point = readonly [number, number];
export type ManifestSide = "west" | "east";
export type Controller = "human" | "scripted_finite_state";

export type ContentDefinition = { id: ContentId; path: string; data: Record<string, unknown> };
export type FactionManifest = ContentDefinition & { displayName: string; playable: boolean };
export type MapManifest = ContentDefinition & {
  displayName: string;
  width: number;
  height: number;
  objective: { point: Point; captureRadiusCells: number; noBuildRadiusCells: number };
  resourceNodes: { point: Point; reserve: number }[];
};
export type ScenarioSpawn = {
  key: string;
  contentId: ContentId;
  westPosition: Point;
  eastPosition: Point;
  creationOrder: number;
};
export type ScenarioManifest = ContentDefinition & {
  displayName: string;
  version: number;
  seed: bigint;
  mapId: ContentId;
  factions: { slot: string; factionId: ContentId; side: ManifestSide; controller: Controller }[];
  startingResources: { banked: number; reserved: number };
  spawns: ScenarioSpawn[];
  entityIds: ContentId[];
  recipeIds: ContentId[];
  playerExposedRecipeIds: ContentId[];
  objectiveHoldSeconds: number;
};
export type ContentManifest = { scenario: ScenarioManifest; faction: FactionManifest; map: MapManifest };

export function manifestFromParsed(data: { scenario: Record<string, unknown>; faction: Record<string, unknown>; map: Record<string, unknown> }): ContentManifest {
  const root = "/browser-content";
  const scenarioData = data.scenario;
  const mapData = data.map;
  const factionData = data.faction;
  const scenarioPath = "scenarios/v1_meridian_crossing.yml";
  const mapPath = "maps/meridian_crossing.yml";
  const factionPath = "factions/coalition.yml";
  const scenarioId = "scenarios.v1_meridian_crossing";
  const mapId = "maps.meridian_crossing";
  const factionId = "factions.coalition";
  const scenarioObject = object(scenarioData, scenarioPath);
  const mapObject = object(mapData, mapPath);
  const factionObject = object(factionData, factionPath);
  const dimensions = object(value(mapObject, "dimensions", mapPath), `${mapPath}.dimensions`);
  const anchors = object(value(mapObject, "anchors", mapPath), `${mapPath}.anchors`);
  const central = array(anchors, "central", `${mapPath}.anchors`);
  const objectiveItem = central.find(item => object(item, "anchor").id === "objective");
  const contestedItem = central.find(item => object(item, "anchor").id === "contested_resource_node");
  const homeItem = array(anchors, "player", `${mapPath}.anchors`).find(item => object(item, "anchor").id === "home_resource_node");
  if (!objectiveItem || !contestedItem || !homeItem) throw new YamlContentError("V1 map is missing objective/resource anchors");
  const objective = object(objectiveItem, "objective");
  const contested = object(contestedItem, "contested_resource_node");
  const home = object(homeItem, "home_resource_node");
  const west = anchorPoint(value(home, "west", "home_resource_node"), "home_resource_node.west");
  const east = anchorPoint(value(home, "east", "home_resource_node"), "home_resource_node.east");
  const resourceNodes = [
    { point: west, reserve: integer(home, "reserve", "home_resource_node") },
    { point: east, reserve: integer(home, "reserve", "home_resource_node") },
    { point: point(value(contested, "point", "contested_resource_node"), "contested_resource_node.point"), reserve: integer(contested, "reserve", "contested_resource_node") },
  ];
  const slots = array(scenarioObject, "faction_slots", scenarioPath).map(item => {
    const slot = object(item, "faction_slot");
    return { slot: string(slot, "slot", "faction_slot"), factionId, side: string(slot, "side", "faction_slot") as ManifestSide, controller: string(slot, "controller", "faction_slot") as Controller };
  });
  const setup = object(value(scenarioObject, "setup", scenarioPath), `${scenarioPath}.setup`);
  const spawnRecords = array(setup, "spawns", `${scenarioPath}.setup`).map(item => {
    const spawn = object(item, "spawn");
    return { key: string(spawn, "spawn_key", "spawn"), contentId: id(value(spawn, "content", "spawn"), "spawn.content"), westPosition: point(value(spawn, "west_position", "spawn"), "spawn.west_position"), eastPosition: point(value(spawn, "east_position", "spawn"), "spawn.east_position"), creationOrder: integer(spawn, "creation_order", "spawn") };
  });
  const availability = object(value(scenarioObject, "availability", scenarioPath), `${scenarioPath}.availability`);
  const rules = object(value(scenarioObject, "rules", scenarioPath), `${scenarioPath}.rules`);
  return {
    scenario: { id: scenarioId, path: scenarioPath, data: scenarioData, displayName: string(scenarioObject, "display_name", scenarioPath), version: integer(scenarioObject, "version", scenarioPath), seed: BigInt(string(scenarioObject, "seed", scenarioPath)), mapId, factions: slots, startingResources: { banked: integer(setup, "banked_resource_per_slot", `${scenarioPath}.setup`), reserved: integer(setup, "reserved_resource_per_slot", `${scenarioPath}.setup`) }, spawns: spawnRecords, entityIds: contentIdList(availability, "entities", `${scenarioPath}.availability`, ""), recipeIds: contentIdList(availability, "recipes", `${scenarioPath}.availability`, "recipes"), playerExposedRecipeIds: contentIdList(availability, "player_exposed_recipes", `${scenarioPath}.availability`, "recipes"), objectiveHoldSeconds: integer(rules, "objective_hold_seconds", `${scenarioPath}.rules`) },
    faction: { id: factionId, path: factionPath, data: factionData, displayName: string(factionObject, "display_name", factionPath), playable: factionObject.playable === true },
    map: { id: mapId, path: mapPath, data: mapData, displayName: string(mapObject, "display_name", mapPath), width: integer(dimensions, "width", `${mapPath}.dimensions`), height: integer(dimensions, "height", `${mapPath}.dimensions`), objective: { point: point(value(objective, "point", "objective"), "objective.point"), captureRadiusCells: number(objective, "capture_radius_cells", "objective"), noBuildRadiusCells: number(objective, "no_build_radius_cells", "objective") }, resourceNodes },
  };
}

const ID = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
const SIDE = new Set<ManifestSide>(["west", "east"]);
const CONTROLLERS = new Set<Controller>(["human", "scripted_finite_state"]);

function object(value: unknown, at: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new YamlContentError(`${at} must be a mapping`);
  return value as Record<string, unknown>;
}
function value(data: Record<string, unknown>, key: string, at: string): unknown {
  if (!(key in data)) throw new YamlContentError(`${at}.${key} is required`);
  return data[key];
}
function string(data: Record<string, unknown>, key: string, at: string): string {
  const result = value(data, key, at);
  if (typeof result !== "string" || !result.trim()) throw new YamlContentError(`${at}.${key} must be a non-empty string`);
  return result;
}
function number(data: Record<string, unknown>, key: string, at: string): number {
  const result = value(data, key, at);
  if (typeof result !== "number" || !Number.isFinite(result)) throw new YamlContentError(`${at}.${key} must be a finite number`);
  return result;
}
function integer(data: Record<string, unknown>, key: string, at: string): number {
  const result = number(data, key, at);
  if (!Number.isInteger(result)) throw new YamlContentError(`${at}.${key} must be an integer`);
  return result;
}
function array(data: Record<string, unknown>, key: string, at: string): unknown[] {
  const result = value(data, key, at);
  if (!Array.isArray(result)) throw new YamlContentError(`${at}.${key} must be an array`);
  return result;
}
function id(valueToCheck: unknown, at: string, prefix?: string): string {
  if (typeof valueToCheck !== "string" || !ID.test(valueToCheck) || (prefix && !valueToCheck.startsWith(`${prefix}.`))) throw new YamlContentError(`${at} must be a dotted content ID${prefix ? ` under ${prefix}` : ""}`);
  return valueToCheck;
}
function point(valueToCheck: unknown, at: string): Point {
  if (!Array.isArray(valueToCheck) || valueToCheck.length !== 2 || valueToCheck.some(item => typeof item !== "number" || !Number.isFinite(item))) throw new YamlContentError(`${at} must be a numeric [x, y] point`);
  return [valueToCheck[0] as number, valueToCheck[1] as number];
}
function anchorPoint(anchor: unknown, at: string): Point {
  const data = object(anchor, at);
  return point(value(data, "point", at), `${at}.point`);
}
function definition(file: string, root: string): ContentDefinition {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  if (relative.startsWith("../") || relative.includes("/docs/")) throw new YamlContentError(`${relative}: runtime content must be inside content root and outside docs`);
  const withoutExtension = relative.replace(/\.(?:yml|yaml)$/, "");
  const id = withoutExtension.split("/").join(".");
  if (!ID.test(id)) throw new YamlContentError(`${relative}: cannot derive a valid content ID`);
  return { id, path: relative, data: parseYaml(fs.readFileSync(file, "utf8"), relative) as unknown as Record<string, unknown> };
}
function resolve(root: string, contentId: string): string {
  const file = path.join(root, ...contentId.split(".")) + ".yml";
  if (!fs.existsSync(file) || file.split(path.sep).includes("docs")) throw new YamlContentError(`${contentId}: referenced runtime content file does not exist`);
  return file;
}
function contentIdList(data: Record<string, unknown>, key: string, at: string, prefix?: string): string[] {
  return array(data, key, at).map((item, index) => id(item, `${at}.${key}[${index}]`, prefix));
}

function loadFaction(root: string, factionId: string): FactionManifest {
  const definitionValue = definition(resolve(root, factionId), root);
  const data = definitionValue.data;
  return { ...definitionValue, displayName: string(data, "display_name", definitionValue.path), playable: data.playable === true };
}

function loadMap(root: string, mapId: string): MapManifest {
  const definitionValue = definition(resolve(root, mapId), root);
  const data = definitionValue.data;
  const dimensions = object(value(data, "dimensions", definitionValue.path), `${definitionValue.path}.dimensions`);
  const anchors = object(value(data, "anchors", definitionValue.path), `${definitionValue.path}.anchors`);
  const player = array(anchors, "player", `${definitionValue.path}.anchors`);
  const central = array(anchors, "central", `${definitionValue.path}.anchors`);
  const objectiveItem = central.find(item => object(item, "anchor").id === "objective");
  if (!objectiveItem) throw new YamlContentError(`${definitionValue.path}: objective anchor is required`);
  const objective = object(objectiveItem, `${definitionValue.path}.anchors.central.objective`);
  const contestedResource = central.find(item => object(item, "anchor").id === "contested_resource_node");
  if (!contestedResource) throw new YamlContentError(`${definitionValue.path}: contested resource anchor is required`);
  const contested = object(contestedResource, `${definitionValue.path}.anchors.central.contested_resource_node`);
  const resourceNodes = [{
    point: point(value(contested, "point", "contested resource anchor"), `${definitionValue.path}.anchors.central.contested_resource_node.point`),
    reserve: integer(contested, "reserve", "contested resource anchor"),
  }];
  const resourceAnchors = player.filter(item => object(item, "anchor").id === "home_resource_node");
  const homeResource = resourceAnchors[0];
  if (!homeResource) throw new YamlContentError(`${definitionValue.path}: home resource anchor is required`);
  const home = object(homeResource, "home resource anchor");
  const homeWest = anchorPoint(value(home, "west", "home resource anchor"), "home resource anchor.west");
  const homeEast = anchorPoint(value(home, "east", "home resource anchor"), "home resource anchor.east");
  const homeReserve = integer(home, "reserve", "home resource anchor");
  resourceNodes.unshift({ point: homeWest, reserve: homeReserve }, { point: homeEast, reserve: homeReserve });
  return {
    ...definitionValue,
    displayName: string(data, "display_name", definitionValue.path),
    width: integer(dimensions, "width", `${definitionValue.path}.dimensions`),
    height: integer(dimensions, "height", `${definitionValue.path}.dimensions`),
    objective: {
      point: point(value(objective, "point", "objective"), `${definitionValue.path}.objective.point`),
      captureRadiusCells: number(objective, "capture_radius_cells", "objective"),
      noBuildRadiusCells: number(objective, "no_build_radius_cells", "objective"),
    },
    resourceNodes,
  };
}

function loadScenario(root: string, scenarioPath: string): ScenarioManifest {
  const definitionValue = definition(scenarioPath, root);
  const data = definitionValue.data;
  const version = integer(data, "version", definitionValue.path);
  if (version !== 1) throw new YamlContentError(`${definitionValue.path}.version must be 1`);
  const mapId = id(value(data, "map", definitionValue.path), `${definitionValue.path}.map`, "maps");
  const slots = array(data, "faction_slots", definitionValue.path).map((item, index) => {
    const slot = object(item, `${definitionValue.path}.faction_slots[${index}]`);
    const side = string(slot, "side", "faction slot") as ManifestSide;
    const controller = string(slot, "controller", "faction slot") as Controller;
    if (!SIDE.has(side)) throw new YamlContentError(`${definitionValue.path}.faction_slots[${index}].side is invalid`);
    if (!CONTROLLERS.has(controller)) throw new YamlContentError(`${definitionValue.path}.faction_slots[${index}].controller is invalid`);
    return { slot: string(slot, "slot", "faction slot"), factionId: id(value(slot, "faction", "faction slot"), "faction slot.faction", "factions"), side, controller };
  });
  if (slots.length < 2 || new Set(slots.map(slot => slot.side)).size !== 2) throw new YamlContentError(`${definitionValue.path}.faction_slots must contain west and east`);
  const setup = object(value(data, "setup", definitionValue.path), `${definitionValue.path}.setup`);
  const spawns = array(setup, "spawns", `${definitionValue.path}.setup`).map((item, index) => {
    const spawn = object(item, `${definitionValue.path}.setup.spawns[${index}]`);
    return {
      key: string(spawn, "spawn_key", "spawn"),
      contentId: id(value(spawn, "content", "spawn"), "spawn.content"),
      westPosition: point(value(spawn, "west_position", "spawn"), "spawn.west_position"),
      eastPosition: point(value(spawn, "east_position", "spawn"), "spawn.east_position"),
      creationOrder: integer(spawn, "creation_order", "spawn"),
    };
  });
  if (!spawns.length || new Set(spawns.map(spawn => spawn.key)).size !== spawns.length) throw new YamlContentError(`${definitionValue.path}.setup.spawns must have unique keys`);
  const availability = object(value(data, "availability", definitionValue.path), `${definitionValue.path}.availability`);
  const rules = object(value(data, "rules", definitionValue.path), `${definitionValue.path}.rules`);
  const factionIds = slots.map(slot => slot.factionId);
  if (new Set(factionIds).size !== 1) throw new YamlContentError(`${definitionValue.path}: V1 requires one selected faction`);
  const seedText = string(data, "seed", definitionValue.path);
  if (!/^0x[0-9a-f]+$/i.test(seedText)) throw new YamlContentError(`${definitionValue.path}.seed must be hexadecimal`);
  return {
    ...definitionValue,
    displayName: string(data, "display_name", definitionValue.path),
    version,
    seed: BigInt(seedText),
    mapId,
    factions: slots,
    startingResources: { banked: integer(setup, "banked_resource_per_slot", `${definitionValue.path}.setup`), reserved: integer(setup, "reserved_resource_per_slot", `${definitionValue.path}.setup`) },
    spawns,
    entityIds: contentIdList(availability, "entities", `${definitionValue.path}.availability`, ""),
    recipeIds: contentIdList(availability, "recipes", `${definitionValue.path}.availability`, "recipes"),
    playerExposedRecipeIds: contentIdList(availability, "player_exposed_recipes", `${definitionValue.path}.availability`, "recipes"),
    objectiveHoldSeconds: integer(rules, "objective_hold_seconds", `${definitionValue.path}.rules`),
  };
}

export function loadV1Manifest(contentRoot = path.resolve(process.cwd(), "design/content")): ContentManifest {
  const root = path.resolve(contentRoot);
  const scenario = loadScenario(root, path.join(root, "scenarios/v1_meridian_crossing.yml"));
  const faction = loadFaction(root, scenario.factions[0].factionId);
  const map = loadMap(root, scenario.mapId);
  if (!faction.playable) throw new YamlContentError(`${faction.path}: selected faction must be playable`);
  if (map.width !== 64 || map.height !== 40) throw new YamlContentError(`${map.path}: V1 map must be 64x40`);
  if (map.resourceNodes.length !== 3) throw new YamlContentError(`${map.path}: V1 map must define three resource nodes`);
  if (scenario.spawns.some(spawn => !scenario.entityIds.includes(spawn.contentId))) throw new YamlContentError(`${scenario.path}: every spawn must be available in the scenario`);
  for (const contentId of [...scenario.entityIds, ...scenario.recipeIds, ...scenario.playerExposedRecipeIds]) resolve(root, contentId);
  return { scenario, faction, map };
}
