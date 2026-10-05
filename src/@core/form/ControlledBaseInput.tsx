"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ChangeEvent } from "react";
import {
  useController,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import BaseInput, { type BaseInputProps } from "./BaseInput";
import { font, palette } from "@/theme/palette";

export type ControlledBaseInputProps<T extends FieldValues> =
  UseControllerProps<T> &
  Omit<BaseInputProps, "name" | "defaultValue" | "value" | "error"> & {
    /** Render as a plain label + value (detail/review screens). */
    readOnly?: boolean;
    /** Transforms the raw input text before it's stored in form state, e.g. phone number grouping. */
    format?: (value: string) => string;
  };

export default function ControlledBaseInput<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  disabled,
  readOnly,
  format,
  ...rest
}: ControlledBaseInputProps<T>) {
  // NOTE: `disabled` must NOT be passed to useController — RHF omits disabled
  // fields from submission data, so `disabled={isSubmitting}` would blank the
  // payload mid-submit. It's a visual prop on the input only.
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error },
  } = useController({ name, control, defaultValue, rules });

  if (readOnly) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 0.5, fontsize: font.size.md, fontWeight: font.weight.medium }}
        >
          {rest.label}
        </Typography>
        <Typography variant="body1" sx={{ minHeight: 24 }}>
          {value || "-"}
        </Typography>
      </Box>
    );
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(format ? format(event.target.value) : event.target.value);
  };

  return (
    <BaseInput
      {...rest}
      onChange={handleChange}
      onBlur={onBlur}
      value={value ?? ""}
      inputRef={ref}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error?.message ?? rest.helperText}
      sx={[
        { "& .MuiInputBase-input::placeholder": { color: palette.text.secondary, opacity: 1 } },
        ...(Array.isArray(rest.sx) ? rest.sx : rest.sx ? [rest.sx] : []),
      ]}
    />
  );
}
