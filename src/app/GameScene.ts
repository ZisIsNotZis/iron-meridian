import Phaser from "phaser";
import { createSimulationFromManifest } from "../../src/sim/index.ts";
import { loadBrowserV1Manifest } from "../../src/content/browser.ts";
import type { CommandKind, EntityKind, EntityView, GameView, Point } from "../../src/sim/types.ts";

const W = 1280;
const H = 720;
const MAP = { x: 24, y: 102, width: 800, height: 500, cell: 12.5 };
const PLAYER = 1 as const;
const COLORS = { ink: 0x081014, panel: 0x101e23, panel2: 0x14272c, line: 0x2c5558, text: 0xd8e9e6, muted: 0x799496, player: 0x56d8b0, enemy: 0xef7070, objective: 0xeac56d, warning: 0xf09d62, fog: 0x0a1418 };

type Mode = "move" | "attack" | "construct" | null;
type ViewEntity = GameView["entities"][number];

export class GameScene extends Phaser.Scene {
  private manifest = loadBrowserV1Manifest();
  private sim = createSimulationFromManifest(this.manifest, undefined, { includeSupport: true });
  private view = this.sim.view(PLAYER);
  private world!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Container;
  private startScreen!: Phaser.GameObjects.Container;
  private resultScreen!: Phaser.GameObjects.Container;
  private selectionText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private eventText!: Phaser.GameObjects.Text;
  private resourceText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private entityLabels = new Map<number, Phaser.GameObjects.Text>();
  private selected: number[] = [];
  private mode: Mode = null;
  private paused = false;
  private started = false;
  private elapsed = 0;
  private sequence = 0;
  private notice = "Select a unit or structure.";

  constructor() { super("game"); }

  create(): void {
    this.world = this.add.graphics();
    this.createHud();
    this.createStartScreen();
    this.createResultScreen();
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handleMapClick(pointer));
    this.render();
  }

  update(_time: number, delta: number): void {
    if (!this.started || this.paused || this.view.phase !== "running") return;
    this.elapsed += delta;
    while (this.elapsed >= 1000 / 30) {
      this.elapsed -= 1000 / 30;
      this.sim.step(1);
    }
    this.view = this.sim.view(PLAYER);
    this.render();
  }

  private createStartScreen(): void {
    this.startScreen = this.add.container(0, 0);
    this.startScreen.add(this.rect(0, 0, W, H, COLORS.ink));
    this.startScreen.add(this.rect(72, 64, 1136, 592, 0x0d1b20, 0x244447));
    this.startScreen.add(this.text(112, 122, "IRON MERIDIAN", 42, COLORS.text));
    this.startScreen.add(this.text(116, 177, "MERIDIAN CROSSING / FIELD COMMAND", 16, COLORS.player));
    this.startScreen.add(this.text(116, 266, "A compact real-time command exercise", 22, COLORS.text));
    this.startScreen.add(this.text(116, 310, "Hold the central relay or break the opposing headquarters.", 16, COLORS.muted));
    this.startScreen.add(this.text(116, 342, "Click units to select. Choose an order, then click the battlefield.", 16, COLORS.muted));
    this.startScreen.add(this.text(116, 374, "The map is shown through the simulation's visibility-filtered GameView.", 16, COLORS.muted));
    this.startScreen.add(this.text(116, 510, "V1 // SIMULATION LINK READY", 13, COLORS.warning));
    this.startScreen.add(this.button(116, 548, 248, 54, "START MISSION", () => {
      this.started = true;
      this.startScreen.setVisible(false);
      this.hud.setVisible(true);
      this.world.setVisible(true);
      this.render();
    }, COLORS.player));
  }

  private createHud(): void {
    this.hud = this.add.container(0, 0).setVisible(false);
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
    this.hud.add(this.button(1015, 14, 104, 42, "PAUSE", () => {
      this.paused = !this.paused;
      this.notice = this.paused ? "Simulation paused." : "Simulation resumed.";
      this.render();
    }));
    this.hud.add(this.button(1128, 14, 120, 42, "RESTART", () => this.restart()));

    this.hud.add(this.rect(848, 94, 408, 538, COLORS.panel, COLORS.line));
    this.hud.add(this.text(876, 120, "COMMAND DECK", 17, COLORS.text));
    this.hud.add(this.text(876, 148, "SELECTION", 10, COLORS.player));
    this.selectionText = this.text(876, 170, "", 14, COLORS.text, 370);
    this.hud.add(this.selectionText);
    this.statusText = this.text(876, 239, "", 13, COLORS.muted, 350);
    this.hud.add(this.statusText);
    this.hud.add(this.text(876, 292, "ORDERS", 10, COLORS.player));
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
    this.hud.add(this.text(876, 560, "FIELD LOG", 10, COLORS.player));
    this.eventText = this.text(876, 580, "", 11, COLORS.muted, 350);
    this.hud.add(this.eventText);
  }

  private createResultScreen(): void {
    this.resultScreen = this.add.container(0, 0).setVisible(false);
    this.resultScreen.add(this.rect(0, 0, W, H, 0x071013, 0, 0.88));
    this.resultScreen.add(this.rect(310, 210, 660, 290, COLORS.panel, COLORS.line));
    this.resultScreen.add(this.text(368, 258, "", 42, COLORS.text).setName("resultTitle"));
    this.resultScreen.add(this.text(368, 326, "", 16, COLORS.muted).setName("resultReason"));
    this.resultScreen.add(this.button(368, 394, 190, 50, "RESTART", () => this.restart(), COLORS.player));
  }

  private render(): void {
    if (!this.started) return;
    this.world.setVisible(true);
    this.world.clear();
    this.drawBattlefield();
    this.resourceText.setText(`${this.view.resources.banked.toString().padStart(4, "0")}  /  ${this.view.resources.reserved.toString().padStart(4, "0")}`);
    const progress = this.view.objective.progress;
    const owner = this.view.objective.ownerId === 1 ? "WEST" : this.view.objective.ownerId === 2 ? "EAST" : "CONTESTED";
    this.objectiveText.setText(`${owner}  ${Math.abs(progress)}%`);
    this.modeText.setText(this.paused ? "// PAUSED" : this.mode ? `// ${this.mode.toUpperCase()} — SELECT TARGET` : `// TICK ${this.view.tick.toString().padStart(5, "0")}`);
    const chosen = this.view.entities.filter(e => this.selected.includes(e.id));
    this.selectionText.setText(chosen.length ? chosen.map(e => `${label(e.kind)} #${e.id}`).join("\n") : "NO UNIT SELECTED");
    this.statusText.setText(this.notice);
    const events = this.view.events.slice(-4).reverse().map(e => `T${e.tick.toString().padStart(4, "0")}  ${e.kind.toUpperCase()}`).join("\n");
    this.eventText.setText(events || "No events yet.");
    if (this.view.phase !== "running") this.showResult();
  }

  private drawBattlefield(): void {
    const g = this.world;
    g.fillStyle(0x071114); g.fillRect(MAP.x, MAP.y, MAP.width, MAP.height);
    const discovered = new Set(this.view.terrain.discoveredCells);
    for (let y = 0; y < this.view.terrain.height; y++) for (let x = 0; x < this.view.terrain.width; x++) {
      const px = MAP.x + x * MAP.cell; const py = MAP.y + y * MAP.cell;
      if (!discovered.has(y * this.view.terrain.width + x)) continue;
      const tile = (x * 13 + y * 7) % 5;
      g.fillStyle([0x183236, 0x1b3838, 0x1a3530, 0x203b38, 0x173034][tile]);
      g.fillRect(px + 1, py + 1, MAP.cell - 1, MAP.cell - 1);
    }
    g.lineStyle(1, 0x24484a, 0.42);
    for (let x = 0; x <= 64; x += 4) g.lineBetween(MAP.x + x * MAP.cell, MAP.y, MAP.x + x * MAP.cell, MAP.y + MAP.height);
    for (let y = 0; y <= 40; y += 4) g.lineBetween(MAP.x, MAP.y + y * MAP.cell, MAP.x + MAP.width, MAP.y + y * MAP.cell);
    g.lineStyle(2, COLORS.line, 1); g.strokeRect(MAP.x, MAP.y, MAP.width, MAP.height);
    this.drawObjective(g);
    for (const contact of this.view.contacts) this.drawEntity(g, { ...contact, hp: 0, hpmax: 1, state: "idle", cargo: 0, ownerId: 2 }, true);
    for (const entity of this.view.entities) this.drawEntity(g, entity, false);
    for (const [id, text] of this.entityLabels) if (!this.view.entities.some(entity => entity.id === id)) { text.destroy(); this.entityLabels.delete(id); }
  }

  private drawObjective(g: Phaser.GameObjects.Graphics): void {
    const o = this.toScreen(this.view.objective);
    g.lineStyle(2, COLORS.objective, 0.9); g.strokeCircle(o.x, o.y, this.view.objective.capture_radius_cells * MAP.cell);
    g.lineStyle(1, COLORS.objective, 0.28); g.strokeCircle(o.x, o.y, this.view.objective.no_build_radius_cells * MAP.cell);
    g.fillStyle(COLORS.objective, 0.9); g.fillCircle(o.x, o.y, 3);
    g.lineBetween(o.x - 8, o.y, o.x + 8, o.y); g.lineBetween(o.x, o.y - 8, o.x, o.y + 8);
  }

  private drawEntity(g: Phaser.GameObjects.Graphics, e: ViewEntity, stale: boolean): void {
    const p = this.toScreen(e); const mine = e.ownerId === PLAYER;
    const color = stale ? COLORS.muted : mine ? COLORS.player : COLORS.enemy;
    const size = e.kind === "hq" ? 22 : e.kind === "processor" || e.kind === "assembly" || e.kind === "infantry-center" ? 17 : e.kind === "tank" ? 9 : 7;
    if (this.selected.includes(e.id) && !stale) { g.lineStyle(2, COLORS.objective, 1); g.strokeCircle(p.x, p.y, size + 7); }
    g.fillStyle(color, stale ? 0.25 : 0.9); g.lineStyle(1, color, stale ? 0.65 : 1);
    if (["hq", "processor", "assembly", "infantry-center"].includes(e.kind)) g.fillRect(p.x - size, p.y - size, size * 2, size * 2);
    else if (e.kind === "tank" || e.kind === "harvester" || e.kind === "mcv") g.fillRect(p.x - size, p.y - size * .65, size * 2, size * 1.3);
    else g.fillCircle(p.x, p.y, size);
    if (!stale) {
      g.fillStyle(0x071114, 0.92); g.fillRect(p.x - size, p.y - size - 6, size * 2, 3);
      g.fillStyle(e.hp / e.hpmax > .45 ? COLORS.player : COLORS.enemy, 1); g.fillRect(p.x - size, p.y - size - 6, size * 2 * Math.max(0, e.hp / e.hpmax), 3);
      const text = this.entityLabels.get(e.id) ?? this.add.text(0, 0, "", { fontFamily: "monospace", fontSize: "9px", color: "#071114" }).setDepth(2);
      text.setPosition(p.x - 5, p.y - 5).setText(abbrev(e.kind));
      this.entityLabels.set(e.id, text);
    }
  }

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

  private entityAt(x: number, y: number): ViewEntity | undefined {
    return [...this.view.entities].reverse().find(e => {
      const p = this.toScreen(e); return Phaser.Math.Distance.Between(x, y, p.x, p.y) < (e.kind === "hq" ? 28 : 17);
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
  }

  private produce(): void {
    if (this.selected.length !== 1) { this.notice = "Select one producer."; this.render(); return; }
    const e = this.view.entities.find(entity => entity.id === this.selected[0]);
    const recipeId = e?.kind === "assembly" ? "recipe.v1.lynx-scout-car" : e?.kind === "infantry-center" ? "recipe.v1.line-rifle" : undefined;
    if (!recipeId) { this.notice = "Select an assembly or infantry center."; this.render(); return; }
    this.issue("produce", { recipeId });
  }

  private restart(): void {
    this.sim = createSimulationFromManifest(this.manifest, undefined, { includeSupport: true }); this.view = this.sim.view(PLAYER); this.selected = []; this.mode = null; this.paused = false; this.started = true; this.sequence = 0; this.notice = "Mission restarted."; this.resultScreen.setVisible(false); this.startScreen.setVisible(false); this.hud.setVisible(true); this.render();
  }

  private showResult(): void {
    const title = this.resultScreen.getByName("resultTitle") as Phaser.GameObjects.Text;
    const reason = this.resultScreen.getByName("resultReason") as Phaser.GameObjects.Text;
    const victory = this.view.result.winnerId === PLAYER;
    title.setText(victory ? "MISSION VICTORY" : "MISSION LOST").setColor(victory ? "#56d8b0" : "#ef7070");
    reason.setText(`${this.view.result.reason ?? "battle concluded"}  //  TICK ${this.view.tick}`);
    this.resultScreen.setVisible(true);
  }

  private toScreen(point: { x: number; y: number }): Point { return { x: MAP.x + point.x * MAP.cell, y: MAP.y + point.y * MAP.cell }; }
  private toMap(x: number, y: number): Point { return { x: Phaser.Math.Clamp((x - MAP.x) / MAP.cell, 1, 62), y: Phaser.Math.Clamp((y - MAP.y) / MAP.cell, 1, 38) }; }
  private text(x: number, y: number, value: string, size: number, color: number, wordWrapWidth?: number): Phaser.GameObjects.Text { return this.add.text(x, y, value, { fontFamily: "monospace", fontSize: `${size}px`, color: `#${color.toString(16).padStart(6, "0")}`, wordWrap: wordWrapWidth ? { width: wordWrapWidth } : undefined }); }
  private rect(x: number, y: number, width: number, height: number, fill: number, stroke?: number, alpha = 1): Phaser.GameObjects.Rectangle { const r = this.add.rectangle(x, y, width, height, fill, alpha).setOrigin(0); if (stroke) r.setStrokeStyle(1, stroke, 1); return r; }
  private button(x: number, y: number, width: number, height: number, labelText: string, action: () => void, accent = COLORS.line): Phaser.GameObjects.Container { const c = this.add.container(x, y); const bg = this.add.rectangle(0, 0, width, height, COLORS.panel2).setOrigin(0).setStrokeStyle(1, accent); const t = this.text(14, 13, labelText, 11, COLORS.text); bg.setInteractive({ useHandCursor: true }).on("pointerdown", action).on("pointerover", () => bg.setFillStyle(0x1d3b3d)).on("pointerout", () => bg.setFillStyle(COLORS.panel2)); c.add([bg, t]); return c; }
}

function abbrev(kind: EntityKind): string { return ({ hq: "HQ", processor: "PR", assembly: "AS", "infantry-center": "IC", mcv: "MV", harvester: "HV", scout: "SC", infantry: "IN", tank: "TK", "anti-tank": "AT" } as Record<EntityKind, string>)[kind]; }
function label(kind: EntityKind): string { return kind.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()); }
