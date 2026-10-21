"use client";

import { useState } from "react";
import { Box, Button, Divider, IconButton, Stack, Typography } from "@mui/material";
import { EllipsisVertical, Info, ReceiptText, Settings } from "lucide-react";
import dayjs from "dayjs";

import { font, palette } from "@/theme/palette";
import { formatAccountNumber } from "@/utils/format-account-number";
import { formatCCY } from "@/utils";
import BaseButton from "@core/components/BaseButton";
import BaseChip from "@core/components/BaseChip";
import BaseTermMaturity from "@core/components/BaseTermToMaturity";
import type { CoreAccountEntry, IAccountDetailResponses } from "../account.types";
import AccountDetails from "./AccountDetails";

export interface AccountDetailsProps {
  open?: boolean;
  accounts: CoreAccountEntry[];
  stats: IAccountDetailResponses;
  onClose?: () => void;
  info: IAccountDetailResponses;
  fixedDeposit?: IAccountDetailResponses;
  isFixedDeposit?: boolean;
  onOpenAccountInfo?: () => void;
  onOpenStatements?: () => void;
  onDownloadCertificate?: () => void | Promise<void>;
}

// Fixed data only for maturity progress
const FIXED_MATURITY_DATA = {
  ongoingDays: 7,
  totalDays: 20,
  segments: 20,
};

const STAT_FIELDS = [
  { key: "ledgerBalance", label: "Ledger Balance" },
  { key: "overdraftLimit", label: "Overdraft Limit" },
  { key: "blockedBalance", label: "Blocked Balance" },
] as const;

export default function AccountDetailsCard({
  open,
  onClose,
  accounts,
  stats,
  info,
  fixedDeposit,
  isFixedDeposit = false,
  onOpenAccountInfo,
  onOpenStatements,
  onDownloadCertificate,
}: AccountDetailsProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const ccy = fixedDeposit?.ccy ?? fixedDeposit?.currencyCode ?? info.ccy ?? "USD";

  // When selected account is Fixed Term Deposit (TD)
  if (isFixedDeposit) {
    const principalAmount = fixedDeposit?.placementAmt ?? info.placementAmt ?? info.availableBalance ?? 0;
    const maturityAmount = fixedDeposit?.totalAmountToReceive ?? info.totalAmountToReceive;
    const interestEarned = fixedDeposit?.interestAmount ?? info.interestAmount;
    const interestRateVal = fixedDeposit?.interestRate ?? info.interestRate;
    const tenureMonths = fixedDeposit?.tenorMonths ?? info.tenorMonths;
    const maturityDateVal = fixedDeposit?.maturityDate ?? info.maturityDate;

    const tdRows = [
      {
        label: "FD Account Number",
        value: info.accountNumber || "—",
      },
      {
        label: "Deposit Type",
        value: fixedDeposit?.productDesc || info.productDesc || "Fixed Term Deposit",
      },
      {
        label: "Interest Rate",
        value: interestRateVal !== undefined ? `${interestRateVal}% p.a.` : "—",
        color: "#166D35",
      },
      {
        label: "Tenure",
        value: tenureMonths ? `${tenureMonths} Months` : "—",
      },
      {
        label: "Maturity Date",
        value: maturityDateVal ? dayjs(maturityDateVal).format("DD MMM YYYY") : "—",
      },
      {
        label: "Maturity Amount",
        value: maturityAmount !== undefined ? formatCCY(maturityAmount, ccy) : "—",
        color: "#2589BD",
      },
      {
        label: "Interest Earned",
        value: interestEarned !== undefined ? formatCCY(interestEarned, ccy) : "—",
        color: "#166D35",
      },
    ];

    return (
      <Stack direction="column" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        {/* Header: Name, Status badge, and top-right actions */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Typography sx={{ fontSize: font.size.lg, fontWeight: font.weight.semibold }}>
                {info.accountName}
              </Typography>
              {info.status && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.25,
                    borderRadius: "25px",
                    bgcolor: "#E0F4E7",
                    color: "#166D35",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {info.status}
                </Box>
              )}
            </Stack>
            <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
              {formatAccountNumber(info.accountNumber)}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => setIsDetailsOpen(true)}
              sx={{
                minWidth: 0,
                width: 34,
                height: 34,
                p: 0,
                bgcolor: palette.hover[10],
                borderRadius: "50%",
                color: "text.primary",
                "&:hover": { bgcolor: palette.hover[10] },
              }}
            >
              <EllipsisVertical size={18} />
            </Button>
            <Button
              sx={{
                minWidth: 0,
                width: 34,
                height: 34,
                p: 0,
                bgcolor: palette.hover[10],
                borderRadius: "50%",
                color: "text.primary",
                "&:hover": { bgcolor: palette.hover[10] },
              }}
            >
              <Settings size={18} />
            </Button>
          </Stack>
        </Box>

        {/* Metrics Row: Principal Deposit Amount + Term to Maturity positioned side by side */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 3, sm: 6, md: 8 }}
          sx={{
            mt: 3.5,
            mb: 2.5,
            alignItems: "flex-start",
          }}
        >
          <Box sx={{ minWidth: 200 }}>
            <Typography sx={{ fontSize: 14, color: "#64748B", mb: 1 }}>
              Principal Deposit Amount
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
              {formatCCY(principalAmount, ccy)}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 14, color: "#64748B", mb: 1 }}>
              Term to Maturity
            </Typography>
            <BaseTermMaturity
              label=""
              totalMaturityDays={FIXED_MATURITY_DATA.ongoingDays}
              totalDays={FIXED_MATURITY_DATA.totalDays}
              segments={FIXED_MATURITY_DATA.segments}
              barHeight={28}
              barWidth={9}
              activeColor="#2589BD"
              trackColor="#E2EBF3"
            />
          </Box>
        </Stack>

        {/* Account Details Box */}
        <Box
          sx={{
            bgcolor: "#F8F9FA",
            borderRadius: "16px",
            p: { xs: 2.5, sm: 3 },
            mt: 1,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", mb: 1 }}>
            Account Details
          </Typography>

          <Stack divider={<Divider flexItem sx={{ borderColor: "#F1F5F9" }} />} spacing={0}>
            {tdRows.map((row) => (
              <Stack
                key={row.label}
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
              >
                <Typography sx={{ fontSize: 14, color: "#64748B" }}>{row.label}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: row.color || "#0F172A" }}>
                  {row.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* Bottom Action Pill Buttons */}
        <Stack direction="row" spacing={1.75} sx={{ mt: { xs: 2, sm: 3 } }}>
          <BaseButton
            sx={{
              padding: "8px 20px",
              bgcolor: "#EBF3FC",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: 500,
              textTransform: "none",
              color: "#1E293B",
              boxShadow: "none",
              "&:hover": { bgcolor: "#E2EDF9" },
            }}
            onClick={onOpenAccountInfo}
            startIcon={<Info size={17} />}
            title="Account Information"
          />
          <BaseButton
            sx={{
              padding: "8px 20px",
              bgcolor: "#EBF3FC",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: 500,
              textTransform: "none",
              color: "#1E293B",
              boxShadow: "none",
              "&:hover": { bgcolor: "#E2EDF9" },
            }}
            onClick={onOpenStatements}
            startIcon={<ReceiptText size={17} />}
            title="Statements"
          />
        </Stack>

        <AccountDetails
          open={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          info={info}
          fixedDeposit={fixedDeposit}
          onDownloadCertificate={onDownloadCertificate}
        />
      </Stack>
    );
  }

  // Default Current Account UI
  return (
    <Stack direction="column" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography sx={{ fontSize: font.size.lg, fontWeight: font.weight.medium }}>
            {info.accountName}
          </Typography>
          {info.status && (
            <Box
              sx={{
                padding: "4px 8px",
                borderRadius: "25px",
                bgcolor: "#E0F4E7",
                marginLeft: 2,
                fontSize: "14px",
                color: "#166D35",
                fontWeight: "500",
              }}
            >
              {info.status}
            </Box>
          )}
        </Box>
        <Button
          onClick={() => setIsDetailsOpen(true)}
          sx={{
            minWidth: 0,
            width: 32,
            height: 32,
            p: 0,
            bgcolor: palette.hover[10],
            border: "0px solid",
            borderColor: "primary.main",
            borderRadius: "50%",
            transition: "all 0.2s ease",
            color: "black",
            "&:hover": {
              bgcolor: palette.hover[10],
              borderColor: "primary.main",
              color: "black",
            },
          }}
        >
          <EllipsisVertical size={18} />
        </Button>
      </Box>

      <Box sx={{ mt: 0.5 }}>
        <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
          {formatAccountNumber(info.accountNumber)}
        </Typography>
      </Box>

      <Box sx={{ marginTop: 4 }}>
        <Typography
          sx={{
            fontFamily: "sans-serif",
            fontWeight: "bold",
            fontSize: "24px",
          }}
        >
          {formatCCY(info.availableBalance, ccy)}
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: "#F8F9FA",
          borderRadius: "16px",
          p: { xs: 2.5, sm: 3 },
          marginTop: "16px",
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
          Account Detail
        </Typography>

        <Stack divider={<Divider flexItem sx={{ borderColor: "#F1F5F9" }} />} spacing={0}>
          {STAT_FIELDS.filter(({ key }) => stats[key] !== undefined).map(({ key, label }) => (
            <Stack
              key={key}
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
            >
              <Typography sx={{ fontSize: 14, color: "#64748B" }}>{label}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                {formatCCY(stats[key] ?? 0, ccy)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Bottom Action Pill Buttons */}
      <Stack direction={{ xs: 'column', sm: 'row' }}
        spacing={1.75}
        sx={{ mt: 3 }}>
        <BaseButton
          sx={{
            padding: "8px 15px",
            bgcolor: "#EBF3FC",
            borderRadius: "99px",
            fontSize: "14px",
            fontWeight: 500,
            textTransform: "none",
            color: "#1E293B",
            boxShadow: "none",
            "&:hover": { bgcolor: "#E2EDF9" },
          }}
          onClick={onOpenAccountInfo}
          startIcon={<Info size={17} />}
          title="Account Information"
        />
        <BaseButton
          sx={{
            padding: "8px 20px",
            bgcolor: "#EBF3FC",
            borderRadius: "999px",
            fontSize: "14px",
            fontWeight: 500,
            textTransform: "none",
            color: "#1E293B",
            boxShadow: "none",
            "&:hover": { bgcolor: "#E2EDF9" },
          }}
          onClick={onOpenStatements}
          startIcon={<ReceiptText size={17} />}
          title="Statements"
        />
      </Stack>

      <AccountDetails
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        info={info}
        fixedDeposit={fixedDeposit}
        onDownloadCertificate={onDownloadCertificate}
      />
    </Stack>
  );
}

