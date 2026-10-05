"use client";

import {
  useController,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import BaseRadioGroup, { type BaseRadioGroupProps } from "./BaseRadioGroup";

export type ControlledBaseRadioGroupProps<T extends FieldValues> =
  UseControllerProps<T> &
    Omit<BaseRadioGroupProps, "name" | "defaultValue" | "value" | "error">;

export default function ControlledBaseRadioGroup<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  disabled,
  ...rest
}: ControlledBaseRadioGroupProps<T>) {
  // NOTE: `disabled` must NOT be passed to useController — RHF omits disabled
  // fields from submission data, so `disabled={isSubmitting}` would blank the
  // payload mid-submit. It's a visual prop on the input only.
  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({ name, control, defaultValue, rules });

  return (
    <BaseRadioGroup
      {...rest}
      onChange={onChange}
      onBlur={onBlur}
      value={value ?? ""}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error?.message ?? rest.helperText}
    />
  );
}
