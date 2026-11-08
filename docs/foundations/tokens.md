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
| Brand | `tokens/brands/` | Primary + secondary ramps, heading/body font, control/container radius | Literals or refs to primitives. Must match `brand-contract.json` exactly |
| Semantic | `tokens/semantic/` | Intent-named tokens | References only, every token has a `$description` |

## Why brands only touch a few paths

A brand is **one file** that fills the brand contract. Status colors (danger, warning,
success, info), neutrals, spacing and the type scale stay system-owned, so every brand
gets the same accessibility guarantees for free. To add a brand:

1. Copy `tokens/brands/fabric.json` → `tokens/brands/<brand-id>.json`.
2. Replace the ramps, fonts and radius references.
3. `npm run validate` — fix any contrast failures (usually: darken step 600).

*Step 2 adds a generator so a brand can supply one seed color instead of a full ramp.*

## Modes

Semantic color has `color.light.json` and `color.dark.json`. Both must define the same
paths. Everything else is mode-independent. Themes = **brands × modes** (today 2 × 2).

## Mapping to MUI

The MUI theme (step 3) is generated from semantic tokens. The mapping is stored on each
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
| `radius.control` | `shape.borderRadius` |
| `space.*` | `spacing` (4px unit) |
| `primitive.breakpoint.*` | `breakpoints.values` |

Tokens with no MUI equivalent (`color.surface.sunken`, `color.border.focus`, `*.text`…)
are exposed as CSS variables and through theme augmentation.

## Contrast

`tokens/contrast-pairs.json` lists foreground/background pairs and their minimum WCAG
ratio. The validator resolves every pair for every brand × mode. A brand that fails
cannot merge.
