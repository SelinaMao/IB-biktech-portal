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
import { CheckCircle2, Download, FileSpreadsheet, X } from "lucide-react";
import { NorthEastRounded, SouthWestRounded } from "@mui/icons-material";

import { font, palette, radius } from "@/theme/palette";
import { formatAccountNumber } from "@/utils/format-account-number";
import { downloadBlob } from "@/utils/download-file";
import BaseBlurText from "@core/components/BaseBlurText";
import { INITIAL_HISTORY_PAYROLLS, INITIAL_PENDING_PAYROLLS } from "@/features/payroll/payroll.data";
import { formatTransactionAmount, isIncomingTransaction } from "../account.slice";
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

/** Row with dotted divider used in transaction details modal */
function SummaryRow({
  label,
  value,
  valueColor = "#0F172A",
  valueWeight = 600,
  isLast = false,
  py = 2.4,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  valueWeight?: number;
  isLast?: boolean;
  py?: number | string;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <Box
      sx={{
        py,
        borderBottom: isLast ? "none" : "1px dotted #CBD5E1",
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
            fontSize: 13,
            color: "#64748B",
            fontWeight: 400,
            flexShrink: 0,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            color: valueColor,
            fontWeight: valueWeight,
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

export interface TransactionDetailsPanelProps {
  open: boolean;
  onClose: () => void;
  transaction: TTransactionDetailResponse | null;
  /** Downloads the receipt/advice for the open transaction. */
  onDownload?: (transaction: TTransactionDetailResponse) => void;
  /** The parent's `onDownload` handler is in flight — disables the download
   *  action and shows a spinner in place of its icon. Default false. */
  isDownloading?: boolean;
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

/**
 * Dialog sliding in from the right of the page (matching AccountInformationDetail's position & transition).
 * Displays full details of the clicked transaction row matching the uploaded Figma design.
 */
export default function TransactionDetailsPanel({
  open,
  onClose,
  transaction,
  onDownload,
  isDownloading = false,
}: TransactionDetailsPanelProps) {
  if (!transaction) return null;

  // Search for any linked payroll item (by reference or ID)
  const matchingPayroll =
    INITIAL_HISTORY_PAYROLLS.find(
      (p) =>
        p.referenceNo === transaction.transactionReferenceCode ||
        p.id === transaction.transactionId ||
        p.referenceNo === transaction.transactionId ||
        (transaction.transactionReferenceCode && p.referenceNo.includes(transaction.transactionReferenceCode)),
    ) ||
    INITIAL_PENDING_PAYROLLS.find(
      (p) =>
        p.referenceNo === transaction.transactionReferenceCode ||
        p.id === transaction.transactionId ||
        p.referenceNo === transaction.transactionId,
    );

  const isPayroll =
    Boolean(matchingPayroll) ||
    Boolean((transaction as any).records) ||
    Boolean((transaction as any).fileName?.toLowerCase().includes("payroll")) ||
    transaction.transactionDescription?.toLowerCase().includes("payroll") ||
    transaction.transactionDescription?.toLowerCase().includes("salary") ||
    transaction.transactionMemo?.toLowerCase().includes("payroll") ||
    transaction.transactionCode?.toLowerCase().includes("payroll");

  // Currency formatting
  const currency = (transaction.transactionCurrency || matchingPayroll?.currency || "KHR").toUpperCase();
  const isKHR = currency === "KHR";

  // Amount formatting
  const rawAmount = Math.abs(
    transaction.transactionAmount || matchingPayroll?.totalAmount || 8240000,
  );
  const formattedAmount = isKHR
    ? `KHR ${rawAmount.toLocaleString("en-US")}`
    : `${currency === "USD" ? "$" : `${currency} `}${rawAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

  // Fee calculation
  const rawFee =
    matchingPayroll?.fee ??
    (transaction as any).fee ??
    (isPayroll ? (isKHR ? 24000 : 5) : 0);
  const formattedFee =
    rawFee > 0
      ? isKHR
        ? `KHR ${rawFee.toLocaleString("en-US")}`
        : `${currency === "USD" ? "$" : `${currency} `}${rawFee.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
      : "Free";

  // Total Debit calculation
  const rawTotalDebit =
    matchingPayroll?.totalDebitAmount ??
    (transaction as any).totalDebitAmount ??
    (rawAmount + rawFee);
  const formattedTotalDebit = isKHR
    ? `KHR ${rawTotalDebit.toLocaleString("en-US")}`
    : `${currency === "USD" ? "$" : `${currency} `}${rawTotalDebit.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

  // Reference Code & Type
  const referenceCode =
    transaction.transactionReferenceCode ||
    matchingPayroll?.referenceNo ||
    transaction.transactionId ||
    "2819700093P2429";

  const typeLabel =
    transaction.transactionCode?.toLowerCase().includes("bakong") ||
    transaction.transactionDescription?.toLowerCase().includes("bakong") ||
    isPayroll
      ? "Bakong Payment"
      : transaction.transactionDescription || "Payment";

  // File name / memo
  const fileName =
    matchingPayroll?.fileName ||
    transaction.transactionMemo ||
    (isPayroll ? "payroll_oct_2026.xlsx" : transaction.transactionDescription || "-");

  // Source account
  const rawFromNum =
    matchingPayroll?.sourceAccountNumber ||
    transaction.fromAccountNumber ||
    "0098 1122 3344";
  const sourceAccountNum = formatAccountNumber(rawFromNum) || rawFromNum;
  const sourceAccountName =
    matchingPayroll?.sourceAccountName ||
    transaction.fromAccountName ||
    (isPayroll ? "Payroll account" : "Source account");

  // Destination account
  const rawToNum = transaction.toAccountNumber;
  const destinationAccountNum = rawToNum ? formatAccountNumber(rawToNum) || rawToNum : "";
  const destinationAccountName = transaction.toAccountName || "Beneficiary";

  // Processing Date
  const rawDate = matchingPayroll?.processingDate || transaction.transactionDate || "2026-10-14";
  const parsedDate = dayjs(rawDate);
  const formattedDate = parsedDate.isValid() ? parsedDate.format("D MMM YYYY") : rawDate;
  const timing = transaction.transactionTime || matchingPayroll?.processingType || "Immediate";
  const processingDateDisplay = `${formattedDate} · ${timing}`;

  // Records count
  const recordsCount = matchingPayroll?.records ?? (transaction as any).records ?? 24;

  const handleDownloadCsv = () => {
    let csv = "";
    const downloadName = (fileName || "payroll").replace(/\.xlsx$/i, "") + ".csv";
    if (isPayroll) {
      csv = [
        "Employee ID,Beneficiary Name,Account Number,Bank,Amount,Currency,Status",
        "EMP-0101,Dara Vann,0098 1100 2233,Canadia Bank,520000,KHR,Success",
        "EMP-0102,Mony Keo,0098 2211 3344,ABA Bank,380000,KHR,Success",
        "EMP-0103,Sok Pisey,0098 4455 6677,Wing Bank,420000,KHR,Success",
        "EMP-0104,Rithy Keo,0098 3322 1100,ACLEDA Bank,450000,KHR,Success",
        "EMP-0107,Chan Vuthy,0098 7766 5511,ABA Bank,360000,KHR,Success",
      ].join("\n");
    } else {
      csv = [
        "Transaction ID,Reference,Date,Description,Amount,Currency,From Account,To Account",
        `"${transaction.transactionId}","${referenceCode}","${formattedDate}","${transaction.transactionDescription}","${rawAmount}","${currency}","${sourceAccountNum}","${destinationAccountNum}"`,
      ].join("\n");
    }
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), downloadName);
  };

  const handleDownloadExcel = () => {
    if (onDownload) {
      onDownload(transaction);
    } else {
      handleDownloadCsv();
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
            p: { xs: 2.5, sm: "24px 20px" },
            boxSizing: "border-box",
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
            overflowY: "auto",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Top Header Row */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              bgcolor: "#0D7A5F",
              color: "#FFFFFF",
              borderRadius: "8px",
              px: 1.8,
              py: 1.5,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            <CheckCircle2 size={13} strokeWidth={2.5} color="#FFFFFF" />
            <span>Completed</span>
          </Box>

          <IconButton
            onClick={onClose}
            size="small"
            aria-label="close"
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

        {/* Transaction Subtitle / Type · Ref */}
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: "#64748B",
            lineHeight: 1.3,
            mb: 0.5,
            mt:4
          }}
        >
          {typeLabel} · {referenceCode}
        </Typography>

        {/* Large Bold Amount */}
        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0F172A",
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
            mb: 0.5,
            mt: 1.5
          }}
        >
          <BaseBlurText>{formattedAmount}</BaseBlurText>
        </Typography>

        {/* File name / Memo */}
        <Typography
          sx={{
            fontSize: 13,
            color: "#64748B",
            lineHeight: 1.4,
            mb: 3,
            mt:3
          }}
        >
          {fileName}
        </Typography>

        {/* Section 1: Summary */}
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 500,
            color: "#0F172A",
            mb: 1.5,
            mt:1
          }}
        >
          {isPayroll ? "Payroll summary" : "Payment summary"}
        </Typography>

        <Stack sx={{ mb: 4 }}>
          <SummaryRow
            label="Source account"
            value={`${sourceAccountName} · ${sourceAccountNum}`}
          />
          {isPayroll ? (
            <>
              <SummaryRow  label="Number of records" value={recordsCount} />
              <SummaryRow label="Total payroll amount" value={formattedAmount} />
              <SummaryRow label="Processing date" value={processingDateDisplay} isLast />
            </>
          ) : (
            <>
              {destinationAccountNum && (
                <SummaryRow
                  label="Destination account"
                  value={`${destinationAccountName} · ${destinationAccountNum}`}
                />
              )}
              <SummaryRow label="Processing date" value={processingDateDisplay} isLast />
            </>
          )}
        </Stack>

        {/* Middle Card: List of payroll / Record list */}
        <Box
          sx={{
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            p: 2,
            my: 1.5,
            bgcolor: "#FFFFFF",
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                bgcolor: "#EFF6FF",
                color: "#1C64B4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FileSpreadsheet size={18} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.3,
                }}
              >
                {isPayroll ? "List of payroll" : "Transaction receipt"}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#64748B",
                  lineHeight: 1.3,
                  mt: 0.35,
                }}
              >
                {isPayroll
                  ? `All ${recordsCount} employees with amounts and status`
                  : "All transaction details with amounts and status"}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download size={14} />}
              onClick={handleDownloadCsv}
              sx={{
                height: 38,
                borderRadius: "8px",
                borderColor: "#E2E8F0",
                color: "#0F172A",
                bgcolor: "#FFFFFF",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#CBD5E1",
                  bgcolor: "#F8FAFC",
                },
              }}
            >
              CSV
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Download size={14} />}
              onClick={handleDownloadExcel}
              disabled={isDownloading}
              sx={{
                height: 38,
                borderRadius: "8px",
                bgcolor: "#2E9A74",
                color: "#FFFFFF",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#247E5F",
                  boxShadow: "none",
                },
              }}
            >
              {isDownloading ? <CircularProgress size={16} color="inherit" /> : "Excel"}
            </Button>
          </Stack>
        </Box>

        {/* Section 2: Transaction summary */}
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 500,
            color: "#0F172A",
            mt: 4.5,
            mb: 0.5,
          }}
        >
          Transaction summary
        </Typography>

        <Stack>
          <SummaryRow
            label={isPayroll ? "Payroll amount" : "Amount"}
            value={formattedAmount}
          />
          <SummaryRow label="Fee" value={formattedFee} />
          <SummaryRow
            label="Total debit amount"
            value={formattedTotalDebit}
            valueColor="#1C64B4"
            valueWeight={700}
            isLast
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
