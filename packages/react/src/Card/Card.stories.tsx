import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Card } from './Card.js';
import { Button } from '../Button/Button.js';
import { TextField } from '../TextField/TextField.js';

const meta = {
  title: 'Components/Card',
  component: Card,
  args: {
    title: 'Pro plan',
    subtitle: 'Billed yearly',
    children: <Typography>Unlimited projects and priority support.</Typography>,
    actions: <Button>Upgrade</Button>,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['elevated', 'outlined'] },
    padding: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}><Story /></div>],
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Outlined: Story = { args: { variant: 'outlined' } };
export const FormSection: Story = {
  args: {
    title: 'Profile',
    subtitle: 'Shown to your teammates',
    children: (
      <Stack spacing={4}>
        <TextField label="Name" defaultValue="Ada Lovelace" />
        <TextField label="Email" type="email" defaultValue="ada@example.com" />
      </Stack>
    ),
    actions: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button>Save</Button>
      </>
    ),
  },
};
