import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import { Alert } from './Alert.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  args: { severity: 'danger', title: "We couldn't save your changes", children: 'Check the highlighted fields and try again.' },
  argTypes: {
    severity: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] },
    variant: { control: 'inline-radio', options: ['subtle', 'solid', 'outline'] },
  },
  decorators: [(Story) => <div style={{ maxWidth: 560 }}><Story /></div>],
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const severities = ['info', 'success', 'warning', 'danger'] as const;
export const AllSeverities: Story = {
  render: () => (
    <Stack spacing={6}>
      {(['subtle', 'solid', 'outline'] as const).map((variant) => (
        <Stack key={variant} spacing={2}>
          {severities.map((s) => (
            <Alert key={s} severity={s} variant={variant}>
              {variant} · {s}
            </Alert>
          ))}
        </Stack>
      ))}
    </Stack>
  ),
};

export const WithAction: Story = {
  args: {
    severity: 'warning',
    title: undefined,
    children: 'Your plan ends in 3 days.',
    action: <Button variant="ghost" size="sm" color="secondary">Renew</Button>,
  },
};
