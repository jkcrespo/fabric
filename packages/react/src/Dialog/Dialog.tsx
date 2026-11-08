import { useId, type ReactNode } from 'react';
import MuiDialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps {
  /** Whether the dialog is shown. */
  open: boolean;
  /** Called when the user closes the dialog (close button, Escape or backdrop click). */
  onClose: () => void;
  /** Short title that says what the dialog is about. Also its accessible name. */
  title: string;
  /** One or two sentences explaining the decision. Read out by screen readers. */
  description?: ReactNode;
  /** Extra content, e.g. a form. */
  children?: ReactNode;
  /** Buttons, right-aligned. Put the confirming action last. */
  actions?: ReactNode;
  /** Maximum width. `sm` for confirmations, `md` for forms, `lg` for rich content. */
  size?: DialogSize;
  /** Allow closing with Escape, backdrop click and the close button. Turn off only while saving. */
  dismissible?: boolean;
}

function CloseIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
    </SvgIcon>
  );
}

/** Interrupts the user for a decision or a short focused task. */
export function Dialog({ open, onClose, title, description, children, actions, size = 'sm', dismissible = true }: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <MuiDialog
      open={open}
      onClose={dismissible ? onClose : undefined}
      maxWidth={size}
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <DialogTitle
        id={titleId}
        variant="h5"
        component="h2"
        sx={(t) => ({
          px: t.fabric.space.containerPadding,
          pt: t.fabric.space.containerPadding,
          pb: t.fabric.space.titleToContentNear,
          pr: dismissible ? t.fabric.space['1200'] : t.fabric.space.containerPadding,
        })}
      >
        {title}
      </DialogTitle>
      {dismissible && (
        <IconButton aria-label="Close" onClick={onClose} sx={(t) => ({ position: 'absolute', top: t.fabric.space['300'], right: t.fabric.space['300'] })}>
          <CloseIcon />
        </IconButton>
      )}
      {(description || children) && (
        <DialogContent sx={(t) => ({ px: t.fabric.space.containerPadding, pb: actions ? 0 : t.fabric.space.containerPadding })}>
          {description && <DialogContentText id={descriptionId}>{description}</DialogContentText>}
          {children}
        </DialogContent>
      )}
      {actions && (
        <DialogActions
          sx={(t) => ({
            p: t.fabric.space.containerPadding,
            pt: t.fabric.space.contentToButtons,
            gap: t.fabric.space.betweenButtons,
            '& > :not(style) ~ :not(style)': { ml: 0 },
          })}
        >
          {actions}
        </DialogActions>
      )}
    </MuiDialog>
  );
}
