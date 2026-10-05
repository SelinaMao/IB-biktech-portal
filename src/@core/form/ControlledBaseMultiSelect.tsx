"use client";

import {
  useController,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import BaseMultiSelect, { type BaseMultiSelectProps } from "./BaseMultiSelect";

export type ControlledBaseMultiSelectProps<T extends FieldValues> =
  UseControllerProps<T> &
    Omit<BaseMultiSelectProps, "name" | "defaultValue" | "value" | "error" | "onChange">;

export default function ControlledBaseMultiSelect<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  disabled,
  ...rest
}: ControlledBaseMultiSelectProps<T>) {
  // NOTE: `disabled` must NOT be passed to useController — RHF omits disabled
  // fields from submission data, so `disabled={isSubmitting}` would blank the
  // payload mid-submit. It's a visual prop on the input only.
  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({ name, control, defaultValue, rules });

  const selected = Array.isArray(value) ? (value as (string | number)[]) : [];

  return (
    <BaseMultiSelect
      {...rest}
      value={selected}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error?.message ?? rest.helperText}
    />
  );
}
