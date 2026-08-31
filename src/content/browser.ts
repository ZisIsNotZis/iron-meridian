import scenarioText from "../../design/content/scenarios/v1_meridian_crossing.yml?raw";
import mapText from "../../design/content/maps/meridian_crossing.yml?raw";
import factionText from "../../design/content/factions/coalition.yml?raw";
import { manifestFromParsed, type ContentManifest } from "./manifest.ts";
import { parseYaml } from "./yaml.ts";

export function loadBrowserV1Manifest(): ContentManifest {
  return manifestFromParsed({ scenario: parseYaml(scenarioText, "scenarios/v1_meridian_crossing.yml") as Record<string, unknown>, map: parseYaml(mapText, "maps/meridian_crossing.yml") as Record<string, unknown>, faction: parseYaml(factionText, "factions/coalition.yml") as Record<string, unknown> });
}
