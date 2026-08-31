# Iron Meridian ⚔️

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

## Product shape

The runtime boundary is `Command → simulation → observation`; Phaser renders
the observation but does not own game rules. Authored content lives under
`design/`, and `CONTEXT.md` is only the glossary. This keeps factions, maps,
units, and scenarios modifiable without rewriting the simulation.

Current status: `0.1.0` playable prototype. See
[`docs/project-status.md`](docs/project-status.md) and the canonical design
tree under [`design/`](design/).

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
