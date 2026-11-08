---
title: Token architecture & white-label theming
status: stable
applies-to: [tokens, theming, mui]
---

# Token architecture & white-label theming

Tokens are written in the [W3C Design Tokens (DTCG)](https://www.designtokens.org/) JSON
format: `$value`, `$type`, `$description`, references as `{path.to.token}`.

## Layers

```
primitive  ──►  brand  ──►  semantic  ──►  (component)  ──►  MUI theme / CSS vars
 raw values     per-brand    intent         per-component     outputs (step 2–3)
 system-owned   one file     modes          later
```

| Layer | Folder | Holds | Rule (enforced by `npm run validate`) |
| --- | --- | --- | --- |
| Primitive | `tokens/primitive/` | Neutral & status palettes, spacing, radius, type scale, shadows, motion | Literal values only |
| Brand | `tokens/brands/` | Primary + secondary ramps, heading/body font, radius for buttons, inputs and cards | Literals or refs to primitives. Must match `brand-contract.json` exactly |
| Semantic | `tokens/semantic/` | Intent-named tokens | References only, every token has a `$description` |

## Why brands only touch a few paths

A brand is **one file** that fills the brand contract. Status colors (danger, warning,
success, info), neutrals, spacing and the type scale stay system-owned, so every brand
gets the same accessibility guarantees for free. To add a brand:

**From two seed colors (recommended):**

```bash
npm run create-brand -- my-brand --primary "#0f62fe" --secondary "#8a3ffc" \
  --heading serif --radius-button 200
npm run validate && npm run build
```

The generator (`scripts/lib/ramp.mjs`) builds each 10-step ramp in OKLCH, keeps the
seed's hue, and adjusts lightness until the ramp passes every contrast rule. The seeds
are saved in the brand file's `$extensions` so it can be regenerated.

**By hand:** copy `tokens/brands/fabric.json`, replace the ramps, fonts and radius,
then `npm run validate` and fix any contrast failures (usually: darken step 600).

## Modes

Semantic color has `color.light.json` and `color.dark.json`. Both must define the same
paths. Everything else is mode-independent. Themes = **brands × modes** (today 2 × 2).

## Build outputs — `@jkcrespo/fabric-tokens`

`npm run build` runs `packages/tokens/build.mjs`. Only semantic tokens are published.

| File | What it is |
| --- | --- |
| `<brand>.css` | CSS variables on `:root`, dark values under `[data-fabric-mode="dark"]` |
| `<brand>.scoped.css` | Same, scoped to `[data-fabric-brand="<brand>"]` for several brands on one page |
| `<brand>.js` + `.d.ts` | `tokens.light` / `tokens.dark` (resolved values), `vars` (`var()` refs), `breakpoints` |
| `index.js` + `.d.ts` | Brand list and shared types (`FabricTokens`, `FabricBrandId`…) |
| `manifest.json` | Every token: intent, MUI mapping, CSS var, JS path, value per brand × mode. **The file agents read.** |

Value transforms: font sizes px → rem, font families → CSS font stacks, shadows → CSS
`box-shadow`, easing → `cubic-bezier()`. Typography tokens become one CSS variable per
property (`--fabric-typography-body-md-font-size`).

## Mapping to MUI

The MUI theme (`@jkcrespo/fabric-theme`) is generated from semantic tokens; full table in `packages/theme/README.md`. The mapping is stored on each
token as `$extensions["com.fabric"].mui`, so it is machine-readable. Summary:

| Fabric semantic | MUI theme |
| --- | --- |
| `color.<role>.background` | `palette.<role>.main` |
| `color.<role>.background-hover` | `palette.<role>.dark` |
| `color.<role>.subtle` | `palette.<role>.light` |
| `color.<role>.foreground` | `palette.<role>.contrastText` |
| `color.danger.*` | `palette.error.*` |
| `color.surface.default` / `raised` | `palette.background.default` / `paper` |
| `color.text.default` / `subtle` / `disabled` | `palette.text.primary` / `secondary` / `disabled` |
| `color.border.default` | `palette.divider` |
| `typography.display-lg … overline` | `typography.h1 … overline` |
| `radius.button` / `radius.input` / `radius.card-*` | Button / `shape.borderRadius` / Paper, Card, Dialog — see `docs/foundations/radius.md` |
| `space.*` | `spacing` (4px unit) |
| `primitive.breakpoint.*` | `breakpoints.values` |

Tokens with no MUI equivalent (`color.surface.sunken`, `color.border.focus`, `*.text`…)
are exposed as CSS variables and through theme augmentation.

## Contrast

`tokens/contrast-pairs.json` lists foreground/background pairs and their minimum WCAG
ratio. The validator resolves every pair for every brand × mode. A brand that fails
cannot merge.
