---
title: Spacing
status: stable
applies-to: [tokens, layout, components]
tokens: tokens/semantic/layout.json#space
---

# Spacing

Spacing uses a **4px grid** with smaller steps for precision. Token names are the
value × 25: `space.400` = 16px. In MUI, `theme.spacing(n)` = `n × 4px`, so
`space.400` = `theme.spacing(4)`.

**Gap** sits between siblings. **Padding** sits inside a container. **Margin** sits
outside an individual element.

## Defaults

Use **`space.400` (16px)** as the versatile standard distance (`space.default`).
Use **`space.300` (12px)** when you need a tighter relationship that is still clear
(`space.default-near`).

## Relationships — use these first

| Relationship | Token | Value |
| --- | --- | --- |
| Between sections | `space.between-sections` | 32px (`space.800`) |
| Between sections, near | `space.between-sections-near` | 24px (`space.600`) |
| Between buttons | `space.between-buttons` | 12px (`space.300`) |
| Content to buttons | `space.content-to-buttons` | 24px (`space.600`) |
| Between cards | `space.between-cards` | 16px (`space.400`) |
| Between cards, near | `space.between-cards-near` | 12px (`space.300`) |
| Between cards, far | `space.between-cards-far` | 24px (`space.600`) |
| Between inputs | `space.between-inputs` | 16px (`space.400`) |
| Label to input | `space.label-to-input` | 8px (`space.200`) |
| Icon to text | `space.icon-to-text` | 8px (`space.200`) |
| Icon to text, near | `space.icon-to-text-near` | 4px (`space.100`) |
| Icon to text, far | `space.icon-to-text-far` | 12px (`space.300`) |
| Between body text, near | `space.between-body-text-near` | 8px (`space.200`) |
| Between body text, far | `space.between-body-text-far` | 16px (`space.400`) |
| Title to content, near | `space.title-to-content-near` | 8px (`space.200`) |
| Title to content, far | `space.title-to-content-far` | 16px (`space.400`) |
| Between titles, near | `space.between-titles-near` | 4px (`space.100`) |
| Between titles, far | `space.between-titles-far` | 8px (`space.200`) |
| Container padding | `space.container-padding` | 24px (`space.600`) |
| Container padding, near | `space.container-padding-near` | 20px (`space.500`) |
| Card padding | `space.card-padding` | 16px (`space.400`) |
| Card padding, near | `space.card-padding-near` | 12px (`space.300`) |

## Scale

| Token | Value | Token | Value |
| --- | --- | --- | --- |
| `space.000` | 0px | `space.600` | 24px |
| `space.025` | 1px | `space.800` | 32px |
| `space.050` | 2px | `space.1000` | 40px |
| `space.075` | 3px | `space.1200` | 48px |
| `space.100` | 4px | `space.1400` | 56px |
| `space.150` | 6px | `space.1600` | 64px |
| `space.200` | 8px | `space.2000` | 80px |
| `space.250` | 10px | `space.2400` | 96px |
| `space.300` | 12px | `space.2800` | 112px |
| `space.400` | 16px | `space.3200` | 128px |
| `space.500` | 20px | | |

`space.025`–`space.075` are for optical adjustments only, never for layout.

## Negative overlap

`space.negative.100` … `space.negative.600` (−4px … −24px). Only for intentional
overlaps, such as stacked avatars. Never use them to fix a layout.

## In code

```tsx
<Stack sx={(t) => ({ gap: t.fabric.space.betweenInputs })}>…</Stack>   // MUI
gap: var(--fabric-space-between-inputs);                                 // CSS
```
