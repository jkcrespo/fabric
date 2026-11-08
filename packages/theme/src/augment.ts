import type { FabricVars } from '@jkcrespo/fabric-tokens';

declare module '@mui/material/styles' {
  /** Fabric themes always use CSS variables. */
  interface CssThemeVariables {
    enabled: true;
  }
  interface Theme {
    /**
     * Every Fabric semantic token as a `var(--fabric-…)` reference — including the ones
     * MUI has no slot for, e.g. `theme.fabric.color.surface.sunken`.
     */
    fabric: FabricVars;
  }
  interface ThemeOptions {
    fabric?: FabricVars;
  }
}

export {};
