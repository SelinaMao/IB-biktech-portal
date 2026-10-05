"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import { font, palette, radius } from "@/theme/palette";
import FieldWrapper, { type LabelPosition } from "./FieldWrapper";

export type BaseSwitchOption = {
  value: any;
  label?: React.ReactNode;
  icon?: React.ReactNode;
};

export type BaseSwitchProps = {
  options?: readonly BaseSwitchOption[] | BaseSwitchOption[];
  value?: any;
  onChange?: (value: any) => void;
  label?: React.ReactNode;
  labelPosition?: LabelPosition;
  labelWidth?: number;
  isRequired?: boolean;
  disabled?: boolean;
  activeBgcolor?: string;
  activeColor?: string;
  sx?: SxProps<Theme>;
  itemSx?: SxProps<Theme>;
};

const DEFAULT_OPTIONS: BaseSwitchOption[] = [
  { value: false, label: "Off" },
  { value: true, label: "On" },
];

export default function BaseSwitch({
  options = DEFAULT_OPTIONS,
  value,
  onChange,
  label,
  labelPosition = "top",
  labelWidth,
  isRequired,
  disabled = false,
  activeBgcolor,
  activeColor,
  sx,
  itemSx,
}: BaseSwitchProps) {
  const switchComponent = (
    <Stack
      direction="row"
      sx={[
        {
          display: "inline-flex",
          bgcolor: palette.slate[100],
          borderRadius: `${radius.xl}px`,
          p: 0.5,
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
          width: "fit-content",
          minHeight: 33,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Box
            key={String(opt.value)}
            component="button"
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(opt.value)}
            sx={[
              {
                border: 0,
                cursor: "pointer",
                borderRadius: "14px !important",
                minWidth: 46,
                py: 0.5,
                px: 2,
                fontFamily: "inherit",
                fontSize: font.size.sm,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                bgcolor: active
                  ? (activeBgcolor ?? palette.navy[800])
                  : "transparent",
                color: active
                  ? (activeColor ?? palette.white)
                  : palette.slate[500],
                transition: "all 150ms ease",
                "&:hover": {
                  bgcolor: active
                    ? (activeBgcolor ?? palette.navy[800])
                    : palette.slate[200],
                },
              },
              ...(Array.isArray(itemSx) ? itemSx : itemSx ? [itemSx] : []),
            ]}
          >
            {opt.icon}
            {opt.label}
          </Box>
        );
      })}
    </Stack>
  );

  return (
    <FieldWrapper
      label={label}
      labelPosition={labelPosition}
      labelWidth={labelWidth}
      isRequired={isRequired}
    >
      {switchComponent}
    </FieldWrapper>
  );
}
