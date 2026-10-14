import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { palette } from "@/theme/palette";
import { formatAccountNumber } from "@/utils/format-account-number";
import type { CoreAccountEntry } from "@/features/account";
import { USD_TO_KHR_RATE } from "@/features/dashboard/dashboard.data";
import type { CalculateTransferResult, TransferAccount } from "./transfer.types";
import type { TransferReviewRow } from "./components/PreviewTransfer";

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD", name: "US Dollar", flag: "/assets/icons/usd.svg" },
  { value: "KHR", label: "៛", name: "Khmer Riel", flag: "/branding/flags/km.svg" },
];

/** Display label for a currency value (e.g. for interpolating into summary/success text). */
export function currencyLabel(ccy: string) {
  return CURRENCY_OPTIONS.find((o) => o.value === ccy)?.label ?? ccy;
}

export function accountOptionLabel(account: TransferAccount) {
  return (
    <Box sx={{ textAlign: "left" }}>
      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{account.name}</Typography>
      <Typography variant="caption" sx={{ color: palette.slate[400] }}>
        {formatAccountNumber(account.number)} |{" "}
        <Box component="span" sx={{ color: palette.navy[800], fontWeight: 600 }}>
          {account.balance}
        </Box>{" "}
        {account.currency}
      </Typography>
    </Box>
  );
}

/** Maps accounts to BaseSelect options with the two-line name/number/balance label. */
export function accountSelectOptions(accounts: TransferAccount[]) {
  return accounts.map((a) => ({ value: a.id, label: accountOptionLabel(a) }));
}

export function findAccount(accounts: TransferAccount[], id: string) {
  return accounts.find((a) => a.id === id);
}

/** Resolves a beneficiary name from an "Other SME Bank" account number against the mock directory. */
export function findOtherSmeBankAccountName(
  directory: { number: string; name: string }[],
  accountNumber: string,
) {
  return directory.find((entry) => entry.number === accountNumber)?.name;
}

/** Maps a live `POST bank/accounts` row to the shape BaseSelect's account options expect. */
export function mapAccountEntry(entry: CoreAccountEntry): TransferAccount {
  return {
    id: entry.accountNumber,
    name: entry.accountName,
    number: entry.accountNumber,
    balance: entry.availableBalance.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    currency: entry.ccy,
  };
}

/** The Review step's "Amount" preview box — amount on the left, currency on the right. */
export function amountPreviewValue(amount: string, currency: string) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Box component="span">{amount || "-"}</Box>
      <Box component="span" sx={{ color: palette.slate[400] }}>
        {currencyLabel(currency)}
      </Box>
    </Box>
  );
}

/** "1,250.5" -> 1250.5; anything that is not a positive amount with at most 2 decimals -> NaN. */
export function parseTransferAmount(value: string) {
  const plain = value.replace(/,/g, "");
  const parsed = Number(plain);
  return parsed > 0 && /^\d+(\.\d{1,2})?$/.test(plain) ? parsed : Number.NaN;
}

/** 1250.5 -> "1,250.50" (riel has no cents to pad). */
export function formatAmount(amount: number, currency: string) {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: currency === "KHR" ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** 1250.5, "USD" -> "1,250.50 USD"; a missing amount -> "-". */
export function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "-";
  return `${formatAmount(amount, currency)} ${currencyLabel(currency)}`;
}

/**
 * The Review step's Summary, as payment-service priced it. The labels are there before the
 * price is, so the card keeps its shape while it loads.
 */
export function quoteSummaryRows(quote: CalculateTransferResult | null): TransferReviewRow[] {
  return [
    { label: "Amount", value: quote ? formatMoney(quote.amount, quote.currency) : "-" },
    { label: "Fee", value: quote ? formatMoney(quote.feeAmount, quote.feeCurrency) : "-" },
    {
      label: "Exchange Rate",
      value: quote?.exchangeRate ? `1 USD = ${quote.exchangeRate.toLocaleString("en-US")} KHR` : "-",
    },
    { label: "Debit Amount", value: quote ? formatMoney(quote.totalAmount, quote.originalCurrency) : "-" },
    { label: "Credit Amount", value: quote ? formatMoney(quote.receivedAmount, quote.receivedCurrency) : "-" },
  ];
}

/**
 * Amount/Fee/Exchange-Rate/Debit-Amount rows for the Review step's "Summary"
 * card. There's no fee model yet, so Fee is always 0; Exchange Rate is the
 * informational USD/KHR reference rate (mirrors the dashboard's Exchange
 * Rates card), not a live conversion of the transfer's own currency.
 */
export function buildTransferSummaryRows(amount: string, currency: string): TransferReviewRow[] {
  const amountLabel = amount ? `${amount} ${currencyLabel(currency)}` : "-";
  return [
    { label: "Amount", value: amountLabel },
    { label: "Fee", value: `0.00 ${currencyLabel(currency)}` },
    { label: "Exchange Rate", value: `1 USD = ${USD_TO_KHR_RATE.toLocaleString()} KHR` },
    { label: "Debit Amount", value: amountLabel },
  ];
}
