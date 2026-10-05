"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import { ChevronDown } from "lucide-react";
import { palette } from "@/theme/palette";
import BaseInput, { type BaseInputProps } from "./BaseInput";

export type SelectOption = {
  value: string | number;
  label: React.ReactNode;
  /** Secondary line rendered under the label (e.g. account number). */
  description?: React.ReactNode;
  disabled?: boolean;
};

export type BaseSelectProps = Omit<BaseInputProps, "select" | "children"> & {
  options: SelectOption[];
  /** Shown as the first, disabled entry when value is empty. */
  placeholder?: string;
};

/**
 * Dumb select (BaseInput `select` variant) — external label comes from
 * BaseInput/FieldWrapper. Options come as data, not JSX.
 */
export default function BaseSelect({
  options,
  placeholder,
  slotProps,
  ...rest
}: BaseSelectProps) {
  return (
    <BaseInput
      {...rest}
      select
      slotProps={{
        ...slotProps,
        select: {
          displayEmpty: Boolean(placeholder),
          // Don't move focus onto the selected item when the dropdown opens
          // (no "pre-hovered" highlight). Arrow keys still work after opening.
          MenuProps: { disableAutoFocusItem: true },
          IconComponent: (props: React.ComponentProps<typeof ChevronDown>) => (
            <ChevronDown size={18} color={palette.icon.default} {...props} />
          ),
          ...slotProps?.select,
        },
      }}
    >
      {placeholder ? (
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
      ) : null}
      {options.map((option, index) => {
        const showBorder =
          index < options.length - 1 && option.value !== rest.value;
        return (
          <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
            <Box
              sx={{
                width: "100%",
                pb: showBorder ? 1.5 : 0,
                borderBottom: showBorder
                  ? `1px solid ${palette.slate[200]}`
                  : "none",
              }}
            >
              {option.label}
            </Box>
          </MenuItem>
        );
      })}
    </BaseInput>
  );
}
