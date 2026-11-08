---
title: Radius
status: stable
applies-to: [tokens, components]
tokens: tokens/semantic/layout.json#radius
---

# Radius logic

Apply the **assigned** radius token for the component. Use the scale only when you
design a new pattern.

## Component mapping (Fabric brand)

| Component | Token | Value |
| --- | --- | --- |
| Most buttons | `radius.button` | `radius.full` (pill) |
| Input controls (text fields, selects, chips) | `radius.input` | 8px (`radius.200`) |
| Card / lg, dialogs | `radius.card-lg` | 12px (`radius.300`) |
| Card / md, menus, popovers | `radius.card-md` | 8px (`radius.200`) |
| Card / sm | `radius.card-sm` | 6px (`radius.150`) |

The assigned tokens are **brand-controlled** (`tokens/brands/<brand>.json` →
`brand.radius.*`). Each brand picks a value from the scale. Acme, for example, uses
2px everywhere and 6px for large cards.

## Scale

| Token | Value | Use |
| --- | --- | --- |
| `radius.000` | 0px | Square corners |
| `radius.050` | 2px | Subtle rounding where assigned |
| `radius.150` | 6px | Small cards |
| `radius.200` | 8px | Input controls, medium cards |
| `radius.300` | 12px | Large cards |
| `radius.full` | 10000px | Pills, avatars, badges |

## In MUI

`FabricProvider` applies the mapping automatically: `Button` → `radius.button`,
`theme.shape.borderRadius` → `radius.input`, Paper/Card/menus → `radius.card-md`,
Dialog → `radius.card-lg`. The Fabric `Card` picks `card-sm/md/lg` from its `size` prop.
