"use client";

import React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronDown } from "lucide-react";

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
 * Modern combined amount input with teal currency dropdown badge on the left,
 * matching the target design screenshot.
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
    <Box>
      {typeof label === "string" ? (
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", mb: 1 }}>
          {label}
        </Typography>
      ) : (
        label
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: "#FFFFFF",
          borderRadius: "12px",
          border: error ? "1.5px solid #EF4444" : "1px solid #E2E8F0",
          px: 1.5,
          py: 1,
          minHeight: 52,
          transition: "border-color 0.15s ease",
          "&:hover": {
            borderColor: error ? "#EF4444" : "#CBD5E1",
          },
          "&:focus-within": {
            borderColor: error ? "#EF4444" : "#2764A5",
            borderWidth: 1.5,
          },
        }}
      >
        {/* Teal Currency Button */}
        <ButtonBase
          disabled={disabled}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            bgcolor: "#2E937A",
            color: "#FFFFFF",
            borderRadius: "8px",
            px: 1.5,
            py: 0.65,
            fontSize: 14,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            flexShrink: 0,
            "&:hover": {
              bgcolor: "#267C67",
            },
            "&:disabled": {
              opacity: 0.6,
            },
          }}
        >
          {currency}
          <ChevronDown size={14} color="#FFFFFF" />
        </ButtonBase>

        {/* Currency Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{ paper: { sx: { minWidth: 160, mt: 0.5, borderRadius: "12px" } } }}
        >
          {options.map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === currency}
              onClick={() => {
                onCurrencyChange(option.value);
                setAnchorEl(null);
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                {option.flag && <Avatar src={option.flag} sx={{ width: 22, height: 22 }} />}
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{option.value}</Typography>
                <Typography sx={{ fontSize: 13, color: "#64748B" }}>{option.name}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </Menu>

        {/* Amount Input */}
        <InputBase
          value={amount}
          onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9.,]/g, ""))}
          placeholder="0.00"
          inputMode="decimal"
          disabled={disabled}
          sx={{
            ml: 1.5,
            flex: 1,
            fontSize: "20px",
            fontWeight: 700,
            color: "#0F172A",
            "& input": {
              p: 0,
              fontWeight: 700,
              color: "#0F172A",
            },
            "& input::placeholder": {
              color: "#64748B",
              opacity: 1,
              fontWeight: 700,
            },
          }}
        />
      </Box>

      <Typography
        sx={{
          fontSize: 12.5,
          color: error ? "#EF4444" : "#64748B",
          mt: 1,
          px: 0.5,
        }}
      >
        {helperText ?? `Daily limit ${currency} 5,000.00 · Remaining ${currency} 4,750.00`}
      </Typography>
    </Box>
  );
}
