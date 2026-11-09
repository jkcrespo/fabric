# Fabric

An open-source, **white-label**, **agent-ready** design system built on [MUI](https://mui.com).

- **White-label:** every brand is one JSON file. Colors, fonts and corner radius change;
  accessibility guarantees don't.
- **Agent-ready:** tokens, rules and component contracts are machine-readable, so AI
  agents can build with the system instead of guessing. Start at [`AGENTS.md`](AGENTS.md).
- **MUI-based:** behavior and accessibility come from MUI; Fabric supplies tokens,
  theming and the agent layer.

> Status: **Step 6 — Self-healing loop** done. See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Repository layout

```
AGENTS.md                  Entry point for AI agents (always-on rules)
tokens/
  primitive/               Raw values (system-owned)
  brands/                  One file per brand (fabric = default, acme = example)
  semantic/                Intent-named tokens, light/dark color modes
  brand-contract.json      What every brand must define
  contrast-pairs.json      WCAG pairs checked for every brand × mode
packages/
  tokens/                  @jkcrespo/fabric-tokens — CSS vars, typed JS, agent manifest
  theme/                   @jkcrespo/fabric-theme — MUI theme + FabricProvider
  react/                   @jkcrespo/fabric-react — components, metadata, Storybook
  mcp/                     @jkcrespo/fabric-mcp — MCP server for AI agents
  eslint-plugin/           @jkcrespo/eslint-plugin-fabric — lint rules + fabric-drift
benchmark/                 JSON vs Markdown vs prose benchmark
schemas/
  component.schema.json    Machine-readable contract for component metadata
scripts/
  validate-tokens.mjs      Deterministic token checks (CI + agents)
  validate-components.mjs  Component metadata vs schema and TypeScript props
  create-brand.mjs         New brand from two seed colors
  lib/                     Shared token loader, color math, ramp generator
tests/                     Build, ramp, type, browser (Playwright) and accessibility (axe) tests
docs/
  foundations/             Naming, token architecture, MUI mapping
  governance/              Agent trust levels
  ROADMAP.md
```

## Quick start

```bash
npm install
npm run check           # everything CI runs: validation, build, types, unit, browser and a11y tests
npm run storybook       # browse components with brand + mode switcher
npm run build           # build packages/tokens/dist
npm run validate:json   # token report for agents
```

Requires Node 20+.

## Use it in a React app

```tsx
import '@fontsource-variable/noto-sans'; // Fabric's typeface
import acme from '@jkcrespo/fabric-tokens/acme';
import { FabricProvider, Button, Card } from '@jkcrespo/fabric-react';

<FabricProvider brand={acme}>
  <Card title="Welcome" actions={<Button>Get started</Button>} />
</FabricProvider>
```

See [`packages/react/README.md`](packages/react/README.md) and
[`packages/theme/README.md`](packages/theme/README.md).

## Add a brand

```bash
npm run create-brand -- my-brand --primary "#0f62fe" --secondary "#8a3ffc" --heading serif
npm run check
```

The generator builds full color ramps that already pass every contrast rule. Options:
`--heading` / `--body` (`sans` `serif` `mono`), `--radius-button` / `--radius-input` /
`--radius-card-sm` / `--radius-card-md` / `--radius-card-lg` (`000` `050` `150` `200` `300`
`full`), `--description`.

## License

[MIT](LICENSE)
