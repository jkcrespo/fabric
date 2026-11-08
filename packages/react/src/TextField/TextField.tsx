import { forwardRef, type ChangeEvent, type FocusEvent, type ReactNode, type Ref } from 'react';
import MuiTextField from '@mui/material/TextField';
import type { SxProps, Theme } from '@mui/material/styles';

export type TextFieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type TextFieldSize = 'sm' | 'md';

export interface TextFieldProps {
  /** Visible label. Always required — placeholders are not labels. */
  label: string;
  /** Form field name. */
  name?: string;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Input type. Picks the right mobile keyboard and autofill. */
  type?: TextFieldType;
  /** Example of the expected format, e.g. "name@company.com". */
  placeholder?: string;
  /** Short guidance shown under the field. Replaced by `error` when set. */
  helperText?: ReactNode;
  /** Error message. Setting it puts the field in the error state and announces the message. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Shows the value but prevents editing. Still focusable and submitted. */
  readOnly?: boolean;
  /** Multi-line text area. */
  multiline?: boolean;
  /** Visible rows when `multiline`. */
  rows?: number;
  /** Control height. `sm` for dense layouts like tables and toolbars. */
  size?: TextFieldSize;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  /** Browser autofill hint, e.g. "email", "current-password". */
  autoComplete?: string;
  id?: string;
  /** Ref to the underlying input element. */
  inputRef?: Ref<HTMLInputElement | HTMLTextAreaElement>;
  /** Layout-only style overrides. */
  sx?: SxProps<Theme>;
}

/** Single- or multi-line text input with a label, helper text and error message. */
export const TextField = forwardRef<HTMLDivElement, TextFieldProps>(function TextField(
  { error, helperText, size = 'md', fullWidth = true, readOnly, ...rest },
  ref
) {
  return (
    <MuiTextField
      ref={ref}
      variant="outlined"
      size={size === 'sm' ? 'small' : 'medium'}
      fullWidth={fullWidth}
      error={Boolean(error)}
      helperText={error ?? helperText}
      slotProps={{ htmlInput: { readOnly } }}
      {...rest}
    />
  );
});
