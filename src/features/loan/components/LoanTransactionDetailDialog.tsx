"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Slide,
  Stack,
  Typography,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { CheckCircle2, Download, X } from "lucide-react";

import { font, palette, radius } from "@/theme/palette";
import { formatAccountNumber } from "@/utils/format-account-number";
import { downloadBlob } from "@/utils/download-file";
import BaseBlurText from "@core/components/BaseBlurText";
import { showToast } from "@core/components/AppToast";
import type { LoanTransaction } from "../loan.types";

/** Slide in from the right transition matching Account transaction detail */
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

/** Clean label-value row with comfortable spacing and padding */
function DetailRow({
  label,
  value,
  dottedDivider = false,
}: {
  label: string;
  value: React.ReactNode;
  dottedDivider?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <Box
      sx={{
        py: dottedDivider ? 1.6 : 1.35,
        borderBottom: dottedDivider ? "1px dotted #CBD5E1" : "none",
      }}
    >
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: 13.5,
            color: "#64748B",
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: "0.1px",
            flexShrink: 0,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: 13.5,
            color: "#0F172A",
            fontWeight: 600,
            lineHeight: 1.5,
            textAlign: "right",
            wordBreak: "break-word",
          }}
        >
          {value}
        </Typography>
      </Stack>
    </Box>
  );
}

/** Section subheader (e.g. "From", "To") with generous spacing */
function SectionSubhead({ title }: { title: string }) {
  return (
    <Typography
      sx={{
        fontSize: 14,
        fontWeight: 700,
        color: "#0F172A",
        mt: 2.5,
        mb: 0.75,
        letterSpacing: "0.1px",
      }}
    >
      {title}
    </Typography>
  );
}

function formatLoanTxnDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  const parsed = dayjs(dateStr);
  if (parsed.isValid()) {
    return parsed.format("D MMM YYYY");
  }
  return dateStr;
}

export interface LoanTransactionDetailDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: LoanTransaction | null;
  borrowerName?: string;
  borrowerAccountNumber?: string;
  onDownload?: (transaction: LoanTransaction) => void;
}

/**
 * Slide-in Dialog displaying full details of the clicked loan repayment row
 * matching the latest Account transaction details UI specification.
 */
export default function LoanTransactionDetailDialog({
  open,
  onClose,
  transaction,
  borrowerName,
  borrowerAccountNumber,
  onDownload,
}: LoanTransactionDetailDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!transaction) return null;

  const rawAccNumber = borrowerAccountNumber || "";
  const formattedAccountNumber = formatAccountNumber(rawAccNumber) || rawAccNumber;
  const accountDisplayName = borrowerName || "—";

  // Amount formatting with negative sign for debit repayment
  const rawTotal = transaction.total || transaction.amount || "—";
  const displayAmount = rawTotal === "—" ? "—" : rawTotal.startsWith("-")
    ? rawTotal
    : rawTotal.startsWith("+")
      ? rawTotal.replace(/^\+/, "-")
      : `-${rawTotal}`;

  const positiveAmount = rawTotal.replace(/^[+-]/, "");

  // Date and Time
  const formattedDateTime = formatLoanTxnDateTime(transaction.date || transaction.dueDate);

  // The core supplies the scheduled installment values; missing optional fields stay empty.
  const transactionId = transaction.ref || String(transaction.no ?? "—");
  const referenceNo = transaction.ref || "—";
  const toAccountName = "Loan account";
  const remarks = transaction.title || "—";

  const handleDownloadPdf = async () => {
    if (onDownload) {
      onDownload(transaction);
      return;
    }
    setIsDownloading(true);
    try {
      const csv = [
        "Transaction ID,Reference,Date,Description,Amount,Status,Borrower,Borrower Account",
        `"${transactionId}","${referenceNo}","${formattedDateTime}","${remarks}","${rawTotal}","${transaction.status || "—"}","${accountDisplayName}","${formattedAccountNumber}"`,
      ].join("\n");
      downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `loan-transaction-${transactionId}.csv`);
      showToast("success", {
        title: "Download completed",
        message: `Transaction statement for ${transactionId} downloaded.`,
      });
    } catch {
      showToast("error", {
        title: "Download failed",
        message: "Could not generate transaction document.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

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
            p: { xs: 2.5, sm: "28px 24px" },
            boxSizing: "border-box",
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
            overflowY: "auto",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header: Title and Close button */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            sx={{
              fontSize: 19,
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.3,
              letterSpacing: "-0.2px",
            }}
          >
            Transaction details
          </Typography>

          <IconButton
            onClick={onClose}
            size="small"
            aria-label="close"
            sx={{
              color: "#64748B",
              p: 0.75,
              borderRadius: "8px",
              "&:hover": { bgcolor: "#F1F5F9" },
            }}
          >
            <X size={18} />
          </IconButton>
        </Stack>

        {/* Transfer To / From and Status Badge */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1.5,
            mb: 1.25,
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              color: "#0F172A",
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Transfer to {toAccountName}
          </Typography>

          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              bgcolor: "#36A17E",
              color: "#FFFFFF",
              borderRadius: "6px",
              px: 1.45,
              py: 1.45,
              fontSize: 11.5,
              fontWeight: 600,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={13} strokeWidth={2.5} color="#FFFFFF" />
            <span>
              {transaction.status === "due"
                ? "Due"
                : transaction.status === "upcoming"
                  ? "Upcoming"
                  : "Completed"}
            </span>
          </Box>
        </Stack>

        {/* Big Amount */}
        <Typography
          sx={{
            fontSize: 30,
            fontWeight: 800,
            color: "#D32F2F",
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
            mb: 1,
          }}
        >
          <BaseBlurText>{displayAmount}</BaseBlurText>
        </Typography>

        {/* Date and Time */}
        <Typography
          sx={{
            fontSize: 13,
            color: "#64748B",
            lineHeight: 1.4,
            mb: 1,
          }}
        >
          {formattedDateTime}
        </Typography>

        {/* Section Heading: Transaction Details */}
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 700,
            color: "#0F172A",
            mt: 3.5,
            mb: 1.5,
            letterSpacing: "0.1px",
          }}
        >
          Transaction Details
        </Typography>

        {/* Details list */}
        <Stack spacing={0}>
          <DetailRow label="Transaction ID" value={transactionId} dottedDivider />
          <DetailRow label="Reference no." value={referenceNo} />

          <SectionSubhead title="From" />
          <DetailRow label="Account Name" value={accountDisplayName} />
          <DetailRow label="Account No" value={formattedAccountNumber} />

          <SectionSubhead title="To" />
          <DetailRow label="Account Name" value={toAccountName} />

          <DetailRow
            label="Debit amount"
            value={positiveAmount}
            dottedDivider
          />
          <DetailRow label="Remarks" value={remarks} />
        </Stack>

        {/* Action Buttons */}
        <Stack spacing={1.5} sx={{ mt: 4.5, mb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={
              isDownloading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Download size={16} />
              )
            }
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            sx={{
              height: 42,
              borderRadius: "10px",
              borderColor: "#E2E8F0",
              color: "#0F172A",
              bgcolor: "#FFFFFF",
              textTransform: "none",
              fontSize: 13.5,
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": {
                borderColor: "#CBD5E1",
                bgcolor: "#F8FAFC",
              },
            }}
          >
            Download (CSV)
          </Button>

        </Stack>
      </DialogContent>
    </Dialog>
  );
}
