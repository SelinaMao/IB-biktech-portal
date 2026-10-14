"use client";

import React from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { User } from "lucide-react";

import BaseAmountCurrencyField from "@core/form/BaseAmountCurrencyField";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { palette } from "@/theme/palette";
import { useSubmitOwnAccountTransferMutation } from "../transfer.api";
import {
  accountOptionLabel,
  accountSelectOptions,
  amountPreviewValue,
  CURRENCY_OPTIONS,
  findAccount,
  formatAmount,
  formatMoney,
  parseTransferAmount,
  quoteSummaryRows,
} from "../transfer.utils";
import { useTransferAccounts } from "../use-transfer-accounts";
import { useTransferQuote } from "../use-transfer-quote";
import PreviewTransfer, { type TransferPreviewField } from "./PreviewTransfer";

export type OwnAccountProps = {
  open: boolean;
  onClose: () => void;
};

// Accounts are only what the user picked; until then From/To fall back to defaults
const INITIAL_VALUES = {
  fromAccountId: "",
  toAccountId: "",
  amount: "",
  currency: "USD",
  remark: "",
};

export default function OwnAccount({ open, onClose }: OwnAccountProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);
  const { accounts, loading: loadingAccounts } = useTransferAccounts(open);
  const quote = useTransferQuote();
  const [submitTransfer] = useSubmitOwnAccountTransferMutation();

  const set = <K extends keyof typeof INITIAL_VALUES>(key: K, value: (typeof INITIAL_VALUES)[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  // From defaults to the first account, To to the first other one
  const fromAccountId = values.fromAccountId || accounts[0]?.id || "";
  const toAccountId = values.toAccountId || accounts.find((a) => a.id !== fromAccountId)?.id || "";
  const fromAccount = findAccount(accounts, fromAccountId);
  const toAccount = findAccount(accounts, toAccountId);
  const amount = parseTransferAmount(values.amount);
  const amountInvalid = values.amount !== "" && Number.isNaN(amount);

  // Picking the To account as From swaps the two, so they never match
  const selectFrom = (id: string) =>
    setValues((prev) => ({
      ...prev,
      fromAccountId: id,
      toAccountId: id === toAccountId ? fromAccountId : prev.toAccountId,
    }));

  const priceTransfer = () => {
    if (!fromAccount || !toAccount || Number.isNaN(amount)) return;
    void quote.fetchQuote({
      transferType: "OWN_ACCOUNT",
      fromAccountNumber: fromAccount.number,
      fromAccountCurrency: fromAccount.currency,
      toAccountNumber: toAccount.number,
      toAccountCurrency: toAccount.currency,
      amount,
      currency: values.currency,
    });
  };

  const submit = () =>
    submitTransfer({
      fromAccountNumber: fromAccount?.number ?? "",
      toAccountNumber: toAccount?.number ?? "",
      amount,
      currency: values.currency,
      remark: values.remark.trim() || undefined,
    }).unwrap();

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "To Account", value: toAccount ? accountOptionLabel(toAccount) : "-" },
    {
      label: "Amount",
      value: amountPreviewValue(Number.isNaN(amount) ? "" : formatAmount(amount, values.currency), values.currency),
    },
    ...(values.remark.trim() ? [{ label: "Remark", value: values.remark.trim() }] : []),
  ];

  const fromOptions = accountSelectOptions(accounts);
  const toOptions = fromOptions.map((option) => ({ ...option, disabled: option.value === fromAccountId }));
  const onlyOneAccount = !loadingAccounts && accounts.length === 1;

  // While the list is on its way the pickers say so instead of sitting empty
  const accountFieldProps = loadingAccounts
    ? {
        disabled: true,
        placeholder: "Loading accounts…",
        slotProps: {
          input: {
            startAdornment: (
              <CircularProgress
                size={16}
                thickness={5}
                disableShrink
                sx={{ mr: 3, flexShrink: 0, color: palette.navy[800] }}
              />
            ),
          },
        },
      }
    : {};

  return (
    <PreviewTransfer
      open={open}
      onClose={onClose}
      title="Own Account Transfer"
      icon={<User size={18} />}
      canSubmit={Boolean(fromAccount && toAccount && fromAccountId !== toAccountId && !Number.isNaN(amount))}
      previewFields={previewFields}
      summaryRows={quoteSummaryRows(quote.quote)}
      // The price is asked for on the way into Review, so "idle" there means it's about to load
      summaryStatus={quote.status === "error" ? "error" : quote.status === "ready" ? "ready" : "loading"}
      onRetrySummary={quote.retry}
      successMessage={`${formatMoney(amount, values.currency)} to ${toAccount?.name ?? "the selected account"}.`}
      onReset={() => {
        setValues(INITIAL_VALUES);
        quote.reset();
      }}
      onReview={priceTransfer}
      submit={submit}
    >
      <Stack spacing={2.5}>
        <BaseSelect
          label="From Account"
          value={fromAccountId}
          onChange={(e) => selectFrom(e.target.value as string)}
          options={fromOptions}
          {...accountFieldProps}
        />
        <BaseSelect
          label="To Account"
          value={toAccountId}
          onChange={(e) => set("toAccountId", e.target.value as string)}
          options={toOptions}
          error={onlyOneAccount}
          helperText={onlyOneAccount ? "You need a second account to transfer between your own accounts." : undefined}
          {...accountFieldProps}
        />

        <BaseAmountCurrencyField
          amount={values.amount}
          onAmountChange={(value) => set("amount", value)}
          currency={values.currency}
          onCurrencyChange={(value) => set("currency", value)}
          options={CURRENCY_OPTIONS}
          error={amountInvalid}
          helperText={amountInvalid ? "Enter an amount above 0 with up to 2 decimal places." : undefined}
        />

        <BaseTextArea
          label="Remark"
          value={values.remark}
          onChange={(e) => set("remark", e.target.value)}
          placeholder="Optional note"
        />

        <Stack spacing={0.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Schedule Transfer</Typography>
            <Switch checked={false} disabled />
          </Stack>
          <Typography variant="caption" sx={{ color: palette.slate[400] }}>
            Scheduled transfers are not available yet. This transfer runs as soon as it is approved.
          </Typography>
        </Stack>
      </Stack>
    </PreviewTransfer>
  );
}
