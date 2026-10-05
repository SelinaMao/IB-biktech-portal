"use client";

import React from "react";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  useController,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";
import BaseSwitch, { type BaseSwitchProps } from "./BaseSwitch";
import { font } from "@/theme/palette";

export type ControlledBaseSwitchProps<T extends FieldValues> =
  UseControllerProps<T> &
    Omit<BaseSwitchProps, "name" | "defaultValue" | "value" | "onChange"> & {
      helperSx?: SxProps<Theme>;
    };

export default function ControlledBaseSwitch<T extends FieldValues>({
  name,
  control,
  defaultValue,
  rules,
  disabled,
  helperSx,
  ...rest
}: ControlledBaseSwitchProps<T>) {
  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({ name, control, defaultValue, rules });

  return (
    <FormControl error={Boolean(error)} sx={{ width: "fit-content" }}>
      <BaseSwitch
        {...rest}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {error?.message ? (
        <FormHelperText
          sx={[
            { ml: 1, mt: 0.5, fontSize: font.size.sm },
            ...(Array.isArray(helperSx) ? helperSx : helperSx ? [helperSx] : []),
          ]}
        >
          {error.message}
        </FormHelperText>
      ) : null}
    </FormControl>
  );
}
