"use client";

import Checkbox, { type CheckboxProps } from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import type { SxProps, Theme } from "@mui/material/styles";

export type BaseCheckboxProps = Omit<CheckboxProps, "sx"> & {
  label: React.ReactNode;
  /** Styles for the checkbox itself. */
  sx?: SxProps<Theme>;
  /** Styles for the wrapping FormControlLabel. */
  labelSx?: SxProps<Theme>;
};

export default function BaseCheckbox({
  label,
  sx,
  labelSx,
  ...rest
}: BaseCheckboxProps) {
  return (
    <FormControlLabel
      sx={labelSx}
      control={<Checkbox {...rest} sx={sx} />}
      label={label}
    />
  );
}
