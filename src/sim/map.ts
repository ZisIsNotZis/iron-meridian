import type { Point, ResourceNode } from "./types.ts";

export const WIDTH = 64;
export const HEIGHT = 40;
export const OBJECTIVE = { x: 32, y: 20, capture_radius_cells: 4, no_build_radius_cells: 8 };
export const SPAWNS = {
  west: { hq: { x: 5.5, y: 19.5 }, processor: { x: 9, y: 19 }, assembly: { x: 9, y: 22 }, mcv: { x: 11.5, y: 22.5 }, harvester: { x: 10.5, y: 17.5 }, scout: { x: 13.5, y: 18.5 }, infantry: { x: 13.5, y: 19.5 }, tank: { x: 13.5, y: 20.5 }, "anti-tank": { x: 14.5, y: 19.5 } },
  east: { hq: { x: 58.5, y: 19.5 }, processor: { x: 55, y: 19 }, assembly: { x: 55, y: 22 }, mcv: { x: 52.5, y: 22.5 }, harvester: { x: 53.5, y: 17.5 }, scout: { x: 50.5, y: 18.5 }, infantry: { x: 50.5, y: 19.5 }, tank: { x: 50.5, y: 20.5 }, "anti-tank": { x: 49.5, y: 19.5 } },
} as const;
export function reflect(x: number): number { return WIDTH - x; }
export function distance(a: Point, b: Point): number { return Math.hypot(a.x - b.x, a.y - b.y); }
export function cell(x: number, y: number): { x: number; y: number } { return { x: Math.max(0, Math.min(WIDTH - 1, Math.floor(x))), y: Math.max(0, Math.min(HEIGHT - 1, Math.floor(y))) }; }
export function isBuildable(x: number, y: number, nodes: ResourceNode[], occupied: Point[] = []): boolean { const c = cell(x, y); if (c.x === 0 || c.x === WIDTH - 1 || c.y === 0 || c.y === HEIGHT - 1) return false; if (distance(c, OBJECTIVE) < OBJECTIVE.no_build_radius_cells) return false; if (c.y <= 10 || (c.y >= 18 && c.y <= 21) || (c.y >= 29 && c.y <= 31)) return false; if (nodes.some(n => distance(c, n) < 2)) return false; return !occupied.some(p => p.x === c.x && p.y === c.y); }
