// Fabric lints itself with the plugin it publishes.
import tsParser from '@typescript-eslint/parser';
import fabric from '@jkcrespo/eslint-plugin-fabric';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/storybook-static/**', 'tests/fixtures/**'] },
  {
    files: ['packages/react/src/**/*.{ts,tsx}', 'packages/react/.storybook/**/*.{ts,tsx}', 'tests/browser/**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
    ...fabric.configs.recommended,
  },
  {
    // The component wrappers and the theme test page use raw MUI on purpose.
    files: ['packages/react/src/*/[A-Z]*.tsx', 'tests/browser/**'],
    ignores: ['**/*.stories.tsx'],
    rules: { 'fabric/prefer-fabric-components': 'off' },
  },
];
