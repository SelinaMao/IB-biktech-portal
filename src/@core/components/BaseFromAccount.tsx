"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronDown, CreditCard } from "lucide-react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import type { TransferAccount } from "../../features/transfer/transfer.types";

export type BaseFromAccountProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  accounts: TransferAccount[];
  label?: string;
};

function maskAccount(acc?: string | null) {
  if (!acc) return "•••• 4417";
  const clean = acc.replace(/\D/g, "");
  const last4 = clean.length > 4 ? clean.slice(-4) : clean || "4417";
  return `•••• ${last4}`;
}

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
                const accountName = acc?.name?.includes("Saving") ? "Savings" : acc?.name || "Savings";
                const masked = maskAccount(acc?.number);

                return (
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                    <CreditCard size={18} color="#475569" style={{ flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#0F172A" }}>
                      {accountName} · {masked}
                    </Typography>
                  </Stack>
                );
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
              {accounts.map((acc) => {
                const masked = maskAccount(acc.number);
                return (
                  <MenuItem key={acc.id} value={acc.id} sx={{ py: 1.25 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                        <CreditCard size={18} color="#64748B" />
                        <Stack spacing={0.25}>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                            {acc.name} · {masked}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: "#64748B" }}>
                            {acc.number}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                        {acc.currency} {acc.balance}
                      </Typography>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>

            <Typography sx={{ fontSize: 12.5, color: "#64748B", mt: 1, px: 0.5 }}>
              Available {selectedAccount?.currency ?? "USD"} {selectedAccount?.balance ?? "12,480.50"}
            </Typography>
          </Box>
        );
      }}
    />
  );
}
