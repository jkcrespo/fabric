import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import { Button } from './Button.js';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Save changes' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'outline', 'ghost'] },
    color: { control: 'inline-radio', options: ['primary', 'secondary', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <Stack spacing={4}>
      {(['primary', 'secondary', 'danger'] as const).map((color) => (
        <Stack key={color} direction="row" spacing={2}>
          <Button color={color}>Solid</Button>
          <Button color={color} variant="outline">Outline</Button>
          <Button color={color} variant="ghost">Ghost</Button>
          <Button color={color} disabled>Disabled</Button>
        </Stack>
      ))}
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </Stack>
  ),
};

export const ActionGroup: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </Stack>
  ),
};

export const Loading: Story = { args: { loading: true } };
