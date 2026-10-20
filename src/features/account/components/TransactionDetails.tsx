"use client";

import { Box, CircularProgress, Divider, IconButton, Stack, Typography } from "@mui/material";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { NorthEastRounded, SouthWestRounded } from "@mui/icons-material";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

import { font, palette, radius } from "@/theme/palette";
import { formatAccountNumber } from "@/utils/format-account-number";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseSideDialog from "@core/components/BaseSideDialog";
import { formatTransactionAmount, isIncomingTransaction } from "../account.slice";
import type { TTransactionDetailResponse, TxnStatus } from "../account.types";

/** The core transaction list has no status field of its own — every row it
 *  returns is already posted, so the badge is always "processed". */
const STATUS_COLORS: Record<TxnStatus, { color: string; bg: string }> = {
  processed: { color: palette.success.main, bg: palette.success.bg },
  pending: { color: palette.warning.main, bg: palette.warning.bg },
};

export function toTitleCase(value: string) {
  return value.toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());
}

export interface TransactionDetailsPanelProps {
  open: boolean;
  onClose: () => void;
  transaction: TTransactionDetailResponse | null;
  /** Downloads the receipt/advice for the open transaction. "Options" section is hidden when omitted. */
  onDownload?: (transaction: TTransactionDetailResponse) => void;
  /** The parent's `onDownload` handler is in flight — disables the download
   *  action and shows a spinner in place of its icon. Default false. */
  isDownloading?: boolean;
}

function Row({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
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

/** "From"/"To" party card — counterparty name over their account number. */
function PartyCard({ label, name, account }: { label: string; name?: string; account?: string }) {
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

/** The transaction summary + party/reference fields — shared by the on-screen
 *  slide-over and the downloaded PDF receipt so both stay in sync. */
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
          {toTitleCase(transaction.transactionDescription)}
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
        <PartyCard label={fromLabel} name={transaction.fromAccountName} account={transaction.fromAccountNumber} />
        <PartyCard label={toLabel} name={transaction.toAccountName} account={transaction.toAccountNumber} />
        {transaction.fields?.map((field, index) => (
          <Row key={`${field.key}-${index}`} label={field.label} value={field.value} />
        ))}
      </Stack>
    </Stack>
  );
}

/** Slide-over triggered by clicking a transaction row — the amount up front,
 *  status, then the party/reference fields, then a "Download in PDF" action. */
export default function TransactionDetailsPanel({
  open,
  onClose,
  transaction,
  onDownload,
  isDownloading = false,
}: TransactionDetailsPanelProps) {
  const t = useTranslations("account.transactionDetails");
  if (!transaction) return null;
  return (
    <BaseSideDialog
      open={open}
      onClose={onClose}
      title={t("title")}
      icon={<ReceiptLongRoundedIcon fontSize="small" />}
      width={440}
    >
      <Stack spacing={3}>
        <TransactionDetailsContent
          transaction={transaction}
          fromLabel={t("from")}
          toLabel={t("to")}
          renderAmount={(amount) => <BaseBlurText>{amount}</BaseBlurText>}
          statusLabel={t("statusSuccess")}
        />

        {onDownload && (
          <Stack spacing={1.5}>
            <Typography sx={{ fontSize: font.size.lg }}>{t("options")}</Typography>
            <Stack
              direction="row"
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >


              <Box
                component="button"
                type="button"
                onClick={() => onDownload(transaction)}
                disabled={isDownloading}
                sx={{
                  cursor: isDownloading ? "default" : "pointer",
                  border: "none",
                  bgcolor: "transparent",
                  p: 0,
                  fontFamily: "inherit",
                  fontSize: font.size.base,
                  opacity: isDownloading ? 0.6 : 1,

                  textAlign: "left",
                }}
              >
                {t("downloadPdf")}
              </Box>
              <IconButton
                onClick={() => onDownload(transaction)}
                disabled={isDownloading}
                aria-label={t("downloadAria")}
                sx={{
                  bgcolor: palette.info.bg,
                  color: palette.info[600],
                  borderRadius: `${radius.md}px`,
                  "&:hover": { bgcolor: palette.info[200] },
                }}
              >
                {isDownloading ? <CircularProgress size={18} color="inherit" /> : <Download size={18} />}
              </IconButton>
            </Stack>
          </Stack>
        )}
      </Stack>
    </BaseSideDialog>
  );
}
