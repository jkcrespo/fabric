import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import MuiButton from '@mui/material/Button';
import type { SxProps, Theme } from '@mui/material/styles';

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonColor = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** Visual emphasis. `solid` for the main action, `outline` for secondary actions, `ghost` for low-emphasis actions. */
  variant?: ButtonVariant;
  /** Intent. Use `danger` only for destructive actions. */
  color?: ButtonColor;
  /** Control height. `md` is the default for forms and dialogs. */
  size?: ButtonSize;
  /** Shows a spinner, keeps the button's width and blocks clicks. */
  loading?: boolean;
  /** Icon before the label. */
  startIcon?: ReactNode;
  /** Icon after the label. */
  endIcon?: ReactNode;
  /** Stretch to the width of the container. */
  fullWidth?: boolean;
  /** Renders a link that looks like a button. Use for navigation, not for actions. */
  href?: string;
  /** Layout-only style overrides (margin, alignment). Never pass colors or sizes. */
  sx?: SxProps<Theme>;
}

const VARIANT = { solid: 'contained', outline: 'outlined', ghost: 'text' } as const;
const COLOR = { primary: 'primary', secondary: 'secondary', danger: 'error' } as const;
const SIZE = { sm: 'small', md: 'medium', lg: 'large' } as const;

/** Triggers an action. For navigation pass `href`. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'solid', color = 'primary', size = 'md', ...rest },
  ref
) {
  return <MuiButton ref={ref} variant={VARIANT[variant]} color={COLOR[color]} size={SIZE[size]} disableElevation {...rest} />;
});
