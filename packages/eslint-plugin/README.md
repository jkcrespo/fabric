# @jkcrespo/eslint-plugin-fabric

ESLint rules that keep apps on [Fabric](https://github.com/jkcrespo/fabric)'s tokens and
rules, plus `fabric-drift`, a score of how much of your UI code follows Fabric.

```bash
npm install -D eslint @jkcrespo/eslint-plugin-fabric @typescript-eslint/parser
```

```js
// eslint.config.js
import tsParser from '@typescript-eslint/parser';
import fabric from '@jkcrespo/eslint-plugin-fabric';

export default [
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: { parser: tsParser },
    ...fabric.configs.recommended,
  },
];
```

Rules look inside style objects — `sx`, `style`, `styled()`, `css()` — and at Fabric
token names anywhere. The token list ships with the plugin, so unknown tokens are caught
with a "did you mean".

## Rules

| Rule | Recommended | Auto-fix |
| --- | --- | --- |
| [`no-hardcoded-colors`](#no-hardcoded-colors) | error | |
| [`no-unknown-tokens`](#no-unknown-tokens) | error | |
| [`no-raw-typography`](#no-raw-typography) | error | |
| [`no-raw-radius`](#no-raw-radius) | error | |
| [`no-floating-labels`](#no-floating-labels) | error | |
| [`no-raw-spacing`](#no-raw-spacing) | warn | exact scale matches |
| [`prefer-fabric-components`](#prefer-fabric-components) | warn | |

### no-hardcoded-colors

No hex, `rgb()`, `hsl()`, `oklch()` or named colors in styles. Pick a semantic token by
intent: `color: 'text.secondary'`, `t.fabric.color.danger.text`,
`var(--fabric-color-primary-background)`. Fabric is white-label — a hard-coded color
breaks every other brand. No auto-fix: only intent can say whether `#dc2626` is
`danger` or just "red".

### no-unknown-tokens

`var(--fabric-…)` and `theme.fabric.…` must exist; `primitive.*` and `brand.*` tokens
are internal. Typos get a suggestion: `--fabric-color-primary-bg` → did you mean
`--fabric-color-primary-background`?

### no-raw-typography

No `fontSize`, `fontWeight`, `fontFamily`, `lineHeight` or `letterSpacing` in styles —
use a typography style (`<Typography variant="body2">`). No `textTransform: uppercase`
(emphasis comes from scale and weight, not text case) and no ad hoc italics.

### no-raw-radius

No raw `borderRadius`. Apply the assigned token: `radius.button`, `radius.input`,
`radius.card-sm/md/lg`, `radius.full`.

### no-floating-labels

Labels sit above fields. Flags `shrink: false` (floating labels) and fields that have a
`placeholder` but no `label`.

### no-raw-spacing

No raw `px`/`rem` spacing. Values exactly on the scale are auto-fixed without changing
the result: in `sx`, `'16px'` → `4` (theme units); in `style`, `'16px'` →
`'var(--fabric-space-400)'`. Off-scale values (`15px`) are reported for a human to
choose — prefer a relationship token (`space.between-buttons`, `space.card-padding`…).

### prefer-fabric-components

Importing `Button`, `TextField`, `Card`, `Alert` or `Dialog` from `@mui/material` when
Fabric has one with an intent-based API. Not auto-fixed: the props differ.

## Drift score

```bash
npx fabric-drift src                     # Markdown report
npx fabric-drift src --json              # machine-readable
npx fabric-drift src --min-score 95      # fail CI below 95%
```

**Drift score** = share of style values (`sx`, `style`, `styled`, `css`) that follow
Fabric. The report lists issues by rule, the files with the most issues, and which
issues have a safe auto-fix (`npx eslint --fix`).
