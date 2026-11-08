import { useMemo, type ReactNode } from 'react';
import { ThemeProvider, useTheme, type Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import type { FabricBrand } from '@jkcrespo/fabric-tokens';
import { createFabricTheme, MODE_ATTRIBUTE, MODE_STORAGE_KEY } from './createFabricTheme.js';

export type FabricMode = 'light' | 'dark' | 'system';

export interface FabricProviderProps {
  /** A brand module from `@jkcrespo/fabric-tokens/<brand>`. */
  brand: FabricBrand;
  children?: ReactNode;
  /** Mode on first visit. The user's choice is remembered afterwards. @default 'system' */
  defaultMode?: FabricMode;
  /** Use your own theme (e.g. `createFabricTheme(brand, overrides)`). */
  theme?: Theme;
  /** Render MUI's CssBaseline (page reset + body colors). @default true */
  baseline?: boolean;
  /** Skip CSS transitions while switching light/dark, so nothing animates mid-switch. @default true */
  disableTransitionOnChange?: boolean;
}

/**
 * Sets up Fabric for an app: injects the brand's CSS variables, provides the MUI theme
 * and enables light/dark switching (use MUI's `useColorScheme()` to change it).
 */
export function FabricProvider({
  brand,
  children,
  defaultMode = 'system',
  theme,
  baseline = true,
  disableTransitionOnChange = true,
}: FabricProviderProps) {
  const muiTheme = useMemo(() => theme ?? createFabricTheme(brand), [theme, brand]);
  return (
    <ThemeProvider
      theme={muiTheme}
      defaultMode={defaultMode}
      modeStorageKey={MODE_STORAGE_KEY}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      <GlobalStyles styles={brand.css} />
      {baseline && <CssBaseline />}
      {children}
    </ThemeProvider>
  );
}

export interface FabricBrandScopeProps {
  /** A brand module from `@jkcrespo/fabric-tokens/<brand>`. */
  brand: FabricBrand;
  children?: ReactNode;
  /** Force a mode inside this scope. Omit to follow the page. */
  mode?: 'light' | 'dark';
  className?: string;
}

/**
 * Renders children in a different brand than the rest of the page — e.g. a brand
 * preview, or a co-branded section. Must be inside a `FabricProvider`.
 */
export function FabricBrandScope({ brand, children, mode, className }: FabricBrandScopeProps) {
  const theme = useTheme();
  const muiCss = useMemo(() => scopedMuiVars(theme, brand.brand), [theme, brand.brand]);
  return (
    <div data-fabric-brand={brand.brand} {...(mode ? { [MODE_ATTRIBUTE]: mode } : {})} className={className}>
      <GlobalStyles styles={brand.scopedCss + muiCss} />
      {children}
    </div>
  );
}

type StyleSheet = Record<string, Record<string, unknown>>;

/**
 * MUI declares its variables on :root as references to Fabric variables
 * (`--mui-palette-primary-main: var(--fabric-color-primary-background)`). CSS resolves
 * those references where they are declared, so a nested brand would still see the outer
 * brand. Re-declaring every reference-based MUI variable on the scope element makes them
 * resolve against the scope's Fabric variables instead.
 */
function scopedMuiVars(theme: Theme, brandId: string): string {
  const sheets = ((theme as unknown as { generateStyleSheets?: () => StyleSheet[] }).generateStyleSheets?.() ?? []);
  const base = `[data-fabric-brand="${brandId}"]`;
  const dark = `[${MODE_ATTRIBUTE}="dark"] ${base},\n${base}[${MODE_ATTRIBUTE}="dark"],\n${base} [${MODE_ATTRIBUTE}="dark"]`;
  const blocks = { light: [] as string[], dark: [] as string[] };
  for (const sheet of sheets) {
    for (const [selector, decls] of Object.entries(sheet)) {
      const target = selector.includes('dark') ? blocks.dark : blocks.light;
      for (const [name, value] of Object.entries(decls ?? {})) {
        if (name.startsWith('--') && /var\(|color-mix\(/.test(String(value))) target.push(`  ${name}: ${value};`);
      }
    }
  }
  return `\n${base} {\n${blocks.light.join('\n')}\n}\n${dark} {\n${blocks.dark.join('\n')}\n}\n`;
}

export interface FabricInitScriptProps {
  /** Must match `FabricProvider`'s `defaultMode`. @default 'system' */
  defaultMode?: FabricMode;
  nonce?: string;
}

/**
 * For server-rendered apps (Next.js, Remix…): put this at the start of `<body>` so the
 * right mode is applied before the page paints — no flash of the wrong theme.
 */
export function FabricInitScript({ defaultMode = 'system', nonce }: FabricInitScriptProps) {
  return <InitColorSchemeScript attribute={MODE_ATTRIBUTE} modeStorageKey={MODE_STORAGE_KEY} defaultMode={defaultMode} nonce={nonce} />;
}
