// Compile-only check that the published types work for a consumer.
import { brands, type FabricBrandId, type FabricTokens } from '@jkcrespo/fabric-tokens';
import acme, { tokens, vars } from '@jkcrespo/fabric-tokens/acme';

const id: FabricBrandId = brands[0];
const light: FabricTokens = tokens.light;
const fill: string = light.color.primary.backgroundHover;
const weight: number = tokens.dark.typography.bodyMd.fontWeight;
const cssVar: string = vars.space.md;
const bp: number = acme.breakpoints.md;

// @ts-expect-error primitives are not part of the public API
tokens.light.primitive;
// @ts-expect-error unknown brand ids are rejected
const bad: FabricBrandId = 'not-a-brand';

export { id, fill, weight, cssVar, bp, bad };
