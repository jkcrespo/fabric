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
0. In React, wrap the app in `FabricProvider` and style MUI components through the theme:
   `sx={{ p: 4, bgcolor: 'background.paper' }}`, `theme.fabric.color.surface.sunken`.
   In plain CSS use `var(--fabric-…)`. Never pass hex values to `sx` or `style`.
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

**Spacing** — 4px grid (`docs/foundations/spacing.md`).
- Use a relationship token when one fits: `space.between-sections` (32), `between-buttons`
  (12), `content-to-buttons` (24), `between-cards` (16), `between-inputs` (16),
  `icon-to-text` (8), `title-to-content-far` (16), `container-padding` (24),
  `card-padding` (16). `-near` = tighter, `-far` = looser.
- Otherwise use the scale `space.000 … space.3200` (name = px × 25). Default `space.400`
  (16px); `space.300` (12px) for a tighter but clear relationship.
- Gap between siblings, padding inside containers, margin outside an element.
  Negative space only for intentional overlaps.
- MUI `theme.spacing(n)` = `n × 4px`, so `space.400` = `theme.spacing(4)`.

**Radius** — apply the assigned token (`docs/foundations/radius.md`): buttons
`radius.button`, inputs `radius.input`, cards `radius.card-sm/md/lg`, dialogs
`radius.card-lg`. Never pick a radius by eye.

**Typography** — use the semantic styles (`typography.body-md`, `typography.heading-sm`…).
Do not set font size, weight or family directly. Rules (`docs/foundations/typography.md`):
- Text and icons use Content colors (`color.text.default` / `subtle`); Signal and Brand
  colors only for emphasis, status or brand expression.
- Emphasis through scale and weight, never text case. No all-caps.
- No ad hoc bold, underline or italics on top of a text style.
- Never use Background (`color.surface.*`) or Stroke (`color.border.*`) colors on text.
- `color.text.tertiary` never for essential, informational or interactive text.
- Text contrast ≥ 4.5:1 (WCAG AA).

**Components**
5. Use a Fabric component when one fits (`Button`, `TextField`, `Card`, `Alert`,
   `Dialog` from `@jkcrespo/fabric-react`). Read its contract first:
   `packages/react/src/<Name>/<name>.meta.json` (or the bundled `components.json`).
   Follow its `usage.whenNot` and `composition` rules.
6. If no Fabric component fits, use the MUI component directly — it is themed. Do not
   restyle it with colors or sizes; use its own props.
7. Form fields: the label sits above the input container, left-aligned, with
   `space.label-to-input` (8px) between them. The theme does this for every MUI input;
   helper and error text sit flush left, `space.100` below. Never re-enable floating
   labels or use a placeholder as the label.
8. Destructive actions: `Button color="danger"` + confirmation `Dialog`. Field errors go
   on `TextField error`, form-level errors in an `Alert severity="danger"`.

**Theming** — Fabric is white-label. Never assume a brand's colors, fonts or corner radius.
Anything brand-specific comes from `tokens/brands/<brand>.json` through semantic tokens.

## 2. Load on demand

| You need… | Read |
| --- | --- |
| A token and when to use it | `packages/tokens/dist/manifest.json` after `npm run build` (intent, CSS var, JS path, MUI mapping, values) · or `tokens/semantic/*.json` |
| How to use tokens in CSS / JS | `packages/tokens/README.md` |
| How Fabric maps onto MUI (palette, typography, shadows, radius) | `packages/theme/README.md` |
| The rules for naming anything | `docs/foundations/naming.md` |
| Spacing, radius, typography rules | `docs/foundations/spacing.md` · `radius.md` · `typography.md` |
| How layers, brands and modes fit together | `docs/foundations/tokens.md` |
| What a brand must define | `tokens/brand-contract.json` · create one with `npm run create-brand` |
| Required contrast pairs | `tokens/contrast-pairs.json` |
| A component's API and usage | `packages/react/src/<Name>/<name>.meta.json` · all at once: `packages/react/dist/components.json` |
| How to add a component | `packages/react/README.md` |
| What you may do without a human | `docs/governance/trust-levels.md` |
| Where the project is going | `docs/ROADMAP.md` |

## 3. Before you propose any change

```bash
npm run validate         # tokens: naming, layers, refs, brand contract, modes, contrast
npm run validate:json    # same, machine-readable
npm run validate:components   # component metadata matches schema and TypeScript props
npm run check            # everything CI runs, incl. browser and axe accessibility tests
```

All must exit 0. Never edit files in `packages/*/dist/` — they are generated.

## 4. What you are allowed to do

Default trust level for agents is **L1 – Intern**: suggest only (comments, issues,
draft PRs). See `docs/governance/trust-levels.md` for the per-action table. In short:

- ✅ Fix broken references, naming violations, missing descriptions → draft PR.
- ⚠️ Add or change a semantic token, add a brand → PR + human review required.
- ⛔ Change the brand contract, contrast thresholds, token layer rules or this file
  → never on your own. Open an issue explaining why.
