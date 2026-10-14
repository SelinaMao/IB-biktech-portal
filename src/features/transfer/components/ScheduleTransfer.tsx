"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Landmark } from "lucide-react";

import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { scheduleFrequencies, transferAccounts } from "../transfer.data";
import {
  accountOptionLabel,
  accountSelectOptions,
  amountPreviewValue,
  buildTransferSummaryRows,
  currencyLabel,
  CURRENCY_OPTIONS,
  findAccount,
} from "../transfer.utils";
import PreviewTransfer, { type TransferPreviewField } from "./PreviewTransfer";

export type ScheduleTransferProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: transferAccounts[0].id,
  toAccountId: transferAccounts[1].id,
  amount: "",
  currency: "USD",
  scheduleDate: "",
  frequency: scheduleFrequencies[0].value,
  remark: "",
};

export default function ScheduleTransfer({ open, onClose }: ScheduleTransferProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);

  const set = <K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const fromAccount = findAccount(transferAccounts, values.fromAccountId);
  const toAccount = findAccount(transferAccounts, values.toAccountId);
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
      canSubmit={Boolean(values.amount && values.scheduleDate && values.fromAccountId && values.toAccountId)}
      previewFields={previewFields}
      summaryRows={summaryRows}
      successMessage={`${values.amount} ${currencyLabel(values.currency)} scheduled to ${toAccount?.name ?? "the selected account"} starting ${values.scheduleDate}.`}
      onReset={() => setValues(INITIAL_VALUES)}
    >
      <Stack spacing={2.5}>
        <BaseSelect
          label="From Account"
          value={values.fromAccountId}
          onChange={(e) => set("fromAccountId", e.target.value as string)}
          options={accountSelectOptions(transferAccounts)}
        />
        
        <BaseSelect
          label="To Account"
          value={values.toAccountId}
          onChange={(e) => set("toAccountId", e.target.value as string)}
          options={accountSelectOptions(transferAccounts)}
        />

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-end" }}>
          <Box sx={{ flex: 1 }}>
            <BaseInput
              label="Amount"
              value={values.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0.00"
            />
          </Box>
          <Box sx={{ width: 110 }}>
            <BaseSelect
              label=" "
              value={values.currency}
              onChange={(e) => set("currency", e.target.value as string)}
              options={CURRENCY_OPTIONS}
            />
          </Box>
        </Stack>

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
