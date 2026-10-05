"use client";

import BaseInput, { type BaseInputProps } from "./BaseInput";

export type BaseTextAreaProps = Omit<BaseInputProps, "multiline"> & {
  minRows?: number;
  maxRows?: number;
};

export default function BaseTextArea({
  minRows = 3,
  maxRows = 8,
  ...rest
}: BaseTextAreaProps) {
  return <BaseInput {...rest} multiline minRows={minRows} maxRows={maxRows} />;
}
