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
| 3 | **MUI theme** — `@jkcrespo/fabric-theme`: `createFabricTheme({ brand, mode })`, MUI CSS-variables theme, TypeScript augmentation for extra tokens | — | ⏭ Next |
| 4 | **First components** — `@jkcrespo/fabric-react`: Button, TextField, Card, Alert, Dialog on MUI. Each ships a `*.meta.json` validated against `schemas/component.schema.json`. Storybook with brand + mode switcher | Make components machine-readable · Add intent | |
| 5 | **Agent access** — build a single manifest (tokens + component metadata). MCP server for on-demand lookups. Benchmark JSON vs Markdown on real prompts | Progressive disclosure · Benchmark before committing to a format | |
| 6 | **Self-healing loop** — lint for hard-coded values / primitive usage, drift score, scheduled agent QA that can only open issues | Observe → detect → suggest → fix → learn | |
| 7 | **Publish** — npm packages, docs site, contribution guide, release automation | — | |

## Key decisions

- **No Figma library.** Code and JSON are the source of truth.
- **DTCG JSON** for tokens — a tool-neutral standard agents and build tools both read.
- **Own zero-dependency build** instead of Style Dictionary — the validator, build and
  brand generator share one loader (`scripts/lib/tokens.mjs`), so they can never
  disagree about what a token resolves to.
- **npm scope `@jkcrespo`**, packages named `fabric-*`. MIT license.
- **MUI as the base** — accessibility and behavior come from MUI; Fabric owns tokens,
  theming and the agent layer.
- **Brands are data, not code.** One JSON file per brand, checked against a contract.
- **JSON for contracts, Markdown for instructions** (Diana Wolosin's rule).
- **Validator before automation.** Every rule an agent must follow is a check it can run.
