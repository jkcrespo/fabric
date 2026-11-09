import { readFileSync } from 'node:fs';
import noHardcodedColors from './rules/no-hardcoded-colors.js';
import noRawSpacing from './rules/no-raw-spacing.js';
import noRawRadius from './rules/no-raw-radius.js';
import noRawTypography from './rules/no-raw-typography.js';
import noUnknownTokens from './rules/no-unknown-tokens.js';
import noFloatingLabels from './rules/no-floating-labels.js';
import preferFabricComponents from './rules/prefer-fabric-components.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const plugin = {
  meta: { name: pkg.name, version: pkg.version },
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'no-raw-spacing': noRawSpacing,
    'no-raw-radius': noRawRadius,
    'no-raw-typography': noRawTypography,
    'no-unknown-tokens': noUnknownTokens,
    'no-floating-labels': noFloatingLabels,
    'prefer-fabric-components': preferFabricComponents,
  },
  configs: {},
};

/** Style rules feed the drift score; the others guard tokens, labels and components. */
export const STYLE_RULES = ['no-hardcoded-colors', 'no-raw-spacing', 'no-raw-radius', 'no-raw-typography'];

plugin.configs.recommended = {
  name: 'fabric/recommended',
  plugins: { fabric: plugin },
  rules: {
    'fabric/no-hardcoded-colors': 'error',
    'fabric/no-unknown-tokens': 'error',
    'fabric/no-floating-labels': 'error',
    'fabric/no-raw-typography': 'error',
    'fabric/no-raw-radius': 'error',
    'fabric/no-raw-spacing': 'warn',
    'fabric/prefer-fabric-components': 'warn',
  },
};

export default plugin;
