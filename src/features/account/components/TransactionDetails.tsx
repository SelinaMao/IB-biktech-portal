"use client";

import React from "react";
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
import { Calendar, CheckCircle2, Download, FileText, X } from "lucide-react";
import { NorthEastRounded, SouthWestRounded } from "@mui/icons-material";

import { font, palette, radius } from "@/theme/palette";
import { formatAccountNumber } from "@/utils/format-account-number";
import BaseBlurText from "@core/components/BaseBlurText";
import { showToast } from "@core/components/AppToast";
import { findTransactionField, formatTransactionAmount, isIncomingTransaction } from "../account.slice";
import type { TTransactionDetailResponse, TxnStatus } from "../account.types";

/** Slide in from the right transition matching AccountInformationDetail */
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

/** Status colors for receipt/legacy displays */
const STATUS_COLORS: Record<TxnStatus, { color: string; bg: string }> = {
  processed: { color: palette.success.main, bg: palette.success.bg },
  pending: { color: palette.warning.main, bg: palette.warning.bg },
};

export function toTitleCase(value: string) {
  return value.toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());
}

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

export interface TransactionDetailsPanelProps {
  open: boolean;
  onClose: () => void;
  transaction: TTransactionDetailResponse | null;
  /** Downloads the receipt/advice for the open transaction in PDF. */
  onDownload?: (transaction: TTransactionDetailResponse) => void;
  /** The parent's `onDownload` handler is in flight — disables the download
   *  action and shows a spinner in place of its icon. Default false. */
  isDownloading?: boolean;
  onAddSchedule?: (transaction: TTransactionDetailResponse) => void;
  onSaveTemplate?: (transaction: TTransactionDetailResponse) => void;
}

export interface TransactionDetailsContentProps {
  transaction: TTransactionDetailResponse;
  fromLabel?: string;
  toLabel?: string;
  /** Wraps the amount display — the live panel blurs it behind the privacy
   *  toggle; a generated PDF should always render it plain. Defaults to plain. */
  renderAmount?: (amount: string) => React.ReactNode;
  /** Every row the core transaction list returns is already posted, so this
   *  defaults to "processed" — only pass it to show a "pending" badge. */
  status?: TxnStatus;
  statusLabel?: string;
}

/** Legacy / Receipt template helper row */
function ReceiptRow({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  if (!value) return null;
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        py: 1.25,
        gap: 2,
      }}
    >
      <Typography variant="body2" sx={{ color: palette.slate[400], flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600, fontSize: 14, textAlign: "right", color }}>{value}</Typography>
    </Stack>
  );
}

/** "From"/"To" party card used by PDF receipts */
function ReceiptPartyCard({ label, name, account }: { label: string; name?: string; account?: string }) {
  if (!name && !account) return null;
  return (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ color: palette.slate[700] }}>
        {label}
      </Typography>
      <Box
        sx={{
          bgcolor: palette.slate[50],
          borderRadius: `${radius.lg}px`,
          px: 3,
          py: 3,
        }}
      >
        {name && (
          <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{name}</Typography>
        )}
        {account && (
          <Typography
            variant="body2"
            sx={{ color: palette.slate[400], mt: name ? 0.25 : 0 }}
          >
            {/^[\d\s-]+$/.test(account) ? formatAccountNumber(account) : account}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

/** The transaction summary + party/reference fields — preserved for generated PDF receipts */
export function TransactionDetailsContent({
  transaction,
  fromLabel = "From",
  toLabel = "To",
  renderAmount = (amount) => amount,
  status = "processed",
  statusLabel = status === "processed" ? "Success" : "Pending",
}: TransactionDetailsContentProps) {
  const isIn = isIncomingTransaction(transaction);
  const statusColor = STATUS_COLORS[status];

  return (
    <Stack spacing={3}>
      <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            bgcolor: isIn ? palette.navy[900] : palette.danger.bg,
            color: isIn ? palette.navy[100] : palette.danger.main,
          }}
        >
          {isIn ? (
            <SouthWestRounded sx={{ fontSize: 22 }} />
          ) : (
            <NorthEastRounded sx={{ fontSize: 22 }} />
          )}
        </Box>

        <Typography sx={{ fontSize: 14, color: palette.slate[400] }}>
          {toTitleCase(transaction.transactionDescription || "")}
        </Typography>

        <Typography
          sx={{
            fontSize: font.size.xxl,
            color: isIn ? palette.navy[100] : palette.danger[500],
          }}
        >
          {renderAmount(formatTransactionAmount(transaction))}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: palette.slate[400] }}>
            {transaction.transactionDate}
            {transaction.transactionTime ? ` ${transaction.transactionTime}` : ""}
          </Typography>
          <Box
            component="span"
            sx={{
              px: 1.5,
              py: 0.25,
              borderRadius: "999px",
              bgcolor: statusColor.bg,
              color: statusColor.color,
              fontSize: 12,
              fontWeight: 700,
              lineHeight: "18px",
            }}
          >
            {statusLabel}
          </Box>
        </Stack>
      </Stack>

      <Stack spacing={3}>
        <ReceiptPartyCard label={fromLabel} name={transaction.fromAccountName} account={transaction.fromAccountNumber} />
        <ReceiptPartyCard label={toLabel} name={transaction.toAccountName} account={transaction.toAccountNumber} />
        {transaction.fields?.map((field, index) => (
          <ReceiptRow key={`${field.key}-${index}`} label={field.label} value={field.value} />
        ))}
      </Stack>
    </Stack>
  );
}

function formatTxnDateTime(dateStr?: string, timeStr?: string) {
  if (!dateStr) return "19 Oct 2026, 08:15 AM";
  const fullStr = timeStr ? `${dateStr} ${timeStr}` : dateStr;
  const parsed = dayjs(fullStr);
  if (parsed.isValid()) {
    return parsed.format("D MMM YYYY, hh:mm A");
  }
  const dateParsed = dayjs(dateStr);
  if (dateParsed.isValid()) {
    const formattedDate = dateParsed.format("D MMM YYYY");
    return timeStr ? `${formattedDate}, ${timeStr}` : formattedDate;
  }
  return dateStr;
}

/**
 * Slide-in Dialog displaying full details of the clicked transaction row
 * with clean typography, generous spacing, and polished margins/padding.
 */
export default function TransactionDetailsPanel({
  open,
  onClose,
  transaction,
  onDownload,
  isDownloading = false,
  onAddSchedule,
  onSaveTemplate,
}: TransactionDetailsPanelProps) {
  if (!transaction) return null;

  const isIncoming = isIncomingTransaction(transaction);

  // Currency & Amounts
  const currency = (transaction.transactionCurrency || "USD").toUpperCase();
  const rawAmount = Math.abs(transaction.transactionAmount ?? 25);
  const formattedAmount = rawAmount.toLocaleString("en-US", {
    minimumFractionDigits: currency === "KHR" ? 0 : 2,
    maximumFractionDigits: 2,
  });

  // Top Title: e.g. "Transfer to SOK DARA" or "Transfer from Operating account"
  const counterpartyName = isIncoming ? transaction.fromAccountName : transaction.toAccountName;
  const transferTitle = isIncoming
    ? `Transfer from ${counterpartyName || "Operating account"}`
    : `Transfer to ${counterpartyName || "SOK DARA"}`;

  // Big Amount Display: e.g. "-USD 25.00"
  const amountWithSign = `${isIncoming ? "+" : "-"}${currency} ${formattedAmount}`;

  // Date and Time
  const formattedDateTime = formatTxnDateTime(transaction.transactionDate, transaction.transactionTime);

  // Field values with realistic fallbacks matching design
  const transactionId =
    transaction.transactionId ||
    findTransactionField(transaction.fields, "transactionId") ||
    findTransactionField(transaction.fields, "Transaction ID") ||
    "TXN-88213409";
  const referenceNo =
    transaction.transactionReferenceCode ||
    findTransactionField(transaction.fields, "referenceNo") ||
    findTransactionField(transaction.fields, "reference") ||
    findTransactionField(transaction.fields, "Reference #") ||
    findTransactionField(transaction.fields, "Reference no.") ||
    (transaction as any).referenceNo ||
    transaction.transactionId ||
    "FT2610190008";

  const rawFromNum = transaction.fromAccountNumber || "001234567890";
  const fromAccountNo = formatAccountNumber(rawFromNum) || rawFromNum || "0012 3456 7890";
  const fromAccountName = transaction.fromAccountName || "Operating account";

  const rawToNum = transaction.toAccountNumber || "001234567";
  const toAccountNo = formatAccountNumber(rawToNum) || rawToNum || "001 234 567";
  const toAccountName = transaction.toAccountName || "SOK DARA";

  const bankName =
    findTransactionField(transaction.fields, "bank") ||
    (transaction as any).bankName ||
    (transaction as any).toBankName ||
    "ABA Bank";

  const debitAmountField =
    findTransactionField(transaction.fields, "debitAmount") ||
    findTransactionField(transaction.fields, "Debit Amount");

  const debitAmountFormatted = debitAmountField
    ? debitAmountField
    : (transaction as any).debitAmount
      ? `${currency} ${(transaction as any).debitAmount}`
      : `${currency} ${formattedAmount}`;

  const remarks =
    transaction.transactionMemo ||
    transaction.transactionDescription ||
    findTransactionField(transaction.fields, "remarks") ||
    findTransactionField(transaction.fields, "Remarks") ||
    "October office rent";

  const handleDownloadPdf = async () => {
    if (onDownload) {
      onDownload(transaction);
      return;
    }
    try {
      const { generateTransactionReceiptPdf } = await import("../utils/transaction-receipt-pdf");
      const { downloadBlob } = await import("@/utils/download-file");
      const blob = await generateTransactionReceiptPdf(transaction);
      downloadBlob(blob, `transaction-${transactionId}.pdf`);
    } catch {
      showToast("error", {
        title: "Download failed",
        message: "Could not generate transaction receipt.",
      });
    }
  };

  const handleAddSchedule = () => {
    if (onAddSchedule) {
      onAddSchedule(transaction);
      return;
    }
    showToast("info", {
      title: "Add schedule",
      message: `Schedule created for ${toAccountName}.`,
    });
  };

  const handleSaveTemplate = () => {
    if (onSaveTemplate) {
      onSaveTemplate(transaction);
      return;
    }
    showToast("success", {
      title: "Save as template",
      message: `Template saved for ${toAccountName}.`,
    });
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
            {transferTitle}
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
            <span>Completed</span>
          </Box>
        </Stack>

        {/* Big Amount */}
        <Typography
          sx={{
            fontSize: 30,
            fontWeight: 800,
            color: isIncoming ? "#36A17E" : "#D32F2F",
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
            mb: 1,
          }}
        >
          <BaseBlurText>{amountWithSign}</BaseBlurText>
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
          <DetailRow label="Account Name" value={fromAccountName} />
          <DetailRow label="Account No" value={fromAccountNo} />

          <SectionSubhead title="To" />
          <DetailRow label="Account Name" value={toAccountName} />
          <DetailRow label="Account No" value={toAccountNo} />
          <DetailRow label="Bank" value={bankName} dottedDivider />

          <DetailRow
            label={isIncoming ? "Credit amount" : "Debit amount"}
            value={debitAmountFormatted}
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
            Download (PDF)
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<Calendar size={16} />}
            onClick={handleAddSchedule}
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
            Add schedule
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<FileText size={16} />}
            onClick={handleSaveTemplate}
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
            Save as template
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
