import { forwardRef, type ReactNode } from 'react';
import MuiCard from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

export type CardVariant = 'elevated' | 'outlined';
export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps {
  /** Card heading. */
  title?: ReactNode;
  /** One line of supporting text under the title. */
  subtitle?: ReactNode;
  /** Heading level of the title, so the page outline stays correct. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Buttons shown at the bottom, right-aligned. Put the primary action last. */
  actions?: ReactNode;
  /** `elevated` (shadow) on page backgrounds; `outlined` (border) inside other surfaces or dense grids. */
  variant?: CardVariant;
  /** Inner spacing, from the space tokens. */
  padding?: CardPadding;
  children?: ReactNode;
  /** Accessible name when the card has no title. */
  'aria-label'?: string;
  /** Layout-only style overrides. */
  sx?: SxProps<Theme>;
}

/** Groups related content and actions on a raised surface. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { title, subtitle, headingLevel = 3, actions, variant = 'elevated', padding = 'md', children, sx, ...rest },
  ref
) {
  return (
    <MuiCard
      ref={ref}
      variant={variant === 'outlined' ? 'outlined' : 'elevation'}
      elevation={variant === 'outlined' ? 0 : 1}
      sx={[(t) => ({ p: t.fabric.space[padding], display: 'flex', flexDirection: 'column', gap: t.fabric.space.md }), ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    >
      {(title || subtitle) && (
        <Stack sx={{ gap: (t) => t.fabric.space['2xs'] }}>
          {title && (
            <Typography variant="h5" component={`h${headingLevel}`}>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Stack>
      )}
      {children}
      {actions && (
        <Stack direction="row" sx={{ gap: (t) => t.fabric.space.xs, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {actions}
        </Stack>
      )}
    </MuiCard>
  );
});
