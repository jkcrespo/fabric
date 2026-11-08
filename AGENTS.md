# AGENTS.md — how AI agents work in Fabric

Fabric is an open-source, white-label design system built on MUI. This file is the
entry point for any AI agent (Claude Code, Cursor, Copilot, custom agents). It holds the
**always-on rules**. Everything else is loaded on demand from the files listed below.

> Humans: this file is also the shortest accurate description of how the system works.

## 1. Always-on rules (apply to every task)

These cover foundations, because on-demand lookups (component metadata, later the MCP
server) only return what a prompt asks for. If you skip these, you will guess spacing,
color and type — and you will guess wrong.

**Tokens**
1. Use **semantic tokens only** in components and product code: `color.*`, `space.*`,
   `radius.*`, `typography.*`, `elevation.*`, `motion.*`.
2. **Never** use `primitive.*` or `brand.*` tokens outside of `tokens/`. Never hard-code
   a hex value, px value, font name or shadow.
3. Pick tokens by **intent**, not by look. Every semantic token has a `$description`
   saying when to use it. Read it. `color.danger.background` is for destructive actions,
   not "something red".
4. Text on a filled role background always uses the matching foreground:
   `color.primary.background` ↔ `color.primary.foreground`.

**Color roles** — `primary`, `secondary`, `danger`, `warning`, `success`, `info`.
Each role has: `background`, `background-hover`, `foreground`, `text`, `subtle`.
Neutrals live in `color.surface.*`, `color.text.*`, `color.border.*`.

**Spacing** — 4px grid. Use `space.2xs … space.2xl`. MUI `theme.spacing(n)` = `n × 4px`.

**Typography** — use the semantic styles (`typography.body-md`, `typography.heading-sm`…).
Do not set font size, weight or family directly.

**Theming** — Fabric is white-label. Never assume a brand's colors, fonts or corner radius.
Anything brand-specific comes from `tokens/brands/<brand>.json` through semantic tokens.

## 2. Load on demand

| You need… | Read |
| --- | --- |
| A token and when to use it | `tokens/semantic/*.json` (`$description` on every token) |
| The rules for naming anything | `docs/foundations/naming.md` |
| How layers, brands and modes fit together | `docs/foundations/tokens.md` |
| What a brand must define | `tokens/brand-contract.json` |
| Required contrast pairs | `tokens/contrast-pairs.json` |
| A component's API and usage | `schemas/component.schema.json` (contract) · `*.meta.json` (per component, from step 4) |
| What you may do without a human | `docs/governance/trust-levels.md` |
| Where the project is going | `docs/ROADMAP.md` |

## 3. Before you propose any change

```bash
npm run validate         # human report
npm run validate:json    # machine-readable report for agents
```

It must exit 0. It checks naming, layer rules, references, the brand contract,
light/dark parity and WCAG contrast for every brand × mode.

## 4. What you are allowed to do

Default trust level for agents is **L1 – Intern**: suggest only (comments, issues,
draft PRs). See `docs/governance/trust-levels.md` for the per-action table. In short:

- ✅ Fix broken references, naming violations, missing descriptions → draft PR.
- ⚠️ Add or change a semantic token, add a brand → PR + human review required.
- ⛔ Change the brand contract, contrast thresholds, token layer rules or this file
  → never on your own. Open an issue explaining why.
