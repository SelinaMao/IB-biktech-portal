"use client";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { ChevronDown } from "lucide-react";
import { palette } from "@/theme/palette";
import BaseInput, { type BaseInputProps } from "./BaseInput";
import type { SelectOption } from "./BaseSelect";

export type BaseMultiSelectProps = Omit<BaseInputProps, "select" | "children" | "value" | "onChange"> & {
  options: SelectOption[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  /** Shown in place of the value summary when nothing is selected. */
  placeholder?: string;
};

/**
 * Checkbox multi-select (BaseInput `select` + `multiple` variant) — each
 * option renders with a checkbox, and the field shows a "N selected" summary
 * instead of chips. External label comes from BaseInput/FieldWrapper, same
 * as BaseSelect.
 */
export default function BaseMultiSelect({
  options,
  value,
  onChange,
  placeholder,
  slotProps,
  ...rest
}: BaseMultiSelectProps) {
  return (
    <BaseInput
      {...rest}
      select
      value={value}
      onChange={(event) => {
        const next = event.target.value as unknown as (string | number)[] | string;
        onChange(typeof next === "string" ? (next === "" ? [] : next.split(",")) : next);
      }}
      slotProps={{
        ...slotProps,
        select: {
          multiple: true,
          displayEmpty: Boolean(placeholder),
          // Don't move focus onto the selected item when the dropdown opens.
          MenuProps: { disableAutoFocusItem: true, PaperProps: { sx: { maxHeight: 320 } } },
          renderValue: (selected: unknown) => {
            const count = (selected as (string | number)[]).length;
            if (count === 0) {
              return placeholder ? (
                <Typography component="span" sx={{ color: palette.text.secondary, fontSize: "inherit" }}>
                  {placeholder}
                </Typography>
              ) : null;
            }
            return `${count} selected`;
          },
          IconComponent: (props: React.ComponentProps<typeof ChevronDown>) => (
            <ChevronDown size={18} color={palette.icon.default} {...props} />
          ),
          ...slotProps?.select,
        },
      }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
          <Checkbox checked={value.includes(option.value)} size="small" sx={{ mr: 1 }} />
          <Box component="span">
            <Box component="span" sx={{ display: "block" }}>
              {option.label}
            </Box>
            {option.description ? (
              <Box
                component="span"
                sx={{ display: "block", fontSize: "0.75rem", color: palette.text.secondary }}
              >
                {option.description}
              </Box>
            ) : null}
          </Box>
        </MenuItem>
      ))}
    </BaseInput>
  );
}
