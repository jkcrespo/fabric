---
title: Roadmap
status: living
---

# Roadmap

Fabric follows the agentic design system approach described by Romina Kavcic and others
at the AI Design Systems Conference 2026
([summary](https://www.intodesignsystems.com/agentic-design-systems)):
**plant seeds, not trees** — foundations first, automation on top.

| # | Step | Principle from the article | Status |
| --- | --- | --- | --- |
| 1 | **Foundations** — naming, token layers, brand contract, contrast rules, validator, `AGENTS.md`, trust levels, component metadata schema | Plant seeds, not trees · Colocate and name semantically · Set trust levels | ✅ Done |
| 2 | **Token build** — `@jkcrespo/fabric-tokens`: CSS variables per brand × mode, typed JS/TS, agent manifest. Seed-color → contrast-safe ramp generator (`npm run create-brand`) | Design system as infrastructure | ✅ Done |
| 3 | **MUI theme** — `@jkcrespo/fabric-theme`: `FabricProvider`, `createFabricTheme(brand)`, CSS-variables theme (one theme for all brands, mode switch without re-render), `FabricBrandScope`, typed `theme.fabric`. Tested in Chromium | — | ✅ Done |
| 4 | **First components** — `@jkcrespo/fabric-react`: Button, TextField, Card, Alert, Dialog on MUI. Each ships a `*.meta.json` checked against the schema *and* the TypeScript props (`npm run validate:components`). Storybook with brand + mode switcher; axe WCAG 2.1 AA on every story × brand × mode | Make components machine-readable · Add intent | ✅ Done |
| 5 | **Agent access** — `@jkcrespo/fabric-mcp`: MCP server bundling rules, tokens, component contracts and guidelines (8 tools, 3 resources, 1 prompt). `.mcp.json` for this repo. JSON vs Markdown vs prose benchmark on 22 real questions (`npm run benchmark`) | Progressive disclosure · Benchmark before committing to a format | ✅ Done (accuracy run pending) |
| 6 | **Self-healing loop** — `@jkcrespo/eslint-plugin-fabric` (7 rules, published for apps on Fabric; Fabric lints itself with it), `fabric-drift` score, safe auto-fixes for exact spacing matches, daily health check that can only open/update one issue | Observe → detect → suggest → fix → learn | ✅ Done |
| 7 | **Publish** — npm packages, docs site, contribution guide, release automation | — | ⏭ Next |

## Key decisions

- **No Figma library.** Code and JSON are the source of truth.
- **DTCG JSON** for tokens — a tool-neutral standard agents and build tools both read.
- **Own zero-dependency build** instead of Style Dictionary — the validator, build and
  brand generator share one loader (`scripts/lib/tokens.mjs`), so they can never
  disagree about what a token resolves to.
- **MUI v9 with CSS variables.** Theme values are `var(--fabric-…)` references and
  `nativeColor` derives shades in CSS, so brands and modes switch without re-rendering.
- **Small, intent-based component APIs** (`variant="solid"`, `color="danger"`) over
  MUI's full prop surface: fewer choices, fewer wrong guesses by agents. Any MUI
  component still works with the theme.
- **Spacing, radius and typography rules from the Unify reference guide** — px × 25
  spacing scale with named relationships, assigned radius per component (brand-
  controlled), and typography rules as always-on agent rules.
- **JSON and Markdown for everything agents read** — one renderer produces both, so they
  never disagree. JSON for tools and MCP, Markdown for people and prompts.
- **Metadata checked against code.** A contract that can drift is worse than none.
- **npm scope `@jkcrespo`**, packages named `fabric-*`. MIT license.
- **MUI as the base** — accessibility and behavior come from MUI; Fabric owns tokens,
  theming and the agent layer.
- **Brands are data, not code.** One JSON file per brand, checked against a contract.
- **JSON for contracts, Markdown for instructions** (Diana Wolosin's rule).
- **Validator before automation.** Every rule an agent must follow is a check it can run.
