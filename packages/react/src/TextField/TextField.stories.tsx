import type { Meta, StoryObj } from '@storybook/react-vite';
import Stack from '@mui/material/Stack';
import { TextField } from './TextField.js';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  args: { label: 'Email', type: 'email', placeholder: 'name@company.com', helperText: "We'll never share it." },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  decorators: [(Story) => <div style={{ maxWidth: 400 }}><Story /></div>],
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithError: Story = { args: { defaultValue: 'name@', error: 'Enter an email like name@company.com' } };
export const States: Story = {
  render: () => (
    <Stack spacing={4}>
      <TextField label="Default" />
      <TextField label="Required" required />
      <TextField label="Disabled" disabled defaultValue="Can't edit" />
      <TextField label="Read only" readOnly defaultValue="Visible, not editable" />
      <TextField label="Small" size="sm" />
      <TextField label="Message" multiline rows={3} helperText="Max 500 characters" />
    </Stack>
  ),
};
