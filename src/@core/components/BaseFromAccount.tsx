"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { ChevronDown } from "lucide-react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import type { TransferAccount } from "../../features/transfer/transfer.types";
import { accountOptionLabel } from "../../features/transfer/transfer.utils";

export type BaseFromAccountProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  accounts: TransferAccount[];
  label?: string;
};

/** Same two-line name / account-number / balance layout as the To Account select. */
export default function BaseFromAccount<T extends FieldValues>({
  name,
  control,
  accounts,
  label = "From account",
}: BaseFromAccountProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selectedAccount = accounts.find((acc) => acc.id === field.value) || accounts[0];

        return (
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", mb: 1 }}>
              {label}
            </Typography>

            <Select
              {...field}
              value={field.value || selectedAccount?.id || ""}
              fullWidth
              variant="outlined"
              IconComponent={(props) => (
                <ChevronDown
                  size={18}
                  color="#0F172A"
                  className={props.className}
                  style={{ right: 14, position: "absolute", pointerEvents: "none" }}
                />
              )}
              renderValue={(selectedId) => {
                const acc = accounts.find((a) => a.id === selectedId) || selectedAccount;
                return acc ? accountOptionLabel(acc) : null;
              }}
              sx={{
                bgcolor: "#FFFFFF",
                borderRadius: "12px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#CBD5E1",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#2764A5",
                  borderWidth: 1.5,
                },
                "& .MuiSelect-select": {
                  py: "13px",
                  px: "14px",
                  display: "flex",
                  alignItems: "center",
                },
              }}
            >
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id} sx={{ py: 1.25 }}>
                  {accountOptionLabel(acc)}
                </MenuItem>
              ))}
            </Select>
          </Box>
        );
      }}
    />
  );
}
