# @jkcrespo/fabric-theme

The MUI theme for [Fabric](https://github.com/jkcrespo/fabric). Any Fabric brand becomes
a complete MUI theme with light and dark modes.

```bash
npm install @jkcrespo/fabric-theme @jkcrespo/fabric-tokens @mui/material @emotion/react @emotion/styled @fontsource-variable/noto-sans
```

Load the typeface once at your app entry: `import '@fontsource-variable/noto-sans';`.
Brands that use another font load that font instead.

## Use

```tsx
import acme from '@jkcrespo/fabric-tokens/acme';
import { FabricProvider } from '@jkcrespo/fabric-theme';
import Button from '@mui/material/Button';

export function App() {
  return (
    <FabricProvider brand={acme}>
      <Button variant="contained">Uses Acme orange</Button>
    </FabricProvider>
  );
}
```

`FabricProvider` injects the brand's CSS variables, provides the MUI theme, renders
`CssBaseline`, and follows the user's light/dark preference.

## Light / dark

```tsx
import { useColorScheme } from '@jkcrespo/fabric-theme';

const { mode, setMode } = useColorScheme(); // 'light' | 'dark' | 'system'
```

Switching sets `data-fabric-mode` on `<html>`. Every color is a CSS variable, so nothing
re-renders. The choice is saved in `localStorage` (`fabric-mode`).

Server rendering (Next.js, Remix…): add `<FabricInitScript />` at the start of `<body>`
to avoid a flash of the wrong mode.

## Several brands on one page

```tsx
<FabricBrandScope brand={fabric}>…</FabricBrandScope>
```

## How it works

- Every color, font, radius and shadow in the theme is a `var(--fabric-…)` reference.
  The brand's CSS decides the values, so one theme works for every brand.
- MUI's `nativeColor` option derives hover and disabled shades with CSS `color-mix()`.
- Tokens MUI has no slot for are on `theme.fabric`, typed:
  `theme.fabric.color.surface.sunken`, `theme.fabric.space.betweenButtons`, `theme.fabric.radius.cardLg`.
- Spacing unit is 4px: `theme.spacing(4)` = 16px = `space.400`.

| Fabric | MUI |
| --- | --- |
| `color.<role>.background / background-hover / subtle / foreground` | `palette.<role>.main / dark / light / contrastText` |
| `color.danger.*` | `palette.error.*` |
| `typography.display-lg … overline` | `typography.h1 … overline` (no uppercase on buttons or overline) |
| `radius.button` | Button |
| `radius.input` | `shape.borderRadius` (text fields, selects, chips) |
| `radius.card-md` | Paper, Card, menus, popovers |
| `radius.card-lg` | Dialog |
| `elevation.raised / floating / overlay / modal` | `shadows[1–2] / [3–8] / [9–16] / [17–24]` |
| `color.border.focus` | focus ring on every focusable MUI component |
| `space.label-to-input`, `typography.title-sm` | Input labels: static, above the field, left-aligned (no floating label, no notched border) |

Overrides: `createFabricTheme(brand, { components: { … } })` and pass it as
`<FabricProvider theme={…}>`.
