"use client";

import React from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import BaseTransferFromAccount, { type TransferParty } from "./BaseTransferFromAccount";

export type BaseReviewRow = { label: string; value: React.ReactNode };

export type BaseTransferReviewCardProps = {
  from?: TransferParty;
  to?: TransferParty;
  amountTransferred: React.ReactNode;
  transactionId: React.ReactNode;
  referenceNo: React.ReactNode;
  debitAmount: React.ReactNode;
  /** Extra rows shown alongside Debit amount (Fee, Exchange Rate, Credit Amount, ...). */
  extraRows?: BaseReviewRow[];
  schedule: React.ReactNode;
  remark: React.ReactNode;
  termsAccepted: boolean;
  onTermsAcceptedChange: (accepted: boolean) => void;
  /** Roomier padding, to match a merged "splitView" card elsewhere on the page. */
  spacious?: boolean;
};

function Row({ label, value }: BaseReviewRow) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
      <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#8C9BAE" }}>{label}</Typography>
      <Box sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", textAlign: "right" }}>{value}</Box>
    </Stack>
  );
}

/** From/To card + Amount/Transaction/Debit/Schedule details card + Terms checkbox — the Transfer flow's Review step. */
export default function BaseTransferReviewCard({
  from,
  to,
  amountTransferred,
  transactionId,
  referenceNo,
  debitAmount,
  extraRows = [],
  schedule,
  remark,
  termsAccepted,
  onTermsAcceptedChange,
  spacious = false,
}: BaseTransferReviewCardProps) {
  return (
    <Stack spacing={2}>
      {/* Card 1: From -> To Card */}
      <BaseTransferFromAccount from={from} to={to} sx={spacious ? { p: 10 } : undefined} />

      {/* Card 2: Transfer Details Card */}
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "20px",
          p: spacious ? 10 : { xs: 3, md: 3.5 },
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Amount Transferred */}
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#8C9BAE" }}>
          Amount Transferred
        </Typography>
        <Box
          sx={{
            fontSize: { xs: 34, sm: 38 },
            fontWeight: 800,
            color: "#0F172A",
            mt: 0.75,
            mb: 2.5,
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
          }}
        >
          {amountTransferred}
        </Box>

        {/* Dotted Divider */}
        <Box sx={{ borderBottom: "1.5px dotted #E2E8F0", my: 2.5 }} />

        {/* Transaction ID & Reference no */}
        <Stack spacing={1.75}>
          <Row label="Transaction ID" value={transactionId} />
          <Row label="Reference no" value={referenceNo} />
        </Stack>

        {/* Dotted Divider */}
        <Box sx={{ borderBottom: "1.5px dotted #E2E8F0", my: 2.5 }} />

        {/* Debit amount & Additional quote rows (Fee, Exchange Rate, Credit Amount, etc.) */}
        <Stack spacing={1.75}>
          <Row label="Debit amount" value={debitAmount} />
          {extraRows.map((row) => (
            <Row key={row.label} label={row.label} value={row.value} />
          ))}
        </Stack>

        {/* Dotted Divider */}
        <Box sx={{ borderBottom: "1.5px dotted #E2E8F0", my: 2.5 }} />

        {/* Schedule & Remark */}
        <Stack spacing={1.75}>
          <Row label="Schedule" value={schedule} />
          <Row label="Remark" value={remark} />
        </Stack>

        {/* Terms & Conditions */}
        <Box sx={{ mt: 2.5, display: "flex", alignItems: "center" }}>
          <Checkbox
            checked={termsAccepted}
            onChange={(e) => onTermsAcceptedChange(e.target.checked)}
            sx={{
              p: 0.5,
              mr: 1,
              color: "#CBD5E1",
              "&.Mui-checked": {
                color: "#10B981",
              },
            }}
          />
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>
            I agree to the Terms &amp; Conditions
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}
