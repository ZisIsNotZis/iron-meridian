# Iron Meridian ⚔️

> **Status: paused (indefinite, 2026-09-29).** The initial prototype is built, but
> it is deliberately not a pure game; development stays paused until an
> interesting positioning emerges.

English | 简体中文（中文简介见文末）

Iron Meridian is a data-driven, browser-playable real-time strategy prototype.
It helps designers and developers test a serious RTS loop while keeping the
simulation deterministic and content extensible through YAML manifests.

## Quickstart

Requires Node.js 20+ and npm.

```bash
npm install
npm run test:sim
npm run build
npm run dev
```

Open the Vite URL. Content validation runs with `node tools/check_content.mjs`.

The [`design/`](design/) tree is data, not prose: rules and docs are strict-YAML
records with exact dotted IDs derived from their paths. See
[`design/README.md`](design/README.md) for the layout and validation commands.

## Product shape

The runtime boundary is `Command → simulation → observation`; Phaser renders
the observation but does not own game rules. Authored content is a YAML single
source of truth under [`design/content/`](design/content/) (gameplay data plus
documentation records), validated against [`design/schema/`](design/schema/);
`CONTEXT.md` is only the glossary. This keeps factions, maps, units, and
scenarios modifiable without rewriting the simulation.

Current status: `0.1.0` **playable** V1 vertical slice with a real top-down 2.5D
asset pack, an active scripted AI opponent, and a full match loop (start → scout
→ economy → production → construction → combat → objective → victory/defeat →
restart). Confirmed by the deterministic headless self-check, the content
manifest check, the 100-entity benchmark, and an in-browser visual smoke. See
[`docs/project-status.md`](docs/project-status.md), the canonical design index at
[`design/README.md`](design/README.md), and reviewed screenshots in
[`docs/media/`](docs/media/).

## Verification

```bash
node tools/check_content.mjs        # validate every YAML record + references
python3 tools/audit_design.py       # audit retained Markdown links
npm run test:sim                    # deterministic headless simulation
npm run test:content                # content manifest resolution
npm run test:bench                  # 100-entity deterministic performance smoke
npm run build                       # compile the browser client
npm run dev                         # play the game locally
```

## Future vision

Grow the verified slice into a complete skirmish flow with richer combat,
economy, production, campaign content, replay, and mod tooling. Multiplayer,
large-scale content, and polished release media remain future work.

## Contributing

Issues and focused pull requests are welcome. Include the problem, tests, and
screenshots for visual changes; maintainers review and merge accepted work.
Agents can help triage, investigate, test, document, and implement accepted
issues, but do not bypass maintainer review. Read `CONTEXT.md` and the design
index before changing a rule. Licensed under [AGPL-3.0-only](LICENSE).

## 中文简介

Iron Meridian 是一个由数据驱动、可在浏览器运行的即时战略原型，帮助设计师和
开发者验证严肃的 RTS 核心循环。模拟器保持确定性，阵营、地图、单位和战役通过
YAML 内容扩展。安装 Node.js 20+ 后运行上述命令；当前版本为 `0.1.0`。未来将
完善遭遇战、战斗、经济、生产、战役、回放和模组工具。项目采用 AGPL-3.0-only。
