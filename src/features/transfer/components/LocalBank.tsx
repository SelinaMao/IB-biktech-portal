"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Globe } from "lucide-react";
import { useForm } from "react-hook-form";

import BaseFromAccount from "@core/components/BaseFromAccount";
import BaseAmountCurrencyField from "@core/form/BaseAmountCurrencyField";
import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { localBanks } from "../transfer.data";
import {
  accountOptionLabel,
  amountPreviewValue,
  buildTransferSummaryRows,
  currencyLabel,
  CURRENCY_OPTIONS,
  findAccount,
} from "../transfer.utils";
import { useTransferAccounts } from "../use-transfer-accounts";
import PreviewTransfer, { type TransferPreviewField } from "./PreviewTransfer";
import TransferScheduleSection from "./TransferScheduleSection";

export type LocalBankProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: "",
  beneficiaryBank: localBanks[0],
  beneficiaryAccountNumber: "",
  beneficiaryName: "",
  amount: "",
  currency: "USD",
  remark: "",
  scheduleTransfer: false,
  frequency: "one-time" as "one-time" | "recurring",
  timing: "today" as "today" | "later" | "weekly",
  scheduleDate: "Today, 14 Mar 2026",
  endCondition: "after-transfers" as "after-transfers" | "no-end-date",
};

export default function LocalBank({ open, onClose }: LocalBankProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);
  const { accounts } = useTransferAccounts(open);
  const { control, watch, setValue, reset } = useForm({
    defaultValues: { fromAccountId: "" },
  });

  const watchedFromId = watch("fromAccountId");
  const fromAccountId = watchedFromId || accounts[0]?.id || "";

  React.useEffect(() => {
    if (!watchedFromId && accounts[0]?.id) {
      setValue("fromAccountId", accounts[0].id);
    }
  }, [accounts, watchedFromId, setValue]);

  const set = <K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const fromAccount = findAccount(accounts, fromAccountId);

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "Beneficiary Bank", value: values.beneficiaryBank },
    { label: "Beneficiary Account", value: values.beneficiaryAccountNumber || "-" },
    { label: "Beneficiary Name", value: values.beneficiaryName || "-" },
    { label: "Amount", value: amountPreviewValue(values.amount, values.currency) },
    ...(values.scheduleTransfer
      ? [
          { label: "Frequency", value: values.frequency === "one-time" ? "One-time" : "Recurring" },
          { label: "Date", value: values.scheduleDate || "-" },
        ]
      : []),
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
  ];

  const summaryRows = buildTransferSummaryRows(values.amount, values.currency);

  return (
    <PreviewTransfer
      open={open}
      onClose={onClose}
      title="To Local Bank"
      icon={<Globe size={18} />}
      fromAccount={fromAccount ? { name: fromAccount.name, accountNumber: fromAccount.number } : undefined}
      toAccount={{
        name: values.beneficiaryName || "Beneficiary",
        accountNumber: values.beneficiaryAccountNumber,
      }}
      topSection={
        <BaseFromAccount
          name="fromAccountId"
          control={control}
          accounts={accounts}
        />
      }
      canSubmit={Boolean(
        values.amount && values.beneficiaryAccountNumber && values.beneficiaryName && fromAccountId,
      )}
      previewFields={previewFields}
      summaryRows={summaryRows}
      successMessage={`${values.amount} ${currencyLabel(values.currency)} sent to ${values.beneficiaryName || "the beneficiary"} at ${values.beneficiaryBank}.`}
      onReset={() => {
        setValues(INITIAL_VALUES);
        reset({ fromAccountId: accounts[0]?.id ?? "" });
      }}
    >
      <Stack spacing={2.5}>
        <BaseSelect
          label="Beneficiary Bank"
          value={values.beneficiaryBank}
          onChange={(e) => set("beneficiaryBank", e.target.value as string)}
          options={localBanks.map((bank) => ({ value: bank, label: bank }))}
        />
        <BaseInput
          label="Beneficiary Account Number"
          value={values.beneficiaryAccountNumber}
          onChange={(e) => set("beneficiaryAccountNumber", e.target.value)}
          placeholder="e.g. 000123456789"
        />
        <BaseInput
          label="Beneficiary Name"
          value={values.beneficiaryName}
          onChange={(e) => set("beneficiaryName", e.target.value)}
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
          placeholder="Optional note"
        />
      </Stack>
    </PreviewTransfer>
  );
}
