"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowRight } from "lucide-react";

import { formatAccountNumber } from "@/utils/format-account-number";

export type TransferParty = {
  name?: string;
  accountNumber?: string;
  bankName?: string;
};

export type BaseTransferFromAccountProps = {
  from?: TransferParty;
  to?: TransferParty;
};

export default function BaseTransferFromAccount({
  from,
  to,
}: BaseTransferFromAccountProps) {
  const fromName = from?.name || "Shiiping co., ltd.";
  const fromNumber = from?.accountNumber
    ? formatAccountNumber(from.accountNumber)
    : "000 190 068";

  const toName = to?.name || "Sarah Jenkins";
  const toNumber = to?.accountNumber
    ? formatAccountNumber(to.accountNumber)
    : "000 200 567";

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "20px",
        p: { xs: 3, md: 3.5 },
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        {/* FROM */}
        <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: "#8C9BAE",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              mb: 0.75,
            }}
          >
            FROM
          </Typography>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: "#0F172A",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {fromName}
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 400,
              color: "#64748B",
              mt: 0.5,
              lineHeight: 1.3,
            }}
          >
            {fromNumber}
          </Typography>
        </Box>

        {/* Arrow badge */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            bgcolor: "#E6F6EE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            mx: 2,
          }}
        >
          <ArrowRight size={20} color="#00A86B" strokeWidth={2.5} />
        </Box>

        {/* TO */}
        <Box sx={{ flex: 1, minWidth: 0, pl: 1, textAlign: "right" }}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: "#8C9BAE",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              mb: 0.75,
            }}
          >
            TO
          </Typography>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: "#0F172A",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {toName}
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 400,
              color: "#64748B",
              mt: 0.5,
              lineHeight: 1.3,
            }}
          >
            {toNumber}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
