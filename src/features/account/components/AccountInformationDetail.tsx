"use client";

import { Box, Divider, Grid, Stack, Typography } from "@mui/material";
import { ChevronLeft } from "lucide-react";

import { palette } from "@/theme/palette";
import { formatAccountNumber } from "@/utils/format-account-number";
import BaseRightSideNavbar from "@core/components/BaseRightSideNavbar";
import type { IAccountDetailResponses } from "../account.types";

export interface AccountDetailsProps {
  open: boolean;
  onClose: () => void;
  info: IAccountDetailResponses;
  fixedDeposit?: IAccountDetailResponses;
  onDownloadCertificate?: () => void | Promise<void>;
}

const QUICK_NAV_ITEMS = [
  "Statements",
  "Transaction History",
  "Beneficiaries",
  "Account Settings",
  "Security",
  "Cards",
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        py: 2,
        gap: 2,
      }}
    >
      <Typography sx={{ fontSize: 14, color: "#64748B", fontWeight: 400 }}>
        {label}
      </Typography>
      <Typography
        component="div"
        sx={{
          fontSize: 14,
          fontWeight: 500,
          color: "#0F172A",
          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default function AccountInformationDetail({
  open,
  onClose,
  info,
}: AccountDetailsProps) {
  if (!open) return null;

  const currency = info.ccy || info.currencyCode || "USD";
  const formattedLimit =
    info.transactionLimitPerDay !== undefined
      ? `${info.transactionLimitPerDay.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ${currency}`
      : `250,000.00 ${currency}`;

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={3}>
        {/* Left Main Content Column */}
        <Grid size={{ xs: 12, lg: 8.5 }}>
          {/* Back Button & Title */}
          <Box sx={{ mb: 3 }}>
            <Box
              component="button"
              type="button"
              onClick={onClose}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                border: "none",
                bgcolor: "transparent",
                p: 0,
                mb: 1,
                cursor: "pointer",
                "&:hover": { opacity: 0.85 },
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: "#E6EEF8",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={15} color={palette.primary[40]} />
              </Box>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: palette.primary[40],
                }}
              >
                Accounts
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: 28,
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.2,
              }}
            >
              Account Information
            </Typography>
          </Box>

          <Stack spacing={3}>
            {/* Card 1: Account Overview */}
            <Box
              sx={{
                bgcolor: "#FFFFFF",
                borderRadius: "20px",
                p: { xs: 2.5, sm: 3.5 },
              }}
            >
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2.5,
                }}
              >
                <Typography
                  sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}
                >
                  Account Overview
                </Typography>
                <Box
                  sx={{
                    px: 1.75,
                    py: 0.4,
                    borderRadius: "9999px",
                    bgcolor: "#E0F4E7",
                    color: "#166D35",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {info.status || "Active"}
                </Box>
              </Stack>

              <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" ,padding:1}} />}>
                <InfoRow
                  label="Account Name"
                  value={info.accountName || "Shiping co., ltd."}
                />
                <InfoRow
                  label="Account Number"
                  value={formatAccountNumber(info.accountNumber || "000190068")}
                />
                <InfoRow
                  label="Account Type"
                  value={info.productDesc || info.accountType || "Savings"}
                />
                <InfoRow label="Currency" value={currency} />
              </Stack>
            </Box>

            {/* Card 2: Account Holder Information */}
            <Box
              sx={{
                bgcolor: "#FFFFFF",
                borderRadius: "20px",
                p: { xs: 2.5, sm: 3.5 },
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0F172A",
                  mb: 2.5,
                }}
              >
                Account Holder Information
              </Typography>

              <Stack divider={<Divider sx={{ borderColor: "#F1F5F9",padding:1 }} />}>
                <InfoRow
                  label="Company Name"
                  value={info.fullName || info.accountName || "Shiping co., ltd."}
                />
                <InfoRow
                  label="Authorized Representative"
                  value={info.joinHolderDto?.[0]?.accountName || "Anna Smith"}
                />
                <InfoRow label="Contact Email" value="ops@shipingcoltd.com" />
                <InfoRow label="Phone Number" value="+1 (555) 234-5678" />
                <InfoRow
                  label="Billing Address"
                  value="Suite 402, Maritime Tower, Boston MA"
                />
              </Stack>
            </Box>

            {/* Card 3: Account Settings */}
            <Box
              sx={{
                bgcolor: "#FFFFFF",
                borderRadius: "20px",
                p: { xs: 2.5, sm: 3.5 },
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0F172A",
                  mb: 1.5,
                }}
              >
                Account Settings
              </Typography>

              <Stack divider={<Divider sx={{ borderColor: "#F1F5F9",padding:1 }} />}>
                <InfoRow
                  label="Daily Transaction Limit"
                  value={formattedLimit}
                />
                <InfoRow
                  label="Notification Preferences"
                  value="SMS & Email Alerts"
                />
                <InfoRow
                  label="Linked Master Accounts"
                  value={
                    info.accountSettlementNumber
                      ? `Savings - ${formatAccountNumber(info.accountSettlementNumber)}`
                      : "Savings - 000 067 898"
                  }
                />
              </Stack>

              <Divider sx={{ borderColor: "#F1F5F9" }} />

              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748B",
                  pt: 2.5,
                  pb: 1,
                }}
              >
                Quick Limit Update (Authorized Only)
              </Typography>
            </Box>
          </Stack>
        </Grid>

        {/* Right Sidebar: Quick Navigation */}
        <Grid size={{ xs: 12, lg: 3.5 }}>
          <BaseRightSideNavbar items={QUICK_NAV_ITEMS} />
        </Grid>
      </Grid>
    </Box>
  );
}
