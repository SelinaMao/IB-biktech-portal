"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Globe } from "lucide-react";
import { useForm } from "react-hook-form";

import BaseFromAccount from "@core/components/BaseFromAccount";
import { showToast } from "@core/components/AppToast";
import BaseAmountCurrencyField from "@core/form/BaseAmountCurrencyField";
import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { toToastError } from "@/utils/api-error";
import {
  useInquireExternalAccountMutation,
  useListBakongBanksQuery,
  useSubmitBakongLocalBankTransferMutation,
} from "../transfer.api";
import type { ExternalAccountInquiryResult } from "../transfer.types";
import {
  accountOptionLabel,
  amountPreviewValue,
  buildTransferSchedule,
  CURRENCY_OPTIONS,
  findAccount,
  formatMoney,
  parseTransferAmount,
} from "../transfer.utils";
import { useTransferAccounts } from "../use-transfer-accounts";
import { useTransferQuote } from "../use-transfer-quote";
import PreviewTransfer, { type TransferPreviewField } from "./PreviewTransfer";
import TransferScheduleSection from "./TransferScheduleSection";

export type LocalBankProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: "",
  beneficiaryBankCode: "",
  beneficiaryAccountNumber: "",
  amount: "",
  currency: "USD",
  remark: "",
  scheduleTransfer: false,
  frequency: "one-time" as "one-time" | "weekly" | "monthly" | "recurring",
  timing: "today" as "today" | "later" | "weekly",
  scheduleDate: "",
  endCondition: "after-transfers" as "after-transfers" | "no-end-date",
};

export default function LocalBank({ open, onClose }: LocalBankProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);
  const { accounts } = useTransferAccounts(open);
  const { data: banks = [], isLoading: loadingBanks, isFetching: fetchingBanks, error: banksError } =
    useListBakongBanksQuery(undefined, { skip: !open });
  const [inquireExternalAccount, { isLoading: inquiring }] = useInquireExternalAccountMutation();
  const [submitLocalBankTransfer] = useSubmitBakongLocalBankTransferMutation();
  const quote = useTransferQuote();
  const [inquiry, setInquiry] = React.useState<{
    key: string;
    result: ExternalAccountInquiryResult;
  } | null>(null);
  const { control, watch, setValue, reset } = useForm({
    defaultValues: { fromAccountId: "" },
  });

  const watchedFromId = watch("fromAccountId");
  const fromAccountId = watchedFromId || accounts[0]?.id || "";

  const set = <K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  React.useEffect(() => {
    if (!watchedFromId && accounts[0]?.id) {
      setValue("fromAccountId", accounts[0].id);
    }
  }, [accounts, watchedFromId, setValue]);

  React.useEffect(() => {
    if (open && banksError) {
      showToast("error", toToastError(banksError, "Could not load banks"));
    }
  }, [open, banksError]);

  React.useEffect(() => {
    if (!values.beneficiaryBankCode && banks[0]?.code) {
      setValues((prev) =>
        prev.beneficiaryBankCode ? prev : { ...prev, beneficiaryBankCode: banks[0].code },
      );
    }
  }, [banks, values.beneficiaryBankCode]);

  const selectedBank = banks.find((bank) => bank.code === values.beneficiaryBankCode);
  const normalizedAccountNumber = values.beneficiaryAccountNumber.replace(/\s+/g, "");
  const inquiryKey = `${values.beneficiaryBankCode}:${normalizedAccountNumber}`;
  const beneficiary =
    inquiry?.key === inquiryKey ? inquiry.result : null;

  React.useEffect(() => {
    let active = true;
    setInquiry(null);
    if (!open || !values.beneficiaryBankCode || normalizedAccountNumber.length < 6) {
      return () => {
        active = false;
      };
    }

    const timer = window.setTimeout(() => {
      void inquireExternalAccount({
        accountNumber: normalizedAccountNumber,
        transferPlatform: "BANK",
        transferPlatformCode: values.beneficiaryBankCode,
        boundType: "LOCAL",
      })
        .unwrap()
        .then((result) => {
          if (!active) return;
          setInquiry({ key: inquiryKey, result });
          if (CURRENCY_OPTIONS.some((option) => option.value === result.currency)) {
            setValues((prev) => ({ ...prev, currency: result.currency }));
          }
        })
        .catch((error: unknown) => {
          if (active) {
            showToast("error", toToastError(error, "Could not verify beneficiary account"));
          }
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    open,
    values.beneficiaryBankCode,
    normalizedAccountNumber,
    inquiryKey,
    inquireExternalAccount,
  ]);

  const fromAccount = findAccount(accounts, fromAccountId);
  const amount = parseTransferAmount(values.amount);
  const amountIsValid = !Number.isNaN(amount);

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "Beneficiary Bank", value: selectedBank?.name || "-" },
    { label: "Beneficiary Account", value: normalizedAccountNumber || "-" },
    { label: "Beneficiary Name", value: beneficiary?.accountName || "-" },
    { label: "Amount", value: amountPreviewValue(values.amount, values.currency) },
    ...(values.scheduleTransfer
      ? [
          {
            label: "Frequency",
            value:
              values.frequency === "weekly"
                ? "Weekly"
                : values.frequency === "monthly"
                ? "Monthly"
                : values.frequency === "recurring"
                ? "Recurring"
                : "One-time",
          },
          { label: "Start Date", value: values.scheduleDate || "Immediately" },
        ]
      : []),
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
  ];

  const summaryRows = quote.quote
    ? [
        {
          label: "Amount Transferred",
          value: formatMoney(quote.quote.amount, quote.quote.currency),
        },
        { label: "Transaction ID", value: "-" },
        { label: "Reference no", value: "-" },
        {
          label: "Debit amount",
          value: formatMoney(quote.quote.totalAmount, quote.quote.originalCurrency),
        },
        {
          label: "Fee",
          value: formatMoney(quote.quote.feeAmount, quote.quote.feeCurrency),
        },
        ...(quote.quote.exchangeRate
          ? [{ label: "Exchange Rate", value: String(quote.quote.exchangeRate) }]
          : []),
        {
          label: "Credit Amount",
          value: formatMoney(quote.quote.receivedAmount, quote.quote.receivedCurrency),
        },
      ]
    : [
        { label: "Amount Transferred", value: "-" },
        { label: "Transaction ID", value: "-" },
        { label: "Reference no", value: "-" },
        { label: "Debit amount", value: "-" },
      ];

  const priceTransfer = () => {
    if (!fromAccount || !selectedBank || !beneficiary || !amountIsValid) return;
    void quote.fetchQuote({
      transferType: "BAKONG_LOCAL_BANK",
      fromAccountNumber: fromAccount.number,
      fromAccountCurrency: fromAccount.currency,
      toAccountNumber: normalizedAccountNumber,
      toAccountCurrency: beneficiary.currency,
      amount,
      currency: values.currency,
    });
  };

  const submit = (idempotencyKey?: string) => {
    if (!fromAccount || !selectedBank || !beneficiary || !amountIsValid) {
      throw new Error("Complete the beneficiary and transfer details before submitting");
    }
    return submitLocalBankTransfer({
      body: {
        fromAccountNumber: fromAccount.number,
        bankCode: selectedBank.code,
        toAccountNumber: normalizedAccountNumber,
        amount,
        currency: values.currency,
        remark: values.remark.trim() || undefined,
        schedule: values.scheduleTransfer
          ? buildTransferSchedule({
              scheduleTransfer: values.scheduleTransfer,
              frequency: values.frequency,
              scheduleDate: values.scheduleDate,
            })
          : undefined,
      },
      idempotencyKey: idempotencyKey || crypto.randomUUID(),
    }).unwrap();
  };

  return (
    <PreviewTransfer
      splitView
      open={open}
      onClose={onClose}
      title="To Local Bank"
      icon={<Globe size={18} />}
      fromAccount={fromAccount ? { name: fromAccount.name, accountNumber: fromAccount.number, balance: fromAccount.balance, currency: fromAccount.currency } : undefined}
      toAccount={{
        name: beneficiary?.accountName || "Beneficiary",
        accountNumber: normalizedAccountNumber,
      }}
      topSection={
        <BaseFromAccount
          name="fromAccountId"
          control={control}
          accounts={accounts}
        />
      }
      canSubmit={Boolean(amountIsValid && beneficiary && selectedBank && fromAccount)}
      previewFields={previewFields}
      summaryRows={summaryRows}
      summaryStatus={
        quote.status === "error" ? "error" : quote.status === "ready" ? "ready" : "loading"
      }
      onRetrySummary={quote.retry}
      onReview={priceTransfer}
      submit={submit}
      successMessage={`${formatMoney(amount, values.currency)} sent to ${beneficiary?.accountName || "the beneficiary"} at ${selectedBank?.name || "the selected bank"}.`}
      onReset={() => {
        setValues(INITIAL_VALUES);
        reset({ fromAccountId: accounts[0]?.id ?? "" });
        setInquiry(null);
        quote.reset();
      }}
    >
      <Stack spacing={2.5}>
        <BaseSelect
          label="Beneficiary Bank"
          value={values.beneficiaryBankCode}
          onChange={(e) => set("beneficiaryBankCode", e.target.value as string)}
          options={banks.map((bank) => ({ value: bank.code, label: bank.name }))}
          disabled={loadingBanks || fetchingBanks || banks.length === 0}
          placeholder={
            loadingBanks || fetchingBanks
              ? "Loading banks..."
              : banks.length === 0
                ? "No banks available"
                : undefined
          }
        />
        <BaseInput
          label="Beneficiary Account Number"
          value={values.beneficiaryAccountNumber}
          onChange={(e) => set("beneficiaryAccountNumber", e.target.value)}
          placeholder="e.g. 000123456789"
        />
        <BaseInput
          label="Beneficiary Name"
          value={beneficiary?.accountName ?? ""}
          disabled={!beneficiary}
          placeholder={inquiring ? "Verifying account..." : "Verified name appears here"}
          helperText={
            beneficiary
              ? `Verified account · ${beneficiary.currency}`
              : "Enter an account number to verify the beneficiary"
          }
        />

        <Box>
          <BaseAmountCurrencyField
            label={
              <Typography sx={{ fontWeight: 600, fontSize: 15, color: "#0F172A", mb: 0.5 }}>
                Amount
              </Typography>
            }
            amount={values.amount}
            onAmountChange={(value) => set("amount", value)}
            currency={values.currency}
            onCurrencyChange={(value) => set("currency", value)}
            options={CURRENCY_OPTIONS}
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

        <BaseTextArea
          label="Remark"
          value={values.remark}
          onChange={(e) => set("remark", e.target.value)}
          placeholder="Input remark"
          helperText="Show on both accounts"
          minRows={1}
        />
      </Stack>
    </PreviewTransfer>
  );
}
