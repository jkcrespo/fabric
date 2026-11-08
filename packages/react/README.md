# @jkcrespo/fabric-react

React components for [Fabric](https://github.com/jkcrespo/fabric), built on MUI. Each
component has a small, intent-based API and a machine-readable contract for AI agents.

```bash
npm install @jkcrespo/fabric-react @jkcrespo/fabric-tokens @mui/material @emotion/react @emotion/styled
```

```tsx
import acme from '@jkcrespo/fabric-tokens/acme';
import { FabricProvider, Card, TextField, Button } from '@jkcrespo/fabric-react';

<FabricProvider brand={acme}>
  <Card title="Profile" actions={<Button>Save</Button>}>
    <TextField label="Email" type="email" />
  </Card>
</FabricProvider>
```

| Component | For | Key props |
| --- | --- | --- |
| `Button` | Actions | `variant` solid · outline · ghost, `color` primary · secondary · danger, `size`, `loading` |
| `TextField` | Text input | `label` (required), `error` (message), `helperText`, `type`, `size` |
| `Card` | Grouping content | `title`, `subtitle`, `actions`, `variant` elevated · outlined, `padding` |
| `Alert` | Status messages | `severity` info · success · warning · danger, `variant` subtle · solid · outline, `title` |
| `Dialog` | Decisions, short tasks | `open`, `onClose`, `title`, `description`, `actions`, `size` |

Any other MUI component works too and picks up the Fabric theme automatically.

## Metadata for agents

Every component has `src/<Name>/<name>.meta.json` following
[`schemas/component.schema.json`](../../schemas/component.schema.json): intent, props,
variants, sizes, states, when to use and when not, composition rules, tokens,
accessibility and examples. The build bundles them into
`@jkcrespo/fabric-react/components.json`.

`npm run validate:components` fails if a metadata file drifts from the code: it compares
props, required flags and allowed values with the TypeScript types, and checks tokens,
related components and examples.

## Storybook

```bash
npm run storybook        # from the repo root
```

Use the toolbar to switch brand and light/dark. Every story is checked with axe
(WCAG 2.1 AA) in every brand and mode by `npm run test:a11y`.

## Adding a component

1. `src/<Name>/<Name>.tsx` — export `<Name>` and `<Name>Props` (document each prop).
2. `src/<Name>/<name>.meta.json` — the contract.
3. `src/<Name>/<Name>.stories.tsx` and `src/<Name>/index.ts`; export from `src/index.ts`.
4. `npm run check`.
