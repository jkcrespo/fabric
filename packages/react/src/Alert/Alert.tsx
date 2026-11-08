import { forwardRef, type ReactNode } from 'react';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import type { SxProps, Theme } from '@mui/material/styles';

export type AlertSeverity = 'info' | 'success' | 'warning' | 'danger';
export type AlertVariant = 'subtle' | 'solid' | 'outline';

export interface AlertProps {
  /** Meaning of the message. Sets color, icon and how urgently screen readers announce it. */
  severity?: AlertSeverity;
  /** `subtle` for inline messages, `solid` for high-priority banners, `outline` for low emphasis inside dense UI. */
  variant?: AlertVariant;
  /** Short bold summary above the message. */
  title?: ReactNode;
  /** The message. One or two sentences. */
  children?: ReactNode;
  /** Shows a close button. Omit for messages the user must not dismiss. */
  onClose?: () => void;
  /** A single action, e.g. a ghost Button "Retry". */
  action?: ReactNode;
  /** Replace the severity icon, or `false` to hide it. */
  icon?: ReactNode | false;
  /** Layout-only style overrides. */
  sx?: SxProps<Theme>;
}

const SEVERITY = { info: 'info', success: 'success', warning: 'warning', danger: 'error' } as const;
const VARIANT = { subtle: 'standard', solid: 'filled', outline: 'outlined' } as const;

/** A short message about the status of the page or a task. */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { severity = 'info', variant = 'subtle', title, children, onClose, ...rest },
  ref
) {
  // Errors and warnings interrupt screen readers; info and success are announced politely.
  const role = severity === 'danger' || severity === 'warning' ? 'alert' : 'status';
  return (
    <MuiAlert ref={ref} severity={SEVERITY[severity]} variant={VARIANT[variant]} role={role} onClose={onClose ? () => onClose() : undefined} {...rest}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {children}
    </MuiAlert>
  );
});
