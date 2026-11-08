import '@fontsource-variable/noto-sans';
import { useEffect } from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import allBrands from '@jkcrespo/fabric-tokens/all';
import { FabricProvider, useColorScheme } from '@jkcrespo/fabric-theme';

type Mode = 'light' | 'dark' | 'system';

/** Keeps MUI's color scheme in sync with the toolbar. */
function ModeSync({ mode }: { mode: Mode }) {
  const { setMode } = useColorScheme();
  useEffect(() => setMode(mode), [mode, setMode]);
  return null;
}

const withFabric: Decorator = (Story, { globals }) => {
  const brand = allBrands[globals.brand as keyof typeof allBrands] ?? allBrands.fabric;
  return (
    <FabricProvider brand={brand} defaultMode="light">
      <ModeSync mode={(globals.mode as Mode) ?? 'light'} />
      <Story />
    </FabricProvider>
  );
};

const preview: Preview = {
  decorators: [withFabric],
  globalTypes: {
    brand: {
      description: 'Brand',
      toolbar: { title: 'Brand', icon: 'paintbrush', items: Object.keys(allBrands), dynamicTitle: true },
    },
    mode: {
      description: 'Light / dark',
      toolbar: { title: 'Mode', icon: 'mirror', items: ['light', 'dark', 'system'], dynamicTitle: true },
    },
  },
  initialGlobals: { brand: 'fabric', mode: 'light' },
  parameters: { layout: 'padded', controls: { expanded: true } },
};

export default preview;
