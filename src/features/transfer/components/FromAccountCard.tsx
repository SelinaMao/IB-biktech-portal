"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { ChevronDown } from "lucide-react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { transferAccounts } from "../transfer.data";
import type { TransferAccount } from "../transfer.types";

export type FromAccountCardProps = {
  value?: string;
  onChange?: (accountId: string) => void;
  accounts?: TransferAccount[];
  selectedAccount?: TransferAccount;
  disabled?: boolean;
};

export default function FromAccountCard({
  value,
  onChange,
  accounts,
  selectedAccount,
  disabled = false,
}: FromAccountCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const availableAccounts = accounts && accounts.length > 0 ? accounts : transferAccounts;
  const currentAccount =
    selectedAccount ??
    availableAccounts.find((a) => a.id === value) ??
    availableAccounts[0];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled && availableAccounts.length > 1) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (accountId: string) => {
    onChange?.(accountId);
    handleClose();
  };

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "20px",
        p: 2.5,
        border: "1px solid #F1F5F9",
      }}
    >
      <Box
        component="button"
        type="button"
        disabled={disabled}
        onClick={handleClick}
        sx={{
          width: "100%",
          bgcolor: "#F8FAFC",
          borderRadius: "16px",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "none",
          cursor: disabled || availableAccounts.length <= 1 ? "default" : "pointer",
          textAlign: "left",
          transition: "background-color 0.15s ease",
          "&:hover": {
            bgcolor: disabled || availableAccounts.length <= 1 ? "#F8FAFC" : "#F1F5F9",
          },
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: 15,
              color: "#0F172A",
              lineHeight: 1.3,
            }}
          >
            {currentAccount?.name ?? "Select Account"}
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 400,
              color: "#64748B",
              mt: 0.5,
            }}
          >
            {currentAccount?.number ?? ""}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            bgcolor: "#EDEFEF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ChevronDown size={16} color="#0F172A" />
        </Box>
      </Box>

      {currentAccount && (
        <Typography sx={{ fontSize: 13, color: "#64748B", mt: 1.5, px: 1 }}>
          Available balance:{" "}
          <Box component="span" sx={{ fontWeight: 600, color: "#0F172A" }}>
            {currentAccount.balance} {currentAccount.currency}
          </Box>
        </Typography>
      )}

      {availableAccounts.length > 1 && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              sx: {
                width: anchorEl ? (anchorEl as HTMLElement).offsetWidth : 360,
                borderRadius: "16px",
                mt: 1,
                boxShadow:
                  "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                border: "1px solid #E2E8F0",
                p: 0.5,
              },
            },
          }}
        >
          {availableAccounts.map((account) => (
            <MenuItem
              key={account.id}
              selected={account.id === currentAccount?.id}
              onClick={() => handleSelect(account.id)}
              sx={{
                borderRadius: "12px",
                py: 1.5,
                px: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                my: 0.5,
                "&.Mui-selected": {
                  bgcolor: "#F1F5F9",
                },
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>
                  {account.name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#64748B" }}>
                  {account.number}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                {account.balance} {account.currency}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  );
}

export function ControlledFromAccountCard<T extends FieldValues>({
  name,
  control,
  accounts,
  disabled,
}: {
  name: Path<T>;
  control: Control<T>;
  accounts?: TransferAccount[];
  disabled?: boolean;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FromAccountCard
          value={field.value}
          onChange={field.onChange}
          accounts={accounts}
          disabled={disabled}
        />
      )}
    />
  );
}
