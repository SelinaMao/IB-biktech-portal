"use client";

import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  useController,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import BaseCheckbox, { type BaseCheckboxProps } from "./BaseCheckbox";
import { font } from "@/theme/palette";

export type ControlledBaseCheckboxProps<T extends FieldValues> =
  UseControllerProps<T> &
  Omit<BaseCheckboxProps, "name" | "defaultValue" | "checked"> & {
    readOnly?: boolean;
    /** Styles for the error/helper text (e.g. lighter tint on dark panels). */
    helperSx?: SxProps<Theme>;
  };

export default function ControlledBaseCheckbox<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  disabled,
  readOnly,
  onChange: onExtraChange,
  helperSx,
  sx,
  ...rest
}: ControlledBaseCheckboxProps<T>) {
  // NOTE: `disabled` must NOT be passed to useController — RHF omits disabled
  // fields from submission data, so `disabled={isSubmitting}` would blank the
  // payload mid-submit. It's a visual prop on the input only.
  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({ name, control, defaultValue, rules });

  return (
    <FormControl error={Boolean(error)}>
      <BaseCheckbox
        {...rest}
        checked={Boolean(value)}
        onBlur={onBlur}
        disabled={disabled || readOnly}
        // Caller sx first, error tint last so the invalid state always shows.
        sx={[
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
          ...(error ? [{ color: "error.main" }] : []),
        ]}
        onChange={(event, checked) => {
          onChange(event);
          onExtraChange?.(event, checked);
        }}
      />
      {error?.message ? (
        <FormHelperText
          sx={[
            // Align under the label text (past the checkbox), tight to it —
            // compensates any bottom margin the caller put on the label row.
            { ml: 4, mt: { xs: -2, sm: -1.25 }, fontSize: font.size.sm },
            ...(Array.isArray(helperSx) ? helperSx : helperSx ? [helperSx] : []),
          ]}
        >
          {error.message}
        </FormHelperText>
      ) : null}
    </FormControl>
  );
}
