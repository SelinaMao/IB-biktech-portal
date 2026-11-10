"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Slide,
  Stack,
  Typography,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { Download, X } from "lucide-react";

import { formatAccountNumber } from "@/utils/format-account-number";
import BaseButton from "@core/components/BaseButton";
import type { IAccountDetailResponses } from "../account.types";

export interface AccountDetailsProps {
  open: boolean;
  onClose: () => void;
  info: IAccountDetailResponses;
  fixedDeposit?: IAccountDetailResponses;
  onDownloadCertificate?: () => void | Promise<void>;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        py: 1.25,
      }}
    >
      <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 400 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 600,
          color: "#0F172A",
          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default function AccountDetails({
  open,
  onClose,
  info,
  fixedDeposit,
  onDownloadCertificate,
}: AccountDetailsProps) {
  const target = fixedDeposit || info;
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadClick = async () => {
    if (!onDownloadCertificate || isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownloadCertificate();
    } finally {
      setIsDownloading(false);
    }
  };

  const rawAccNumber = target?.accountNumber || info?.accountNumber || "001234569001";
  const formattedAccNumber = formatAccountNumber(rawAccNumber) || rawAccNumber;

  const productTitle = target?.productDesc || info?.productDesc || "Term deposit 12M";
  const customerName = (info?.fullName || info?.accountName || "ABC TRADING CO., LTD.").toUpperCase();

  const openingDate = target?.openedDate
    ? dayjs(target.openedDate).format("DD MMM YYYY")
    : "15 Mar 2026";
  const effectiveDate = target?.openedDate
    ? dayjs(target.openedDate).format("DD MMM YYYY")
    : "15 Mar 2026";
  const maturityDate = target?.maturityDate
    ? dayjs(target.maturityDate).format("DD MMM YYYY")
    : "15 Mar 2027";
  const tenor = target?.tenorMonths ? `${target.tenorMonths} months` : "12 months";
  const settlementAccount = target?.accountSettlementNumber
    ? `Operating account · ${formatAccountNumber(target.accountSettlementNumber)}`
    : "Operating account · 0012 3456 7890";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      slotProps={{
        backdrop: {
          sx: { bgcolor: "rgba(15, 23, 42, 0.4)" },
        },
        paper: {
          sx: {
            position: "fixed",
            top: { xs: 8, sm: 8, md: 14 },
            right: { xs: 8, sm: 8, md: 14 },
            bottom: { xs: 8, sm: 8, md: 14 },
            m: 0,
            width: { xs: "calc(100vw - 16px)", sm: 429 },
            maxWidth: 429,
            height: {
              xs: "calc(100vh - 16px)",
              sm: "calc(100vh - 16px)",
              md: "calc(100vh - 28px)",
            },
            maxHeight: 976,
            borderRadius: "24px",
            bgcolor: "#FFFFFF",
            p: { xs: 2.5, sm: "24px 20px" },
            boxSizing: "border-box",
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
            overflowY: "auto",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
            Term deposit details
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "#64748B",
              bgcolor: "#F1F5F9",
              borderRadius: "8px",
              p: 0.75,
              "&:hover": { bgcolor: "#E2E8F0" },
            }}
          >
            <X size={18} />
          </IconButton>
        </Stack>

        {/* Profile Card */}
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2.5 }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: "#1C64B4",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            TD
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.25,
              }}
            >
              {productTitle}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 500,
                color: "#64748B",
                mt: 0.25,
                lineHeight: 1.2,
              }}
            >
              {customerName}
            </Typography>
          </Box>
        </Stack>

        {/* Rows with Dividers */}
        <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
          <DetailRow label="Account number" value={formattedAccNumber} />
          <DetailRow label="Account type" value="Term deposit" />
          <DetailRow label="Account status" value={target?.status || info?.status || "Active"} />
          <DetailRow label="Opening date" value={openingDate} />
          <DetailRow label="Effective date" value={effectiveDate} />
          <DetailRow label="Maturity date" value={maturityDate} />
          <DetailRow label="Tenor" value={tenor} />
          <DetailRow label="Settlement account" value={settlementAccount} />
        </Stack>

        {/* Footer Buttons */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center",
            mt: 3,
            pt: 1,
          }}
        >
          <BaseButton
            title="Close"
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: "#E2E8F0",
              color: "#0F172A",
              borderRadius: "10px",
              textTransform: "none",
              fontSize: 14,
              fontWeight: 600,
              px: 2.5,
              height: 40,
              "&:hover": {
                borderColor: "#CBD5E1",
                bgcolor: "#F8FAFC",
              },
            }}
          />
          <BaseButton
            title="Download certificate"
            variant="contained"
            startIcon={<Download size={16} />}
            onClick={handleDownloadClick}
            disabled={isDownloading}
            sx={{
              bgcolor: "#1C64B4",
              color: "#FFFFFF",
              borderRadius: "10px",
              textTransform: "none",
              fontSize: 14,
              fontWeight: 600,
              px: 2.5,
              height: 40,
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#154F91",
              },
            }}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
