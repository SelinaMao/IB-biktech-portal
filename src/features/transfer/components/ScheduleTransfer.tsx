"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Landmark } from "lucide-react";
import { useForm } from "react-hook-form";

import BaseFromAccount from "@core/components/BaseFromAccount";
import BaseAmountCurrencyField from "@core/form/BaseAmountCurrencyField";
import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { scheduleFrequencies } from "../transfer.data";
import {
  accountOptionLabel,
  accountSelectOptions,
  amountPreviewValue,
  buildTransferSummaryRows,
  currencyLabel,
  CURRENCY_OPTIONS,
  findAccount,
} from "../transfer.utils";
import { useTransferAccounts } from "../use-transfer-accounts";
import PreviewTransfer, { type TransferPreviewField } from "./PreviewTransfer";

export type ScheduleTransferProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: "",
  toAccountId: "",
  amount: "",
  currency: "USD",
  scheduleDate: "",
  frequency: scheduleFrequencies[0].value,
  remark: "",
};

export default function ScheduleTransfer({ open, onClose }: ScheduleTransferProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);
  const { accounts } = useTransferAccounts(open);
  const { control, watch, setValue, reset } = useForm({
    defaultValues: { fromAccountId: "" },
  });

  const watchedFromId = watch("fromAccountId");
  const fromAccountId = watchedFromId || accounts[0]?.id || "";
  const toAccountId = values.toAccountId || accounts.find((a) => a.id !== fromAccountId)?.id || "";

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
  const toAccount = findAccount(accounts, toAccountId);
  const frequencyLabel = scheduleFrequencies.find((f) => f.value === values.frequency)?.label ?? "";

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "To Account", value: toAccount ? accountOptionLabel(toAccount) : "-" },
    { label: "Amount", value: amountPreviewValue(values.amount, values.currency) },
    { label: "Start Date", value: values.scheduleDate || "-" },
    { label: "Frequency", value: frequencyLabel },
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
  ];

  const summaryRows = buildTransferSummaryRows(values.amount, values.currency);

  return (
    <PreviewTransfer
      open={open}
      onClose={onClose}
      title="Schedule Transfer"
      icon={<Landmark size={18} />}
      fromAccount={fromAccount ? { name: fromAccount.name, accountNumber: fromAccount.number } : undefined}
      toAccount={toAccount ? { name: toAccount.name, accountNumber: toAccount.number } : undefined}
      topSection={
        <BaseFromAccount
          name="fromAccountId"
          control={control}
          accounts={accounts}
        />
      }
      canSubmit={Boolean(values.amount && values.scheduleDate && fromAccountId && toAccountId)}
      previewFields={previewFields}
      summaryRows={summaryRows}
      successMessage={`${values.amount} ${currencyLabel(values.currency)} scheduled to ${toAccount?.name ?? "the selected account"} starting ${values.scheduleDate}.`}
      onReset={() => {
        setValues(INITIAL_VALUES);
        reset({ fromAccountId: accounts[0]?.id ?? "" });
      }}
    >
      <Stack spacing={2.5}>
        <BaseSelect
          label="To Account"
          value={toAccountId}
          onChange={(e) => set("toAccountId", e.target.value as string)}
          options={accountSelectOptions(accounts)}
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

        <BaseInput
          label="Start Date"
          type="date"
          value={values.scheduleDate}
          onChange={(e) => set("scheduleDate", e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <BaseSelect
          label="Frequency"
          value={values.frequency}
          onChange={(e) => set("frequency", e.target.value as string)}
          options={scheduleFrequencies}
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
