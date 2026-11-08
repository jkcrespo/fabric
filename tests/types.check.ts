// Compile-only check that the published types work for a consumer.
import { brands, type FabricBrandId, type FabricTokens } from '@jkcrespo/fabric-tokens';
import acme, { tokens, vars } from '@jkcrespo/fabric-tokens/acme';

const id: FabricBrandId = brands[0];
const light: FabricTokens = tokens.light;
const fill: string = light.color.primary.backgroundHover;
const weight: number = tokens.dark.typography.bodyMd.fontWeight;
const cssVar: string = vars.space.betweenInputs;
const bp: number = acme.breakpoints.md;

// @ts-expect-error primitives are not part of the public API
tokens.light.primitive;
// @ts-expect-error unknown brand ids are rejected
const bad: FabricBrandId = 'not-a-brand';

export { id, fill, weight, cssVar, bp, bad };

// ---- @jkcrespo/fabric-theme
import { createFabricTheme, FabricProvider, FabricBrandScope, type FabricMode } from '@jkcrespo/fabric-theme';
import fabric from '@jkcrespo/fabric-tokens/fabric';
import { createElement } from 'react';

const theme = createFabricTheme(acme, { spacing: 4 });
const sunken: string = theme.fabric.color.surface.sunken; // tokens MUI has no slot for
const main: string = theme.palette.primary.main;
const mode: FabricMode = 'system';
const app = createElement(FabricProvider, { brand: acme, defaultMode: mode }, createElement(FabricBrandScope, { brand: fabric }));

// @ts-expect-error brand is required
createElement(FabricProvider, {});

export { theme, sunken, main, app };
