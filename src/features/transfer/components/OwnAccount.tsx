"use client";

import React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { User } from "lucide-react";
import { useForm } from "react-hook-form";

import BaseFromAccount from "@core/components/BaseFromAccount";
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
import TransferScheduleSection from "./TransferScheduleSection";

export type OwnAccountProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  toAccountId: "",
  amount: "",
  currency: "USD",
  remark: "",
  scheduleTransfer: false,
  frequency: "one-time" as "one-time" | "recurring",
  timing: "today" as "today" | "later" | "weekly",
  scheduleDate: "Today, 14 Mar 2026",
  endCondition: "after-transfers" as "after-transfers" | "no-end-date",
};

export default function OwnAccount({ open, onClose }: OwnAccountProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);
  const { accounts, loading: loadingAccounts } = useTransferAccounts(open);
  const quote = useTransferQuote();
  const [submitTransfer] = useSubmitOwnAccountTransferMutation();

  const { control, watch, setValue, reset } = useForm({
    defaultValues: { fromAccountId: "" },
  });

  const set = <K extends keyof typeof INITIAL_VALUES>(key: K, value: (typeof INITIAL_VALUES)[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  // From defaults to the first account, To to the first other one
  const watchedFromId = watch("fromAccountId");
  const fromAccountId = watchedFromId || accounts[0]?.id || "";
  const toAccountId =
    values.toAccountId && values.toAccountId !== fromAccountId
      ? values.toAccountId
      : accounts.find((a) => a.id !== fromAccountId)?.id || "";

  React.useEffect(() => {
    if (!watchedFromId && accounts[0]?.id) {
      setValue("fromAccountId", accounts[0].id);
    }
  }, [accounts, watchedFromId, setValue]);

  const fromAccount = findAccount(accounts, fromAccountId);
  const toAccount = findAccount(accounts, toAccountId);
  const amount = parseTransferAmount(values.amount);
  const amountInvalid = values.amount !== "" && Number.isNaN(amount);

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

  // const submit = () =>
  //   submitTransfer({
  //     fromAccountNumber: fromAccount?.number ?? "",
  //     toAccountNumber: toAccount?.number ?? "",
  //     amount,
  //     currency: values.currency,
  //     remark: values.remark.trim() || undefined,
  //   }).unwrap();
  const submit = (idempotencyKey?: string) =>
    submitTransfer({
      body: {
        fromAccountNumber: fromAccount?.number ?? "",
        toAccountNumber: toAccount?.number ?? "",
        amount,
        currency: values.currency,
        remark: values.remark.trim() || undefined,
      },
      idempotencyKey: idempotencyKey || crypto.randomUUID(),
    }).unwrap();
  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "To Account", value: toAccount ? accountOptionLabel(toAccount) : "-" },
    {
      label: "Amount",
      value: amountPreviewValue(Number.isNaN(amount) ? "" : formatAmount(amount, values.currency), values.currency),
    },
    ...(values.scheduleTransfer
      ? [
        { label: "Frequency", value: values.frequency === "one-time" ? "One-time" : "Recurring" },
        { label: "Date", value: values.scheduleDate || "-" },
      ]
      : []),
    ...(values.remark.trim() ? [{ label: "Remark", value: values.remark.trim() }] : []),
  ];

  const fromOptions = accountSelectOptions(accounts);
  const toOptions = fromOptions.map((option) => ({ ...option, disabled: option.value === fromAccountId }));
  const onlyOneAccount = !loadingAccounts && accounts.length === 1;

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
      fromAccount={
        fromAccount
          ? { name: fromAccount.name, accountNumber: fromAccount.number }
          : undefined
      }
      toAccount={
        toAccount
          ? { name: toAccount.name, accountNumber: toAccount.number }
          : undefined
      }
      topSection={
        <BaseFromAccount
          name="fromAccountId"
          control={control}
          accounts={accounts}
        />
      }
      canSubmit={Boolean(fromAccount && toAccount && fromAccountId !== toAccountId && !Number.isNaN(amount))}
      previewFields={previewFields}
      summaryRows={quoteSummaryRows(quote.quote)}
      summaryStatus={quote.status === "error" ? "error" : quote.status === "ready" ? "ready" : "loading"}
      onRetrySummary={quote.retry}
      successMessage={`${formatMoney(amount, values.currency)} to ${toAccount?.name ?? "the selected account"}.`}
      onReset={() => {
        setValues(INITIAL_VALUES);
        reset({ fromAccountId: accounts[0]?.id ?? "" });
        quote.reset();
      }}
      onReview={priceTransfer}
      submit={submit}
    >
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 15, color: "#0F172A", mb: 1 }}>
            To Account
          </Typography>
          <BaseSelect
            value={toAccountId}

            onChange={(e) => set("toAccountId", e.target.value as string)}
            options={toOptions}
            error={onlyOneAccount}
            helperText={onlyOneAccount ? "You need a second account to transfer between your own accounts." : undefined}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#F8FAFC",
                borderRadius: "16px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "transparent",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#CBD5E1",
                  borderWidth: 1.5,
                },
              },
            }}
            {...accountFieldProps}
          />
        </Box>

        <Box>
          <BaseAmountCurrencyField
            label={<Typography sx={{ fontWeight: 600, fontSize: 15, color: "#0F172A", mb: 0.5 }}>Amount</Typography>}
            amount={values.amount}
            onAmountChange={(value) => set("amount", value)}
            currency={values.currency}
            onCurrencyChange={(value) => set("currency", value)}
            options={CURRENCY_OPTIONS}
            error={amountInvalid}
            helperText={amountInvalid ? "Enter an amount above 0 with up to 2 decimal places." : undefined}
          />
        </Box>

        <TransferScheduleSection
          enabled={values.scheduleTransfer}
          onToggle={(val) => set("scheduleTransfer", val)}
          frequency={values.frequency}
          onFrequencyChange={(val) => set("frequency", val)}
          timing={values.timing}
          onTimingChange={(val) => set("timing", val)}
          startDate={values.scheduleDate}
          onStartDateChange={(val) => set("scheduleDate", val)}
          endCondition={values.endCondition}
          onEndConditionChange={(val) => set("endCondition", val)}
        />

        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 15, color: "#0F172A", mb: 1 }}>
            Remark
          </Typography>
          <BaseTextArea
            value={values.remark}
            onChange={(e) => set("remark", e.target.value)}
            placeholder="Pay good service"
            minRows={2}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#F8FAFC",
                borderRadius: "16px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "transparent",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#CBD5E1",
                  borderWidth: 1.5,
                },
              },
            }}
          />
          <Typography sx={{ fontSize: 13, color: "#94A3B8", mt: 0.75, px: 0.5 }}>
            Shown on both account statements.
          </Typography>
        </Box>
      </Stack>
    </PreviewTransfer>
  );
}