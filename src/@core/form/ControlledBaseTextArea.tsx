"use client";

import {
  useController,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import BaseTextArea, { type BaseTextAreaProps } from "./BaseTextArea";

export type ControlledBaseTextAreaProps<T extends FieldValues> =
  UseControllerProps<T> &
    Omit<BaseTextAreaProps, "name" | "defaultValue" | "value" | "error">;

export default function ControlledBaseTextArea<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  disabled,
  ...rest
}: ControlledBaseTextAreaProps<T>) {
  // NOTE: `disabled` must NOT be passed to useController — RHF omits disabled
  // fields from submission data, so `disabled={isSubmitting}` would blank the
  // payload mid-submit. It's a visual prop on the input only.
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error },
  } = useController({ name, control, defaultValue, rules });

  return (
    <BaseTextArea
      {...rest}
      onChange={onChange}
      onBlur={onBlur}
      value={value ?? ""}
      inputRef={ref}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error?.message ?? rest.helperText}
    />
  );
}
