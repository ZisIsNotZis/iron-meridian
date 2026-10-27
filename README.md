<p align="center">
  <img src="docs/media/logo.svg" alt="Iron Meridian emblem" width="112">
</p>

<p align="center">
  <strong>English</strong> · <a href="README.zh-CN.md">简体中文</a>
</p>

# Iron Meridian

### A near-future real-time strategy prototype that runs in the browser.

**Scout the approaches, choose economy or army, and take the central relay — on a deterministic 30 Hz simulation where units, recipes, and balance data are readable YAML records.**

> **Status:** V1 is playable (`0.1.0`). Active development is paused; the code and design archive remain open for study, forks, and future work. See [project status](docs/project-status.md).

![Iron Meridian battlefield: Coalition base, central relay objective, fog of war, and command deck](docs/media/battlefield.png)

## Quick start

Requires Node.js 20+.

```bash
git clone https://github.com/ZisIsNotZis/iron-meridian.git
cd iron-meridian
npm install
npm run dev
```

Open the URL Vite prints. The match starts with a skippable briefing. Prefer the headless proof?

```bash
npm run test:sim
npm run test:content
npm run test:bench
```

## What it can do now

- **Play a complete match loop:** scout, harvest, produce, construct, fight, capture the central relay, win or lose, and restart the same scenario.
- **Trust the simulation:** fixed 30 Hz tick, seeded randomness, a state digest, and deterministic reproduction from the same seed and command log.
- **Face a real scripted opponent:** the east AI uses the same fog-filtered view, develops its base, fields combined arms, and contests the objective.
- **Use combined arms:** rifle infantry, scouts, main battle tanks, anti-tank teams, harvesters, and an MCV — with terrain, vision, armor classes, and readable counters.
- **Change the game as data:** 284 strict-YAML records in `design/content/` cover units, factions, maps, recipes, and design notes; schemas and a validator catch broken references before runtime.
- **Read the battlefield:** hand-authored SVG assets, fog of war, health bars, order markers, a minimap, production and construction panels, control groups, pause, and restart.
- **Verify the claims:** a headless self-check, a content-manifest check, a 100-entity benchmark, and a design link audit ship with the repository.

More screenshots are in [`docs/media/`](docs/media/).

## Architecture

```text
design/content + design/schema
             |
             v
        src/content  ---->  src/sim  ---->  observation  ---->  src/app (Phaser)
                              ^                                      |
                              +--------------- commands -------------+
```

- [`design/`](design/) is the single source of truth: YAML records for gameplay data and design documentation, plus the schemas that validate them.
- [`src/sim/`](src/sim/) is the engine-independent simulation: deterministic state, the command boundary, combat, economy, fog, objective control, and the scripted AI.
- [`src/content/`](src/content/) resolves and validates content manifests for both Node and the browser.
- [`src/app/`](src/app/) is the Phaser presentation layer. It renders observations and translates input into commands; it does not own game rules.
- [`tools/`](tools/) and [`tests/`](tests/) hold the content validator, asset renderer, link audit, self-checks, and benchmark.

The full design index is [`design/README.md`](design/README.md); the glossary is [`CONTEXT.md`](CONTEXT.md).

## How to develop

```bash
npm install
npm run dev                  # Phaser client with hot reload
npm run build                # production browser build
npm run test:sim             # deterministic headless simulation self-check
npm run test:content         # content manifest resolution check
npm run test:bench           # 100-entity deterministic performance smoke
node tools/check_content.mjs # validate every YAML record and reference
python3 tools/audit_design.py # audit retained Markdown links
```

Before opening a pull request, run `npm run test:sim`, `npm run test:content`, and `node tools/check_content.mjs`. Content changes belong in [`design/content/`](design/content/) and are validated against [`design/schema/`](design/schema/).

## How to contribute

Issues and focused pull requests are welcome. Include the problem, the test evidence, and screenshots for visual changes. Maintainers review and merge accepted work.

Read [`CONTEXT.md`](CONTEXT.md) and the [design index](design/README.md) before changing a rule. Keep new facts in their owning design record rather than duplicating prose. Agents may help triage, investigate, test, document, and implement accepted issues, but they do not bypass maintainer review.

## Roadmap

### Implemented in 0.1.0

- [x] Deterministic headless simulation with a command boundary, fixed clock, seeded randomness, and state digest.
- [x] Full match loop: scouting, economy, production, construction, combat, fog of war, objective capture, victory, defeat, and restart.
- [x] Scripted opponent that harvests, builds, produces a mixed force, and pushes the relay.
- [x] One-map Coalition mirror skirmish on Meridian Crossing.
- [x] Data-driven YAML content tree with schema validation and reference resolution.
- [x] Browser client with selection, orders, minimap, production and construction panels, control groups, pause, and reduced-motion support.
- [x] Verification harness: simulation self-check, content check, link audit, asset renderer, and 100-entity benchmark.

### Planned

- [ ] Near-term solo game: distinct Coalition and Directorate factions, authored campaign missions, four skirmish maps, non-cheating AI difficulties, saves and checkpoints, replays, settings, localization, and richer assets.
- [ ] Promoted expansion systems: playable Irregular Network, air, naval, and transport layers, each behind its own scope decision.
- [ ] Online and tooling work: multiplayer, MCP agents, distributed mod packages, and ranked operations.

**Future vision.** V1 proves the command loop and the content pipeline on one mirrored skirmish. The next step is a complete solo skirmish game: two distinct factions, authored campaign missions, more maps, saves and replays, and a tested mod path. Anything beyond that — online play, air and naval layers, the Irregular Network — waits for its own contract and evidence, not for a promise in this README.

## License

[AGPL-3.0-only](LICENSE).
