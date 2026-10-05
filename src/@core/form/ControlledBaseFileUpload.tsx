"use client";

import {
  useController,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import BaseFileUpload, { type BaseFileUploadProps } from "./BaseFileUpload";

export type ControlledBaseFileUploadProps<T extends FieldValues> =
  UseControllerProps<T> &
    Omit<BaseFileUploadProps, "value" | "onChange" | "error">;

/**
 * react-hook-form wrapper for BaseFileUpload. The form value is `File[]`.
 * Validate with rules (e.g. required) or a yup schema.
 */
export default function ControlledBaseFileUpload<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  disabled,
  ...rest
}: ControlledBaseFileUploadProps<T>) {
  // NOTE: `disabled` must NOT be passed to useController — RHF omits disabled
  // fields from submission data. Visual prop only.
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({ name, control, defaultValue, rules });

  return (
    <BaseFileUpload
      {...rest}
      value={(value as File[] | undefined) ?? []}
      onChange={onChange}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error?.message ?? rest.helperText}
    />
  );
}
