# Fabric

An open-source, **white-label**, **agent-ready** design system built on [MUI](https://mui.com).

- **White-label:** every brand is one JSON file. Colors, fonts and corner radius change;
  accessibility guarantees don't.
- **Agent-ready:** tokens, rules and component contracts are machine-readable, so AI
  agents can build with the system instead of guessing. Start at [`AGENTS.md`](AGENTS.md).
- **MUI-based:** behavior and accessibility come from MUI; Fabric supplies tokens,
  theming and the agent layer.

> Status: **Step 1 — Foundations.** See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Repository layout

```
AGENTS.md                  Entry point for AI agents (always-on rules)
tokens/
  primitive/               Raw values (system-owned)
  brands/                  One file per brand (fabric = default, acme = example)
  semantic/                Intent-named tokens, light/dark color modes
  brand-contract.json      What every brand must define
  contrast-pairs.json      WCAG pairs checked for every brand × mode
schemas/
  component.schema.json    Machine-readable contract for component metadata
scripts/
  validate-tokens.mjs      Deterministic checks (CI + agents)
docs/
  foundations/             Naming, token architecture, MUI mapping
  governance/              Agent trust levels
  ROADMAP.md
```

## Quick start

```bash
npm run validate        # check tokens: naming, layers, refs, brand contract, contrast
npm run validate:json   # same, machine-readable
```

Requires Node 20+.

## Add a brand

1. Copy `tokens/brands/fabric.json` to `tokens/brands/<your-brand>.json`.
2. Replace the primary/secondary ramps, fonts and radius.
3. Run `npm run validate` and fix any contrast failures.

## License

[MIT](LICENSE)
