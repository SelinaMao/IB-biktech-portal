"use client";

import React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronDown } from "lucide-react";

import BaseInput from "./BaseInput";
import { palette, radius } from "@/theme/palette";

export type CurrencyOption = {
  value: string;
  label: React.ReactNode;
  name: string;
  flag: string;
};

export type BaseAmountCurrencyFieldProps = {
  label?: React.ReactNode;
  amount: string;
  onAmountChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  options: CurrencyOption[];
  disabled?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
};

/**
 * Single bordered "Amount" field with the currency picker embedded as an end
 * adornment (a dark pill that opens a flag/name/code menu), matching the
 * combined amount+currency input in the transfer dialogs' design.
 */
export default function BaseAmountCurrencyField({
  label = "Amount",
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  options,
  disabled,
  error,
  helperText,
}: BaseAmountCurrencyFieldProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  return (
    <>
      <BaseInput
        label={label}
        value={amount}
        onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9.,]/g, ""))}
        placeholder="Enter amount"
        inputMode="decimal"
        disabled={disabled}
        error={error}
        helperText={helperText}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Box
                  component="button"
                  type="button"
                  disabled={disabled}
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    bgcolor: palette.navy[800],
                    color: palette.white,
                    border: "none",
                    borderRadius: `${radius.pill}px`,
                    px: 3.5,
                    py: 1.2,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                    "&:disabled": { opacity: 0.5, cursor: "default" },
                  }}
                >
                  {currency}
                  <ChevronDown size={14} />
                </Box>
              </InputAdornment>
            ),
          },
        }}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 220, mt: 0.5 } } }}
      >
        {options.map((option, index) => {
          const showBorder = index < options.length - 1;
          return (
            <MenuItem
              key={option.value}
              selected={option.value === currency}
              onClick={() => {
                onCurrencyChange(option.value);
                setAnchorEl(null);
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  width: "100%",
                  pb: showBorder ? 1.25 : 0,
                  borderBottom: showBorder ? `1px solid ${palette.slate[200]}` : "none",
                }}
              >
                <Avatar src={option.flag} sx={{ width: 26, height: 26 }} />
                <Stack spacing={0}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{option.name}</Typography>
                  <Typography variant="caption" sx={{ color: palette.slate[400] }}>
                    {option.value}
                  </Typography>
                </Stack>
              </Box>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
