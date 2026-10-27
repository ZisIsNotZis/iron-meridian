# Contributing to Iron Meridian

Iron Meridian is a browser RTS prototype: a deterministic 30 Hz simulation in
`src/sim/`, a Phaser presentation layer in `src/app/`, and all gameplay data as
strict YAML under `design/`. Development is currently paused, but issues and
focused pull requests are reviewed.

## Scope

- **Code** lives in `src/` (`sim`, `content`, `app`), tooling in `tools/`, and
  headless checks in `tests/`.
- **Gameplay data and design records** live in `design/content/` and are
  validated against `design/schema/`. Change balance, rosters, recipes, maps, and
  design notes there, not in TypeScript.
- **Out-of-scope work** (additional factions, campaign, air, naval, transport,
  multiplayer, saves, replays) is defined by contracts in
  `design/content/docs/` and needs an accepted scope decision first.

## Before you open a pull request

Run the checks that exist in this repository:

```bash
npm install
npm run test:sim             # deterministic headless self-check
npm run test:content         # content manifest resolution
node tools/check_content.mjs # validate every YAML record and reference
npm run test:bench           # 100-entity performance smoke
npm run build                # the browser build must succeed
```

If you touched Markdown, also run `python3 tools/audit_design.py`.

## Pull request expectations

- One concern per pull request, with a description of the problem and the
  evidence that the change works (command output, a screenshot for visual
  changes).
- Simulation behaviour must stay deterministic: same seed and command log, same
  result and digest.
- Do not duplicate facts. A rule belongs in its owning design record; a README
  or comment links to it instead of restating it.
- Keep new assets in the documented contract in `public/assets/README.md`.

## Issues

State what you expected, what happened, and how to reproduce it (seed, map,
actions). Feature requests should say which existing contract or scope record
they extend. Screenshots help for rendering and UI problems.

## License

Contributions are accepted under [AGPL-3.0-only](LICENSE).
