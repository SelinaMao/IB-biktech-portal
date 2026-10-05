"use client";

import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup, { type RadioGroupProps } from "@mui/material/RadioGroup";
import type { SelectOption } from "./BaseSelect";

export type BaseRadioGroupProps = RadioGroupProps & {
  label?: string;
  options: SelectOption[];
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
};

export default function BaseRadioGroup({
  label,
  options,
  error,
  helperText,
  disabled,
  row = true,
  ...rest
}: BaseRadioGroupProps) {
  return (
    <FormControl error={error} disabled={disabled}>
      {label ? <FormLabel>{label}</FormLabel> : null}
      <RadioGroup row={row} {...rest}>
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio />}
            label={option.label}
            disabled={option.disabled}
          />
        ))}
      </RadioGroup>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}
