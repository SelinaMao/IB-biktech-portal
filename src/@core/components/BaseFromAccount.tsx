"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronDown } from "lucide-react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import type { TransferAccount } from "../../features/transfer/transfer.types";

export type BaseFromAccountProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  accounts: TransferAccount[];
};

function DropdownCircleIcon(props: { className?: string }) {
  return (
    <Box
      className={props.className}
      sx={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        bgcolor: "#EAECEF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        right: "16px !important",
        top: "calc(50% - 18px) !important",
        pointerEvents: "none",
        color: "#0F172A",
      }}
    >
      <ChevronDown size={18} />
    </Box>
  );
}

export default function BaseFromAccount<T extends FieldValues>({
  name,
  control,
  accounts,
}: BaseFromAccountProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selectedAccount = accounts.find((acc) => acc.id === field.value);

        return (
          <Box>
            <Select
              {...field}
              fullWidth
              variant="standard"
              disableUnderline
              IconComponent={DropdownCircleIcon}
              renderValue={(selectedId) => {
                const acc = accounts.find((a) => a.id === selectedId);
                if (!acc) return null;
                return (
                  <Stack spacing={0.25} sx={{ py: 0.5 }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#0F172A" }}>
                      {acc.name}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: "#64748B" }}>
                      {acc.number}
                    </Typography>
                  </Stack>
                );
              }}
              sx={{
                bgcolor: "#F8FAFC",
                borderRadius: "16px",
                px: 2.5,
                py: 1.25,
                "& .MuiSelect-select": {
                  pr: "56px !important",
                  "&:focus": {
                    bgcolor: "transparent",
                  },
                },
              }}
            >
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  <Stack spacing={0.25}>
                    <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#0F172A" }}>
                      {acc.name}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "#64748B" }}>
                      {acc.number} • {acc.balance} {acc.currency}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>

            <Stack direction="row" spacing={1} sx={{ mt: 1.5, px: 1, alignItems: "center" }}>
              <Typography sx={{ fontSize: 14, color: "#64748B" }}>
                Available balance:
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                {selectedAccount
                  ? `${selectedAccount.balance} ${selectedAccount.currency}`
                  : "-"}
              </Typography>
            </Stack>
          </Box>
        );
      }}
    />
  );
}