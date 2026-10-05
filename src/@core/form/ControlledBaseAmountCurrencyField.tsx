"use client";

import {
  useController,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import BaseAmountCurrencyField, {
  type BaseAmountCurrencyFieldProps,
} from "./BaseAmountCurrencyField";

export type AmountCurrencyValue = { amount: string; currency: string };

export type ControlledBaseAmountCurrencyFieldProps<T extends FieldValues> =
  UseControllerProps<T> &
    Omit<
      BaseAmountCurrencyFieldProps,
      "amount" | "onAmountChange" | "currency" | "onCurrencyChange" | "error" | "helperText"
    >;

/**
 * Controlled `BaseAmountCurrencyField` — `name` points to a single
 * `{ amount, currency }` object field in form state (like
 * `ControlledBaseMultiSelect` treats its value as an array).
 */
export default function ControlledBaseAmountCurrencyField<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  disabled,
  ...rest
}: ControlledBaseAmountCurrencyFieldProps<T>) {
  // NOTE: `disabled` must NOT be passed to useController — RHF omits disabled
  // fields from submission data, so `disabled={isSubmitting}` would blank the
  // payload mid-submit. It's a visual prop on the input only.
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({ name, control, defaultValue, rules });

  const current = (value ?? {}) as Partial<AmountCurrencyValue>;

  return (
    <BaseAmountCurrencyField
      {...rest}
      amount={current.amount ?? ""}
      onAmountChange={(amount) => onChange({ ...current, amount })}
      currency={current.currency ?? rest.options[0]?.value ?? ""}
      onCurrencyChange={(currency) => onChange({ ...current, currency })}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error?.message}
    />
  );
}
