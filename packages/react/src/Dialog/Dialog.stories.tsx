import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dialog } from './Dialog.js';
import { Button } from '../Button/Button.js';
import { TextField } from '../TextField/TextField.js';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  args: {
    open: true,
    onClose: () => {},
    title: 'Delete project?',
    description: "This removes the project and its files for everyone. You can't undo this.",
  },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DestructiveConfirmation: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button color="danger" onClick={() => setOpen(true)}>Delete project</Button>
        <Dialog
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          actions={
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button color="danger" onClick={() => setOpen(false)}>Delete</Button>
            </>
          }
        />
      </>
    );
  },
};

export const ShortForm: Story = {
  args: { title: 'Invite teammate', description: undefined, size: 'md' },
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Invite</Button>
        <Dialog {...args} open={open} onClose={() => setOpen(false)} actions={<Button onClick={() => setOpen(false)}>Send invite</Button>}>
          <TextField label="Email" type="email" autoComplete="email" sx={{ mt: 2 }} />
        </Dialog>
      </>
    );
  },
};
