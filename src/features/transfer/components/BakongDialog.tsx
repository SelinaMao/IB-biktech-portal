"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Settings } from "lucide-react";

import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { transferAccounts } from "../transfer.data";
import {
  accountOptionLabel,
  accountSelectOptions,
  amountPreviewValue,
  buildTransferSummaryRows,
  currencyLabel,
  CURRENCY_OPTIONS,
  findAccount,
} from "../transfer.utils";
import PreviewTransferDialog, { type TransferPreviewField } from "./PreviewTransferDialog";

export type BakongDialogProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: transferAccounts[0].id,
  bakongId: "",
  recipientName: "",
  amount: "",
  currency: "USD",
  remark: "",
};

export default function BakongDialog({ open, onClose }: BakongDialogProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);

  const set = <K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const fromAccount = findAccount(transferAccounts, values.fromAccountId);

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "Bakong ID / Phone", value: values.bakongId || "-" },
    { label: "Recipient Name", value: values.recipientName || "-" },
    { label: "Amount", value: amountPreviewValue(values.amount, values.currency) },
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
  ];

  const summaryRows = buildTransferSummaryRows(values.amount, values.currency);

  return (
    <PreviewTransferDialog
      open={open}
      onClose={onClose}
      title="To Bakong"
      icon={<Settings size={18} />}
      canSubmit={Boolean(values.amount && values.bakongId && values.fromAccountId)}
      previewFields={previewFields}
      summaryRows={summaryRows}
      successMessage={`${values.amount} ${currencyLabel(values.currency)} sent to ${values.recipientName || values.bakongId} via Bakong.`}
      onReset={() => setValues(INITIAL_VALUES)}
    >
      <Stack spacing={2.5}>
        <BaseSelect
          label="From Account"
          value={values.fromAccountId}
          onChange={(e) => set("fromAccountId", e.target.value as string)}
          options={accountSelectOptions(transferAccounts)}
        />
        <BaseInput
          label="Bakong ID / Phone Number"
          value={values.bakongId}
          onChange={(e) => set("bakongId", e.target.value)}
          placeholder="e.g. 012 345 678"
        />
        <BaseInput
          label="Recipient Name"
          value={values.recipientName}
          onChange={(e) => set("recipientName", e.target.value)}
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

        <BaseTextArea
          label="Remark"
          value={values.remark}
          onChange={(e) => set("remark", e.target.value)}
          placeholder="Optional note"
        />
      </Stack>
    </PreviewTransferDialog>
  );
}
