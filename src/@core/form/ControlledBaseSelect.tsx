"use client";

import {
  useController,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import BaseSelect, { type BaseSelectProps } from "./BaseSelect";
import { palette } from "@/theme/palette";

export type ControlledBaseSelectProps<T extends FieldValues> =
  UseControllerProps<T> &
    Omit<BaseSelectProps, "name" | "defaultValue" | "value" | "error">;

export default function ControlledBaseSelect<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  disabled,
  ...rest
}: ControlledBaseSelectProps<T>) {
  // NOTE: `disabled` must NOT be passed to useController — RHF omits disabled
  // fields from submission data, so `disabled={isSubmitting}` would blank the
  // payload mid-submit. It's a visual prop on the input only.
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error },
  } = useController({ name, control, defaultValue, rules });

  return (
    <BaseSelect
      {...rest}
      onChange={onChange}
      onBlur={onBlur}
      value={value ?? ""}
      inputRef={ref}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error?.message ?? rest.helperText}
      sx={[
        !value && { "& .MuiSelect-select": { color: palette.text.secondary } },
        ...(Array.isArray(rest.sx) ? rest.sx : rest.sx ? [rest.sx] : []),
      ]}
    />
  );
}
