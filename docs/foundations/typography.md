---
title: Typography
status: stable
applies-to: [tokens, content, components]
tokens: tokens/semantic/typography.json
---

# Typography rules

1. Use **Content** colors for normal text and icons: `color.text.default` (Content
   Primary) and `color.text.subtle` (Content Secondary). Use **Signal** colors
   (`color.danger.text`, `color.success.text`…) or **Brand** colors
   (`color.primary.text`) only for emphasis, status or brand expression.
2. Use consistent margins and generous padding when left-aligning type.
3. Align typography to the 4px grid. Do not let text elements float.
4. Create emphasis through **scale and weight, not text case**. No all-caps labels;
   `typography.overline` uses letter-spacing and weight, not uppercase.
5. Do not override text styles with ad hoc bold, underline or italics. Pick a
   different typography token instead.
6. Do not apply **Background** (`color.surface.*`) or **Stroke** (`color.border.*`)
   colors to text.
7. Check color pairings against WCAG AA. The normal-text target is **4.5:1**.
   `npm run validate` enforces this for every token pair in every brand and mode.
8. **Content Tertiary** (`color.text.tertiary`) is not for essential, informational or
   interactive text. It is not contrast-checked.

## Styles

| Token | MUI variant | Use |
| --- | --- | --- |
| `typography.display-lg` | `h1` | Page hero. At most one per page |
| `typography.display-md` | `h2` | Page title |
| `typography.heading-lg` | `h3` | Section heading |
| `typography.heading-md` | `h4` | Subsection heading |
| `typography.heading-sm` | `h5` | Card and dialog titles |
| `typography.heading-xs` | `h6` | Small group headings |
| `typography.title-md` | `subtitle1` | Lead-in text |
| `typography.title-sm` | `subtitle2` | Compact emphasised labels |
| `typography.body-md` | `body1` | Default reading text |
| `typography.body-sm` | `body2` | Dense UI text |
| `typography.label-md` | `button` | Button and control labels |
| `typography.caption` | `caption` | Helper text, footnotes |
| `typography.overline` | `overline` | Eyebrow above a heading |

Fonts come from the brand (`brand.font-family.heading` / `body`).
