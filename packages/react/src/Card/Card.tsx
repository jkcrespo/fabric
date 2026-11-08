import { forwardRef, type ReactNode } from 'react';
import MuiCard from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

export type CardVariant = 'elevated' | 'outlined';
export type CardSize = 'sm' | 'md' | 'lg';

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
  /** Sets radius and padding together: sm (6px radius, 12px padding), md (8px, 16px), lg (12px, 24px). */
  size?: CardSize;
  children?: ReactNode;
  /** Accessible name when the card has no title. */
  'aria-label'?: string;
  /** Layout-only style overrides. */
  sx?: SxProps<Theme>;
}

/** Radius and spacing tokens per size (Fabric radius logic + spacing relationships). */
const SIZE = {
  sm: { radius: 'cardSm', padding: 'cardPaddingNear', titleToContent: 'titleToContentNear' },
  md: { radius: 'cardMd', padding: 'cardPadding', titleToContent: 'titleToContentFar' },
  lg: { radius: 'cardLg', padding: 'containerPadding', titleToContent: 'titleToContentFar' },
} as const;

/** Groups related content and actions on a raised surface. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { title, subtitle, headingLevel = 3, actions, variant = 'elevated', size = 'md', children, sx, ...rest },
  ref
) {
  const hasHeader = Boolean(title || subtitle);
  return (
    <MuiCard
      ref={ref}
      variant={variant === 'outlined' ? 'outlined' : 'elevation'}
      elevation={variant === 'outlined' ? 0 : 1}
      sx={[
        (t) => ({
          borderRadius: t.fabric.radius[SIZE[size].radius],
          p: t.fabric.space[SIZE[size].padding],
          display: 'flex',
          flexDirection: 'column',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {hasHeader && (
        <Stack
          sx={(t) => ({
            gap: t.fabric.space.betweenTitlesNear,
            mb: children || actions ? t.fabric.space[SIZE[size].titleToContent] : 0,
          })}
        >
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
        <Stack
          direction="row"
          sx={(t) => ({
            gap: t.fabric.space.betweenButtons,
            mt: children ? t.fabric.space.contentToButtons : 0,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          })}
        >
          {actions}
        </Stack>
      )}
    </MuiCard>
  );
});
