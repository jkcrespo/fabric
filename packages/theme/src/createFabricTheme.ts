import { createTheme, shouldSkipGeneratingVar, type Theme, type ThemeOptions } from '@mui/material/styles';
import type { FabricBrand, FabricVars } from '@jkcrespo/fabric-tokens';
import './augment.js';

/** The HTML attribute that switches light/dark. Shared with the token CSS. */
export const MODE_ATTRIBUTE = 'data-fabric-mode';
/** localStorage key MUI uses to remember the chosen mode. */
export const MODE_STORAGE_KEY = 'fabric-mode';

/** MUI typography variant ← Fabric semantic typography token. */
const TYPOGRAPHY = {
  h1: 'displayLg',
  h2: 'displayMd',
  h3: 'headingLg',
  h4: 'headingMd',
  h5: 'headingSm',
  h6: 'headingXs',
  subtitle1: 'titleMd',
  subtitle2: 'titleSm',
  body1: 'bodyMd',
  body2: 'bodySm',
  button: 'labelMd',
  caption: 'caption',
  overline: 'overline',
} as const satisfies Record<string, keyof FabricVars['typography']>;

/** MUI palette roles ← Fabric color roles. */
const ROLES = {
  primary: 'primary',
  secondary: 'secondary',
  error: 'danger',
  warning: 'warning',
  success: 'success',
  info: 'info',
} as const;

const ms = (duration: string) => parseInt(duration, 10);

/**
 * MUI needs 25 shadow levels. Fabric has four intents; each MUI level maps to the
 * intent of the components that use it (Paper 1 → raised, Menu 8 → floating,
 * Drawer 16 → overlay, Dialog 24 → modal).
 */
function shadows(v: FabricVars): Theme['shadows'] {
  const e = v.elevation;
  return Array.from({ length: 25 }, (_, i) =>
    i === 0 ? 'none' : i <= 2 ? e.raised : i <= 8 ? e.floating : i <= 16 ? e.overlay : e.modal
  ) as Theme['shadows'];
}

function palette(v: FabricVars) {
  const c = v.color;
  const roles = Object.fromEntries(
    Object.entries(ROLES).map(([mui, fabric]) => {
      const role = c[fabric];
      return [mui, { main: role.background, dark: role.backgroundHover, light: role.subtle, contrastText: role.foreground }];
    })
  );
  return {
    ...roles,
    background: { default: c.surface.default, paper: c.surface.raised },
    text: { primary: c.text.default, secondary: c.text.subtle, disabled: c.text.disabled },
    divider: c.border.default,
  };
}

/**
 * Build an MUI theme for Fabric.
 *
 * Every color, font, radius and shadow in the theme is a `var(--fabric-…)` reference,
 * so the same theme serves every brand: the brand's CSS (injected by `FabricProvider`)
 * decides the values. Light/dark switches through the `data-fabric-mode` attribute with
 * no re-render.
 *
 * @param brand  A brand module from `@jkcrespo/fabric-tokens/<brand>`.
 * @param overrides  Extra MUI theme options, deep-merged last.
 */
export function createFabricTheme(brand: FabricBrand, overrides: ThemeOptions = {}): Theme {
  const v = brand.vars;
  const motion = brand.tokens.light.motion; // system-owned: identical in every brand and mode
  const p = palette(v);

  const typography = Object.fromEntries(
    Object.entries(TYPOGRAPHY).map(([mui, fabric]) => [mui, { ...v.typography[fabric] }])
  );

  return createTheme(
    {
      cssVariables: {
        nativeColor: true, // derive hover/focus/disabled shades with CSS color-mix, so var() colors work
        colorSchemeSelector: MODE_ATTRIBUTE,
        cssVarPrefix: 'mui',
        shouldSkipGeneratingVar: (keys) => keys[0] === 'fabric' || shouldSkipGeneratingVar(keys),
      },
      colorSchemes: {
        light: { palette: p },
        dark: { palette: p },
      },
      fabric: v,
      spacing: 4,
      // MUI's single radius goes to input controls (text fields, selects, chips, toggles).
      shape: { borderRadius: v.radius.input },
      shadows: shadows(v),
      breakpoints: { values: brand.breakpoints },
      typography: {
        htmlFontSize: 16,
        fontFamily: v.typography.bodyMd.fontFamily,
        ...typography,
        button: { ...typography.button, textTransform: 'none' },
        // Emphasis through scale and weight, not text case.
        overline: { ...typography.overline, textTransform: 'none' },
      },
      transitions: {
        duration: {
          shortest: ms(motion.duration.fast),
          shorter: ms(motion.duration.fast),
          short: ms(motion.duration.normal),
          standard: ms(motion.duration.normal),
          complex: ms(motion.duration.slow),
          enteringScreen: ms(motion.duration.normal),
          leavingScreen: ms(motion.duration.fast),
        },
        easing: {
          easeInOut: v.motion.easing.standard,
          easeOut: v.motion.easing.enter,
          easeIn: v.motion.easing.exit,
          sharp: v.motion.easing.standard,
        },
      },
      components: {
        // Radius logic: buttons → radius.button, inputs → theme.shape (radius.input),
        // menus/popovers/cards → radius.card-md, dialogs → radius.card-lg.
        MuiButton: { styleOverrides: { root: { borderRadius: v.radius.button } } },
        // Dark surfaces come from color.surface.* tokens, so drop MUI's elevation overlay.
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' }, rounded: { borderRadius: v.radius.cardMd } } },
        MuiCard: { styleOverrides: { root: { borderRadius: v.radius.cardMd } } },
        MuiDialog: { styleOverrides: { paper: { borderRadius: v.radius.cardLg } } },
        // Labels sit above the input container, left-aligned, space.label-to-input apart —
        // no floating label and no notch cut into the border.
        MuiInputLabel: {
          defaultProps: { shrink: true },
          styleOverrides: {
            root: {
              position: 'static',
              transform: 'none',
              maxWidth: '100%',
              whiteSpace: 'normal',
              overflow: 'visible',
              marginBottom: v.space.labelToInput,
              ...v.typography.titleSm,
              color: v.color.text.default,
              '&.Mui-focused, &.Mui-error': { color: v.color.text.default },
              '&.Mui-disabled': { color: v.color.text.disabled },
              '& .MuiFormLabel-asterisk': { color: v.color.danger.text },
            },
          },
        },
        MuiFormLabel: {
          styleOverrides: {
            root: { ...v.typography.titleSm, color: v.color.text.default, '&.Mui-focused': { color: v.color.text.default } },
          },
        },
        // Helper and error text align with the label, flush left under the field.
        MuiFormHelperText: {
          styleOverrides: { root: { marginLeft: 0, marginRight: 0, marginTop: v.space['100'] } },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            notchedOutline: { top: 0, '& legend': { display: 'none' } },
          },
        },
        // One visible focus ring everywhere, in the brand's focus color.
        MuiButtonBase: {
          styleOverrides: {
            root: {
              '&.Mui-focusVisible': { outline: `2px solid ${v.color.border.focus}`, outlineOffset: '2px' },
            },
          },
        },
        // Alerts use the role tokens exactly as defined (contrast-checked), instead of
        // MUI's derived shades.
        MuiAlert: {
          styleOverrides: {
            root: {
              variants: Object.entries(ROLES).flatMap(([severity, role]) => {
                const c = v.color[role];
                const s = severity as 'error';
                return [
                  { props: { variant: 'standard', severity: s }, style: { backgroundColor: c.subtle, color: c.text, '& .MuiAlert-icon': { color: c.text } } },
                  { props: { variant: 'filled', severity: s }, style: { backgroundColor: c.background, color: c.foreground, '& .MuiAlert-icon': { color: c.foreground } } },
                  { props: { variant: 'outlined', severity: s }, style: { borderColor: c.text, color: c.text, '& .MuiAlert-icon': { color: c.text } } },
                ];
              }),
            },
          },
        },
        MuiCssBaseline: {
          styleOverrides: {
            body: { backgroundColor: v.color.surface.default, color: v.color.text.default },
          },
        },
      },
    },
    overrides
  );
}
