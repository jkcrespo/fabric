# @jkcrespo/fabric-tokens

Design tokens for [Fabric](https://github.com/jkcrespo/fabric), an open-source,
white-label, agent-ready design system built on MUI.

Only **semantic** tokens are published (`color.*`, `space.*`, `radius.*`,
`typography.*`, `elevation.*`, `motion.*`). Each one is named by intent and documented
in `manifest.json`.

## CSS variables

```css
@import '@jkcrespo/fabric-tokens/fabric.css';  /* one brand on :root */

.card {
  background: var(--fabric-color-surface-raised);
  padding: var(--fabric-space-card-padding);
  border-radius: var(--fabric-radius-card-md);
}
```

Dark mode: set `data-fabric-mode="dark"` on `<html>` or on any container.

Several brands on one page: import `<brand>.scoped.css` and set
`data-fabric-brand="<brand>"` on a container.

## JavaScript / TypeScript

```ts
import { tokens, vars, breakpoints } from '@jkcrespo/fabric-tokens/acme';

tokens.light.color.primary.background;   // '#c2410c'
tokens.dark.typography.bodyMd.fontSize;  // '1rem'
vars.color.primary.background;           // 'var(--fabric-color-primary-background)'
```

Keys are the token path in camelCase: `color.primary.background-hover` →
`color.primary.backgroundHover`.

## For agents (JSON and Markdown)

Every token is published twice, with the same facts:

- `@jkcrespo/fabric-tokens/manifest.json` — JSON, for tools and MCP.
- `@jkcrespo/fabric-tokens/tokens.md` — Markdown tables grouped by category, for people
  and LLM prompts.

The manifest lists every token with its intent
(`description`), MUI mapping, CSS variable, JS path and resolved value for every
brand × mode.
