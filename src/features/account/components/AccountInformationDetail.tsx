"use client";

import { Box, Divider, Grid, Stack, Typography } from "@mui/material";
import { ChevronLeft } from "lucide-react";
import dayjs from "dayjs";

import { palette } from "@/theme/palette";
import { formatAccountNumber } from "@/utils/format-account-number";
import BaseRightSideNavbar from "@core/components/BaseRightSideNavbar";
import { useTopBarBreadcrumb } from "@core/layout";
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

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) {
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
          color: valueColor || "#0F172A",
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
  fixedDeposit,
}: AccountDetailsProps) {
  useTopBarBreadcrumb(
    open
      ? {
          prefix: "Accounts",
          subPrefix: "Account Information",
          onBack: onClose,
        }
      : null
  );

  if (!open) return null;

  const isTD = info.accountType === "TD" || fixedDeposit?.accountType === "TD";
  const currency = fixedDeposit?.currencyCode || info.ccy || info.currencyCode || "USD";

  // Dedicated View for Term Deposit (TD) matching design
  if (isTD) {
    const accountHolder = info.accountName || "Shiiping co., ltd.";
    const accountType = fixedDeposit?.productDesc || info.productDesc || "Fixed Term Deposit";
    const fdAccountNumber = info.accountNumber || fixedDeposit?.accountNumber || "FD-2024-001892";
    const linkedAccount =
      fixedDeposit?.accountSettlementNumber ||
      info.accountSettlementNumber ||
      "000 190 068";
    const branch = info.branchCode
      ? `Main Branch, ${info.branchCode}`
      : "Main Branch, Phnom Penh Cambodia";
    const openingDate = info.openedDate
      ? dayjs(info.openedDate).format("DD MMM YYYY")
      : "08 Sep 2024";
    const status = info.status || "Active";

    const nomineeName = info.joinHolderDto?.[0]?.accountName || "Kok Soboros";
    const relationship = info.joinHolderDto?.[0]?.joinType || "Director";
    const nomineeShare = "100%";

    return (
      <Box sx={{ width: "100%", pb: 4 }}>
        {/* Back Button & Title */}
        

        <Stack spacing={3}>
          {/* Card 1: Account Information */}
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
                mb: 1,
              }}
            >
              Account Information
            </Typography>

            <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
              <InfoRow label="Account Holder" value={accountHolder} />
              <InfoRow label="Account Type" value={accountType} />
              <InfoRow label="FD Account Number" value={fdAccountNumber} />
              <InfoRow
                label="Linked Savings Account"
                value={formatAccountNumber(linkedAccount)}
              />
              <InfoRow label="Branch" value={branch} />
              <InfoRow label="Currency" value={currency} />
              <InfoRow label="Opening Date" value={openingDate} />
              <InfoRow label="Status" value={status} valueColor="#166D35" />
            </Stack>
          </Box>

          {/* Card 2: User Information */}
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
                mb: 1,
              }}
            >
              User Information
            </Typography>

            <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
              <InfoRow label="Nominee Name" value={nomineeName} />
              <InfoRow label="Relationship" value={relationship} />
              <InfoRow label="Nominee Share" value={nomineeShare} />
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  }

  // Default View for non-TD Accounts
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

              <Stack divider={<Divider sx={{ borderColor: "#F1F5F9", padding: 1 }} />}>
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

              <Stack divider={<Divider sx={{ borderColor: "#F1F5F9", padding: 1 }} />}>
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

              <Stack divider={<Divider sx={{ borderColor: "#F1F5F9", padding: 1 }} />}>
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

