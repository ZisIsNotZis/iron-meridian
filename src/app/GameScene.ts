import Phaser from "phaser";
import { createSimulationFromManifest } from "../../src/sim/index.ts";
import { stepScriptedAI } from "../../src/sim/ai.ts";
import { loadBrowserV1Manifest } from "../../src/content/browser.ts";
import type { CommandKind, EntityKind, EntityView, GameView, Point } from "../../src/sim/types.ts";

const W = 1280;
const H = 720;
const MAP = { x: 24, y: 102, width: 800, height: 500, cell: 12.5 };
const PLAYER = 1 as const;
const COLORS = { ink: 0x081014, panel: 0x101e23, panel2: 0x14272c, line: 0x2c5558, text: 0xd8e9e6, muted: 0x799496, player: 0x56d8b0, enemy: 0xef7070, objective: 0xeac56d, warning: 0xf09d62, fog: 0x0a1418 };
const MINI = { x: 660, y: 110, w: 168, h: 96 };
const HIT = 30;

// Texture key per entity kind.
const TEX: Record<EntityKind, string> = {
  hq: "building_hq", processor: "building_processor", assembly: "building_assembly", "infantry-center": "building_infantry_center",
  mcv: "unit_mcv", harvester: "unit_harvester", scout: "unit_scout", infantry: "unit_infantry", tank: "unit_tank", "anti-tank": "unit_anti_tank",
  "air-support": "unit_scout", "naval-support": "unit_tank",
};
// In-game pixel size (diameter) per kind.
const SIZE: Record<EntityKind, number> = {
  hq: 50, processor: 40, assembly: 40, "infantry-center": 28,
  mcv: 22, harvester: 20, scout: 18, infantry: 14, tank: 22, "anti-tank": 16,
  "air-support": 18, "naval-support": 20,
};

type Mode = "move" | "attack" | "construct" | null;
type FX = { id: number; kind: string; pos: Point };

export class GameScene extends Phaser.Scene {
  private manifest = loadBrowserV1Manifest();
  private sim = createSimulationFromManifest(this.manifest, undefined);
  private view = this.sim.view(PLAYER);
  private world!: Phaser.GameObjects.Graphics;
  private fxLayer!: Phaser.GameObjects.Container;
  private minimap!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Container;
  private startScreen!: Phaser.GameObjects.Container;
  private resultScreen!: Phaser.GameObjects.Container;
  private selectionText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private eventText!: Phaser.GameObjects.Text;
  private prodPanel!: Phaser.GameObjects.Container;
  private lastProducerId = -1;
  private recipes: Record<string, string[]> = {
    assembly: ["recipe.v1.lynx-scout-car", "recipe.v1.valiant-mbt", "recipe.v1.harvester", "recipe.v1.mcv"],
    "infantry-center": ["recipe.v1.line-rifle", "recipe.v1.javelin-team"],
  };
  private recipeNames: Record<string, string> = { "recipe.v1.lynx-scout-car": "SCOUT", "recipe.v1.valiant-mbt": "MBT", "recipe.v1.harvester": "HARV", "recipe.v1.mcv": "MCV", "recipe.v1.line-rifle": "RIFLE", "recipe.v1.javelin-team": "AT" };
  private recipeCost: Record<string, number> = { "recipe.v1.lynx-scout-car": 300, "recipe.v1.valiant-mbt": 750, "recipe.v1.harvester": 700, "recipe.v1.mcv": 1200, "recipe.v1.line-rifle": 100, "recipe.v1.javelin-team": 240 };
  private resourceText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private entitySprites = new Map<number, Phaser.GameObjects.Sprite>();
  private entityLabels = new Map<number, Phaser.GameObjects.Text>();
  private objectiveSprite!: Phaser.GameObjects.Image;
  private resourceSprites: Phaser.GameObjects.Image[] = [];
  private lastAng = new Map<number, number>();
  private prevPos = new Map<number, { x: number; y: number }>();
  private selected: number[] = [];
  private groups = new Map<number, number[]>();
  private mode: Mode = null;
  private paused = false;
  private started = false;
  private elapsed = 0;
  private sequence = 0;
  private lastEventId = 0;
  private notice = "Select a unit or structure.";
  private motionFriendly = false;
  private lowFlash = false;
  private motionText!: Phaser.GameObjects.Text;
  private onboarding = { move: false, produce: false, build: false };

  constructor() { super("game"); }

  preload(): void {
    const keys = ["unit_scout", "unit_infantry", "unit_tank", "unit_anti_tank", "unit_harvester", "unit_mcv", "building_hq", "building_processor", "building_assembly", "building_infantry_center", "terrain_clear", "terrain_cover", "objective_beacon", "resource_node", "fx_tracer", "fx_impact", "fx_smoke", "fx_capture", "fx_reveal", "fx_construction", "ui_order", "ui_reject", "ui_objective", "ui_status"];
    for (const key of keys) this.load.svg(key, `/assets/${key}.svg`, { width: 96, height: 96 });
  }

  create(): void {
    this.world = this.add.graphics();
    this.world.setDepth(0);
    this.minimap = this.add.graphics();
    this.minimap.setDepth(20);
    this.fxLayer = this.add.container(0, 0);
    this.fxLayer.setDepth(12);
    this.objectiveSprite = this.add.image(0, 0, "objective_beacon").setDepth(1);
    for (let i = 0; i < this.resourceNodePositions().length; i++) this.resourceSprites.push(this.add.image(0, 0, "resource_node").setDepth(1));
    this.createHud();
    this.createStartScreen();
    this.createResultScreen();
    this.createKeyboard();
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handleMapClick(pointer));
    this.render();
  }

  update(_time: number, delta: number): void {
    if (!this.started || this.paused || this.view.phase !== "running") return;
    this.elapsed += delta;
    while (this.elapsed >= 1000 / 30) {
      this.elapsed -= 1000 / 30;
      stepScriptedAI(this.sim);
      this.sim.step(1);
    }
    this.view = this.sim.view(PLAYER);
    this.render();
    this.tickFx();
  }

  // ------------------------------------------------------------------ input --
  private createKeyboard(): void {
    const kb = this.input.keyboard!;
    kb.on("keydown-SPACE", () => { if (this.started) { this.paused = !this.paused; this.notice = this.paused ? "Simulation paused." : "Simulation resumed."; this.render(); } });
    kb.on("keydown-ESC", () => { this.mode = null; this.selected = []; this.notice = "Selection cleared."; this.render(); });
    kb.on("keydown-ONE", () => this.selectGroup(1)); kb.on("keydown-TWO", () => this.selectGroup(2));
    kb.on("keydown-THREE", () => this.selectGroup(3)); kb.on("keydown-FOUR", () => this.selectGroup(4));
    kb.on("keydown-FIVE", () => this.selectGroup(5));
    const assign = (n: number) => { if (this.selected.length) { this.groups.set(n, [...this.selected]); this.notice = `Group ${n} set (${this.selected.length}).`; this.render(); } };
    kb.on("keydown-CTRL+ONE", () => assign(1)); kb.on("keydown-CTRL+TWO", () => assign(2));
    kb.on("keydown-CTRL+THREE", () => assign(3)); kb.on("keydown-CTRL+FOUR", () => assign(4));
    kb.on("keydown-CTRL+FIVE", () => assign(5));
  }
  private selectGroup(n: number): void {
    const ids = this.groups.get(n);
    if (!ids?.length) { this.notice = `Group ${n} empty.`; this.render(); return; }
    this.selected = ids.filter(id => this.view.entities.some(e => e.id === id && e.ownerId === PLAYER));
    this.notice = `Group ${n}: ${this.selected.length} unit(s).`;
    this.render();
  }

  private createStartScreen(): void {
    this.startScreen = this.add.container(0, 0).setDepth(40);
    this.startScreen.add(this.rect(0, 0, W, H, COLORS.ink));
    this.startScreen.add(this.rect(72, 64, 1136, 592, 0x0d1b20, 0x244447));
    this.startScreen.add(this.text(112, 122, "IRON MERIDIAN", 42, COLORS.text));
    this.startScreen.add(this.text(116, 177, "MERIDIAN CROSSING / FIELD COMMAND", 16, COLORS.player));
    this.startScreen.add(this.text(116, 246, "A compact real-time command exercise", 22, COLORS.text));
    this.startScreen.add(this.text(116, 290, "Hold the central relay or break the opposing headquarters.", 16, COLORS.muted));
    this.startScreen.add(this.text(116, 322, "Left-click select · order buttons then click the field · Ctrl+1-5 group · Space pause · Esc clear", 15, COLORS.muted));
    this.startScreen.add(this.text(116, 348, "Scout the approaches, protect your harvest, choose army or infrastructure, and contest the relay.", 15, COLORS.muted));
    this.startScreen.add(this.text(116, 506, "V1 // SIMULATION LINK READY", 13, COLORS.warning));
    this.startScreen.add(this.button(116, 542, 248, 54, "START MISSION", () => {
      this.started = true;
      this.startScreen.setVisible(false);
      this.hud.setVisible(true);
      this.world.setVisible(true);
      this.minimap.setVisible(true);
      this.render();
    }, COLORS.player));
  }

  private createHud(): void {
    this.hud = this.add.container(0, 0).setDepth(30).setVisible(false);
    this.hud.add(this.rect(0, 0, W, 78, COLORS.panel, COLORS.line));
    this.hud.add(this.text(24, 18, "IRON MERIDIAN", 19, COLORS.text));
    this.hud.add(this.text(24, 43, "MERIDIAN CROSSING", 11, COLORS.player));
    this.resourceText = this.text(274, 18, "", 17, COLORS.text);
    this.hud.add(this.resourceText);
    this.hud.add(this.text(274, 45, "BANKED / RESERVED", 10, COLORS.muted));
    this.objectiveText = this.text(500, 18, "", 16, COLORS.objective);
    this.hud.add(this.objectiveText);
    this.hud.add(this.text(500, 45, "CENTRAL RELAY", 10, COLORS.muted));
    this.modeText = this.text(730, 22, "", 13, COLORS.warning);
    this.hud.add(this.modeText);
    this.hud.add(this.button(1015, 14, 104, 42, "PAUSE", () => { this.paused = !this.paused; this.notice = this.paused ? "Simulation paused." : "Simulation resumed."; this.render(); }));
    this.hud.add(this.button(1128, 14, 120, 42, "RESTART", () => this.restart()));

    // Command deck
    this.hud.add(this.rect(848, 94, 408, 538, COLORS.panel, COLORS.line));
    this.hud.add(this.text(876, 120, "COMMAND DECK", 17, COLORS.text));
    this.hud.add(this.text(876, 148, "SELECTION", 10, COLORS.player));
    this.selectionText = this.text(876, 170, "", 14, COLORS.text, 370);
    this.hud.add(this.selectionText);
    this.statusText = this.text(876, 239, "", 13, COLORS.muted, 350);
    this.hud.add(this.statusText);
    this.hud.add(this.text(876, 292, "ORDERS", 10, COLORS.player));
    this.prodPanel = this.add.container(876, 248);
    this.hud.add(this.prodPanel);
    const buttons: [string, number, number, () => void][] = [
      ["MOVE", 876, 320, () => this.setMode("move")],
      ["ATTACK", 1066, 320, () => this.setMode("attack")],
      ["STOP", 876, 378, () => this.issue("stop")],
      ["HARVEST", 1066, 378, () => this.issue("harvest")],
      ["PRODUCE", 876, 436, () => this.produce()],
      ["CONSTRUCT", 1066, 436, () => this.setMode("construct")],
      ["CAPTURE", 876, 494, () => this.issue("capture")],
    ];
    for (const [label, x, y, action] of buttons) this.hud.add(this.button(x, y, 166, 42, label, action));
    // Settings toggles
    const motionBtn = this.button(1066, 494, 166, 42, "MOTION", () => { this.motionFriendly = !this.motionFriendly; this.notice = this.motionFriendly ? "Reduced motion ON." : "Reduced motion OFF."; this.render(); });
    this.motionText = (motionBtn as Phaser.GameObjects.Container).getAt(1) as Phaser.GameObjects.Text;
    this.hud.add(motionBtn);
    this.hud.add(this.text(876, 560, "FIELD LOG", 10, COLORS.player));
    this.eventText = this.text(876, 580, "", 11, COLORS.muted, 350);
    this.hud.add(this.eventText);
    this.hintText = this.text(24, 640, "", 13, COLORS.objective, 780);
    this.hud.add(this.hintText);
  }

  private createResultScreen(): void {
    this.resultScreen = this.add.container(0, 0).setDepth(50).setVisible(false);
    this.resultScreen.add(this.rect(0, 0, W, H, 0x071013, 0, 0.88));
    this.resultScreen.add(this.rect(310, 210, 660, 290, COLORS.panel, COLORS.line));
    this.resultScreen.add(this.text(368, 258, "", 42, COLORS.text).setName("resultTitle"));
    this.resultScreen.add(this.text(368, 326, "", 16, COLORS.muted).setName("resultReason"));
    this.resultScreen.add(this.button(368, 394, 190, 50, "RESTART", () => this.restart(), COLORS.player));
  }

  private restart(): void {
    this.sim = createSimulationFromManifest(this.manifest, undefined);
    this.view = this.sim.view(PLAYER);
    this.selected = []; this.mode = null; this.paused = false; this.started = true; this.sequence = 0; this.lastEventId = 0;
    this.notice = "Mission restarted."; this.onboarding = { move: false, produce: false, build: false }; this.lastProducerId = -1; this.prodPanel.removeAll(true);
    for (const [, s] of this.entitySprites) s.destroy(); this.entitySprites.clear();
    for (const [, t] of this.entityLabels) t.destroy(); this.entityLabels.clear();
    this.lastAng.clear(); this.prevPos.clear();
    this.resultScreen.setVisible(false); this.startScreen.setVisible(false); this.hud.setVisible(true);
    this.render();
  }

  // ------------------------------------------------------------- selection --
  private handleMapClick(pointer: Phaser.Input.Pointer): void {
    if (!this.started || this.paused || this.view.phase !== "running") return;
    const entity = this.entityAt(pointer.x, pointer.y);
    if (entity && !this.mode) {
      this.selected = pointer.event && (pointer.event as MouseEvent).shiftKey ? [...new Set([...this.selected, entity.id])] : [entity.id];
      this.notice = `${label(entity.kind)} #${entity.id} selected.`;
      this.render();
      return;
    }
    if (!this.mode || pointer.x < MAP.x || pointer.x > MAP.x + MAP.width || pointer.y < MAP.y || pointer.y > MAP.y + MAP.height) return;
    if (this.mode === "attack" && entity && entity.ownerId !== PLAYER) this.issue("attack", { targetId: entity.id });
    else this.issue(this.mode, { point: this.toMap(pointer.x, pointer.y) });
    this.mode = null;
    this.render();
  }

  private entityAt(x: number, y: number): EntityView | undefined {
    return [...this.view.entities].reverse().find(e => {
      const p = this.toScreen(e); return Phaser.Math.Distance.Between(x, y, p.x, p.y) < Math.max(SIZE[e.kind] / 2 + 4, 12);
    });
  }

  private setMode(mode: Mode): void {
    if (!this.selected.length) { this.notice = "Select a unit first."; this.render(); return; }
    this.mode = this.mode === mode ? null : mode;
    this.notice = this.mode ? `Click the battlefield to ${this.mode}.` : "Order cancelled.";
    this.render();
  }

  private issue(kind: CommandKind, extra: { point?: Point; targetId?: number; recipeId?: string } = {}): void {
    if (!this.selected.length) { this.notice = "Select a unit first."; return; }
    const target = kind === "harvest" ? 1 : kind === "capture" ? 1 : extra.targetId;
    const recipeId = kind === "construct" ? "recipe.v1.infantry-center" : extra.recipeId;
    const result = this.sim.submit({ playerId: PLAYER, sequence: this.sequence++, applyAtTick: this.view.tick + 1, kind, subjectIds: [...this.selected], ...extra, ...(target ? { targetId: target } : {}), ...(recipeId ? { recipeId } : {}) });
    this.notice = result.accepted ? `${kind.toUpperCase()} order queued.` : `${kind.toUpperCase()} rejected: ${result.reason}.`;
    if (result.accepted && kind === "move") this.onboarding.move = true;
    if (result.accepted && kind === "produce") this.onboarding.produce = true;
    if (result.accepted && (kind === "construct" || kind === "capture")) this.onboarding.build = true;
  }

  private produce(): void {
    if (this.selected.length !== 1) { this.notice = "Select one producer."; this.render(); return; }
    const e = this.view.entities.find(entity => entity.id === this.selected[0]);
    const recipeId = e?.kind === "assembly" ? "recipe.v1.lynx-scout-car" : e?.kind === "infantry-center" ? "recipe.v1.line-rifle" : undefined;
    if (!recipeId) { this.notice = "Select an assembly or infantry center."; this.render(); return; }
    this.issue("produce", { recipeId });
  }

  // ------------------------------------------------------------- rendering --
  private render(): void {
    if (!this.started) return;
    this.world.setVisible(true);
    this.world.clear();
    this.drawTerrain();
    this.drawMarkers();
    this.drawEntities();
    this.drawMinimap();
    this.resourceText.setText(`${this.view.resources.banked.toString().padStart(4, "0")}  /  ${this.view.resources.reserved.toString().padStart(4, "0")}`);
    const progress = this.view.objective.progress;
    const owner = this.view.objective.ownerId === 1 ? "WEST" : this.view.objective.ownerId === 2 ? "EAST" : "CONTESTED";
    this.objectiveText.setText(`${owner}  ${Math.abs(progress)}%`);
    this.modeText.setText(this.paused ? "// PAUSED" : this.mode ? `// ${this.mode.toUpperCase()} — SELECT TARGET` : `// TICK ${this.view.tick.toString().padStart(5, "0")}`);
    const chosen = this.view.entities.filter(e => this.selected.includes(e.id));
    this.selectionText.setText(chosen.length ? chosen.map(e => `${label(e.kind)} #${e.id}  ${Math.ceil(e.hp)}/${e.hpmax}`).join("\n") : "NO UNIT SELECTED");
    this.statusText.setText(this.notice);
    this.syncProductionPanel();
    this.eventText.setText(this.view.events.slice(-4).reverse().map(e => `T${e.tick.toString().padStart(4, "0")}  ${e.kind.toUpperCase()}`).join("\n") || "No events yet.");
    this.motionText.setText(this.motionFriendly ? "MOTION: ON" : "MOTION: OFF");
    this.hintText.setText(this.hint());
    if (this.view.phase !== "running") this.showResult();
  }

  private syncProductionPanel(): void {
    const producer = this.selected.length === 1 ? this.view.entities.find(e => e.id === this.selected[0]) : undefined;
    const key = producer && ((producer.kind === "assembly" || producer.kind === "infantry-center") ? producer.kind : undefined);
    if (!key || (producer && producer.id === this.lastProducerId)) return;
    this.lastProducerId = producer!.id;
    this.prodPanel.removeAll(true);
    const list = this.recipes[key];
    if (key === "assembly") this.prodPanel.add(this.text(0, -30, "PRODUCTION (Vehicle Assembly)", 10, COLORS.player));
    else this.prodPanel.add(this.text(0, -30, "PRODUCTION (Infantry Center)", 10, COLORS.player));
    list.forEach((recipeId, i) => {
      const cost = this.recipeCost[recipeId];
      const afford = this.view.resources.banked >= cost;
      const c = this.button(i * 92, 0, 90, 28, `${this.recipeNames[recipeId]} ${cost}`, () => this.issue("produce", { recipeId }), afford ? COLORS.player : COLORS.muted);
      this.prodPanel.add(c);
    });
  }
  private hint(): string {
    if (this.motionFriendly) return "";
    if (!this.onboarding.move) return "Select a unit, choose an ORDER, then click the battlefield.  [Esc to clear]";
    if (!this.onboarding.produce) return "Build your force: select an ASSEMBLY or INFANTRY CENTER and press PRODUCE.  Ctrl+1 assigns a group.";
    if (!this.onboarding.build) return "Send the MCV to CONSTRUCT an Infantry Center, or CAPTURE the relay.  Space pauses.";
    return "";
  }

  private drawTerrain(): void {
    const g = this.world;
    const cover = new Set(this.view.terrain.coverCells);
    const discovered = new Set(this.view.terrain.discoveredCells);
    g.fillStyle(COLORS.fog, 1); g.fillRect(MAP.x, MAP.y, MAP.width, MAP.height);
    // Route bands faintly tint world-space (no-build lanes read as darker corridors).
    for (let y = 0; y < this.view.terrain.height; y++) for (let x = 0; x < this.view.terrain.width; x++) {
      const idx = y * this.view.terrain.width + x;
      if (!discovered.has(idx)) continue;
      const px = MAP.x + x * MAP.cell, py = MAP.y + y * MAP.cell;
      g.fillStyle(cover.has(idx) ? 0x0c1f26 : 0x173134, 1);
      g.fillRect(px + 1, py + 1, MAP.cell - 1, MAP.cell - 1);
    }
    g.lineStyle(1, 0x24484a, 0.42);
    for (let x = 0; x <= 64; x += 4) g.lineBetween(MAP.x + x * MAP.cell, MAP.y, MAP.x + x * MAP.cell, MAP.y + MAP.height);
    for (let y = 0; y <= 40; y += 4) g.lineBetween(MAP.x, MAP.y + y * MAP.cell, MAP.x + MAP.width, MAP.y + y * MAP.cell);
    g.lineStyle(2, COLORS.line, 1); g.strokeRect(MAP.x, MAP.y, MAP.width, MAP.height);
  }

  private drawMarkers(): void {
    const g = this.world;
    const o = this.toScreen(this.view.objective);
    g.lineStyle(2, COLORS.objective, 0.9); g.strokeCircle(o.x, o.y, this.view.objective.capture_radius_cells * MAP.cell);
    g.lineStyle(1, COLORS.objective, 0.24); g.strokeCircle(o.x, o.y, this.view.objective.no_build_radius_cells * MAP.cell);
    const pulse = this.motionFriendly ? 1 : 1 + Math.sin(this.time.now / 220) * 0.08;
    g.fillStyle(COLORS.objective, 0.95); g.fillCircle(o.x, o.y, 4 * pulse);
    g.lineBetween(o.x - 11, o.y, o.x + 11, o.y); g.lineBetween(o.x, o.y - 11, o.x, o.y + 11);
    this.objectiveSprite.setPosition(o.x, o.y).setScale(52 / 96);
    const nodes = this.resourceNodePositions();
    this.resourceSprites.forEach((spr, i) => { const p = this.toScreen(nodes[i]); spr.setPosition(p.x, p.y).setScale(30 / 96); });
    g.lineStyle(1, COLORS.player, 0.5);
    for (const n of nodes) { const p = this.toScreen(n); g.strokeCircle(p.x, p.y, 8); }
  }

  private resourceNodePositions(): { x: number; y: number }[] {
    // Resource nodes are static map landmarks read from the authoritative map manifest.
    const anchors = (this.manifest.map.data as Record<string, unknown> | undefined)?.anchors as { player?: { id?: string; west?: { point?: number[] }; east?: { point?: number[] } }[]; central?: { id?: string; point?: number[] }[] } | undefined;
    const nodes: { x: number; y: number }[] = [];
    for (const a of anchors?.player ?? []) if (a.id === "home_resource_node" && a.west?.point && a.east?.point) nodes.push({ x: a.west.point[0], y: a.west.point[1] }, { x: a.east.point[0], y: a.east.point[1] });
    for (const a of anchors?.central ?? []) if (a.id === "contested_resource_node" && a.point) nodes.push({ x: a.point[0], y: a.point[1] });
    return nodes;
  }

  private drawEntities(): void {
    const seen = new Set<number>();
    for (const e of this.view.entities) {
      seen.add(e.id);
      const p = this.toScreen(e);
      let spr = this.entitySprites.get(e.id);
      if (!spr) { spr = this.add.sprite(p.x, p.y, TEX[e.kind]); spr.setOrigin(0.5); spr.setDepth(3); this.entitySprites.set(e.id, spr); }
      const size = SIZE[e.kind];
      spr.setScale(size / 96);
      spr.setPosition(p.x, p.y);
      spr.setAlpha(e.ownerId === PLAYER ? 1 : 0.92);
      spr.setTint(e.ownerId === PLAYER ? 0xffffff : 0xffb0a0);
      if (e.kind !== "hq" && e.kind !== "processor" && e.kind !== "assembly" && e.kind !== "infantry-center") this.orient(spr, e);
      // owned order markers (move destination / attack target)
      if (e.order && e.ownerId === PLAYER) this.drawOrderMarker(e);
      this.drawHealth(spr, e, p, size);
    }
    for (const [id, spr] of this.entitySprites) if (!seen.has(id)) { spr.destroy(); this.entitySprites.delete(id); }
    // stale contacts
    for (const c of this.view.contacts) { const p = this.toScreen(c); this.drawContact(p, c.id); }
    // labels
    for (const [id, t] of this.entityLabels) if (!this.view.entities.some(e => e.id === id)) { t.destroy(); this.entityLabels.delete(id); }
  }

  private orient(spr: Phaser.GameObjects.Sprite, e: EntityView): void {
    const prev = this.prevPos.get(e.id);
    let ang = this.lastAng.get(e.id) ?? -Math.PI / 2;
    if (prev && (Math.abs(e.x - prev.x) > 0.001 || Math.abs(e.y - prev.y) > 0.001)) ang = Math.atan2(e.y - prev.y, e.x - prev.x);
    this.prevPos.set(e.id, { x: e.x, y: e.y });
    this.lastAng.set(e.id, ang);
    spr.setRotation(ang + Math.PI / 2);
  }

  private drawHealth(spr: Phaser.GameObjects.Sprite, e: EntityView, p: Point, size: number): void {
    const g = this.world;
    const w = Math.max(size, 12);
    const top = p.y - size / 2 - 5;
    g.fillStyle(0x071114, 0.9); g.fillRect(p.x - w / 2, top, w, 3);
    const ratio = Math.max(0, e.hp / e.hpmax);
    g.fillStyle(ratio > 0.45 ? (e.ownerId === PLAYER ? COLORS.player : COLORS.enemy) : COLORS.warning, 1);
    g.fillRect(p.x - w / 2, top, w * ratio, 3);
    const t = this.entityLabels.get(e.id) ?? this.add.text(0, 0, "", { fontFamily: "monospace", fontSize: "8px", color: "#071114" }).setDepth(4);
    t.setPosition(p.x - 4, p.y - 4).setText(abbrev(e.kind));
    this.entityLabels.set(e.id, t);
  }

  private drawOrderMarker(e: EntityView): void {
    const g = this.world;
    const order = e.order;
    if (order?.kind === "move" && order.x !== undefined && order.y !== undefined) {
      const target = this.toScreen({ x: order.x, y: order.y });
      g.lineStyle(1, COLORS.player, 0.55); g.lineBetween(this.toScreen(e).x, this.toScreen(e).y, target.x, target.y);
      g.lineStyle(1.5, COLORS.player, 0.9); g.strokeCircle(target.x, target.y, 4);
    } else if (order?.kind === "attack" && order.targetId !== undefined) {
      const tgt = this.view.entities.find(x => x.id === order.targetId);
      if (tgt) { const p = this.toScreen(tgt); g.lineStyle(1.5, COLORS.warning, 0.9); g.strokeCircle(p.x, p.y, 8); }
    }
  }

  private drawContact(p: Point, id: number): void {
    const g = this.world;
    g.lineStyle(1, COLORS.muted, 0.7); g.strokeCircle(p.x, p.y, 5);
  }

  private drawMinimap(): void {
    const g = this.minimap;
    g.clear();
    g.fillStyle(0x08131a, 0.9); g.fillRect(MINI.x, MINI.y, MINI.w, MINI.h);
    g.lineStyle(1, COLORS.line, 0.8); g.strokeRect(MINI.x, MINI.y, MINI.w, MINI.h);
    const sx = MINI.w / 64, sy = MINI.h / 40;
    const discovered = new Set(this.view.terrain.discoveredCells);
    for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++) if (discovered.has(y * 64 + x)) {
      g.fillStyle(0x1b3838, 0.8); g.fillRect(MINI.x + x * sx, MINI.y + y * sy, Math.max(1, sx), Math.max(1, sy));
    }
    const o = this.view.objective;
    g.fillStyle(COLORS.objective, 1); g.fillRect(MINI.x + o.x * sx, MINI.y + o.y * sy, 3, 3);
    for (const e of this.view.entities) { const col = e.ownerId === PLAYER ? COLORS.player : COLORS.enemy; g.fillStyle(col, 1); g.fillRect(MINI.x + e.x * sx, MINI.y + e.y * sy, 2, 2); }
    for (const c of this.view.contacts) { g.fillStyle(COLORS.muted, 0.7); g.fillRect(MINI.x + c.x * sx, MINI.y + c.y * sy, 2, 2); }
  }

  // -------------------------------------------------------------------- fx --
  private tickFx(): void {
    const seen = this.view.events.filter(e => e.id > this.lastEventId);
    if (!seen.length) return;
    this.lastEventId = Math.max(this.lastEventId, ...seen.map(e => e.id));
    for (const ev of seen) this.spawnFx(ev);
  }
  private spawnFx(ev: { kind: string; entityIds: number[] }): void {
    const posOf = (id: number) => { const e = this.view.entities.find(x => x.id === id); return e ? this.toScreen(e) : this.view.contacts.find(c => c.id === id) ? this.toScreen(this.view.contacts.find(c => c.id === id)!) : null; };
    const target = ev.entityIds[ev.entityIds.length - 1];
    const pos = posOf(target);
    if (ev.kind === "damage" && pos && !this.lowFlash) this.burst(pos, "fx_impact", COLORS.warning, 0.9);
    else if (ev.kind === "destroyed" && pos) this.burst(pos, "fx_smoke", COLORS.muted, 1.6, 0.6);
    else if (ev.kind === "production-complete" && pos) this.burst(pos, "fx_reveal", COLORS.player, 1.2, 0.8);
    else if (ev.kind === "construction-complete" && pos) this.burst(pos, "fx_construction", COLORS.objective, 1.2, 0.9);
    else if (ev.kind === "command-rejected" && this.view.phase === "running") this.notice = `// ${this.notice}`;
  }
  private burst(pos: Point, key: string, tint: number, scale = 1, alpha = 0.8): void {
    if (this.motionFriendly) { const s = this.add.image(pos.x, pos.y, key).setDepth(12).setTint(tint).setScale(scale).setAlpha(alpha); this.time.delayedCall(120, () => s.destroy()); return; }
    const s = this.add.sprite(pos.x, pos.y, key).setDepth(12).setTint(tint).setAlpha(alpha);
    s.setScale(scale * 0.5);
    this.tweens.add({ targets: s, scale: scale, alpha: 0, duration: 320, ease: "Cubic.Out", onComplete: () => s.destroy() });
  }

  private showResult(): void {
    const title = this.resultScreen.getByName("resultTitle") as Phaser.GameObjects.Text;
    const reason = this.resultScreen.getByName("resultReason") as Phaser.GameObjects.Text;
    const victory = this.view.result.winnerId === PLAYER;
    title.setText(victory ? "MISSION VICTORY" : "MISSION LOST").setColor(victory ? "#56d8b0" : "#ef7070");
    reason.setText(`${this.view.result.reason ?? "battle concluded"}  //  TICK ${this.view.tick}`);
    this.resultScreen.setVisible(true);
  }

  // --------------------------------------------------------------- helpers --
  private toScreen(point: { x: number; y: number }): Point { return { x: MAP.x + point.x * MAP.cell, y: MAP.y + point.y * MAP.cell }; }
  private toMap(x: number, y: number): Point { return { x: Phaser.Math.Clamp((x - MAP.x) / MAP.cell, 1, 62), y: Phaser.Math.Clamp((y - MAP.y) / MAP.cell, 1, 38) }; }
  private text(x: number, y: number, value: string, size: number, color: number, wordWrapWidth?: number): Phaser.GameObjects.Text { return this.add.text(x, y, value, { fontFamily: "monospace", fontSize: `${size}px`, color: `#${color.toString(16).padStart(6, "0")}`, wordWrap: wordWrapWidth ? { width: wordWrapWidth } : undefined }); }
  private rect(x: number, y: number, width: number, height: number, fill: number, stroke?: number, alpha = 1): Phaser.GameObjects.Rectangle { const r = this.add.rectangle(x, y, width, height, fill, alpha).setOrigin(0); if (stroke) r.setStrokeStyle(1, stroke, 1); return r; }
  private button(x: number, y: number, width: number, height: number, labelText: string, action: () => void, accent = COLORS.line): Phaser.GameObjects.Container { const c = this.add.container(x, y); const bg = this.add.rectangle(0, 0, width, height, COLORS.panel2).setOrigin(0).setStrokeStyle(1, accent); const t = this.text(14, 13, labelText, 11, COLORS.text); bg.setInteractive({ useHandCursor: true }).on("pointerdown", action).on("pointerover", () => bg.setFillStyle(0x1d3b3d)).on("pointerout", () => bg.setFillStyle(COLORS.panel2)); c.add([bg, t]); return c; }
}

function abbrev(kind: EntityKind): string { return ({ hq: "HQ", processor: "PR", assembly: "AS", "infantry-center": "IC", mcv: "MV", harvester: "HV", scout: "SC", infantry: "IN", tank: "TK", "anti-tank": "AT" } as Record<EntityKind, string>)[kind]; }
function label(kind: EntityKind): string { return kind.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()); }
