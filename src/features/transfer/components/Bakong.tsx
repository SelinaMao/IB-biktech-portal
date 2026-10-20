"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Settings } from "lucide-react";

import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import Typography from "@mui/material/Typography";
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
import { BaseAmountCurrencyField } from "@core/form";

export type BakongProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: "",
  bakongId: "",
  recipientName: "",
  amount: "",
  currency: "USD",
  remark: "",
};

export default function Bakong({ open, onClose }: BakongProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);
  const { accounts } = useTransferAccounts(open);

  const set = <K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const fromAccountId = values.fromAccountId || accounts[0]?.id || "";
  const fromAccount = findAccount(accounts, fromAccountId);

  React.useEffect(() => {
    if (!values.fromAccountId && accounts[0]?.id) {
      set("fromAccountId", accounts[0].id);
    }
  }, [accounts, values.fromAccountId]);

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "Bakong ID / Phone", value: values.bakongId || "-" },
    { label: "Recipient Name", value: values.recipientName || "-" },
    { label: "Amount", value: amountPreviewValue(values.amount, values.currency) },
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
  ];

  const summaryRows = buildTransferSummaryRows(values.amount, values.currency);

  return (
    <PreviewTransfer
      open={open}
      onClose={onClose}
      title="To Bakong"
      icon={<Settings size={18} />}
      fromAccount={fromAccount ? { name: fromAccount.name, accountNumber: fromAccount.number } : undefined}
      toAccount={{
        name: values.recipientName || "Bakong Recipient",
        accountNumber: values.bakongId,
      }}
      canSubmit={Boolean(values.amount && values.bakongId && fromAccountId)}
      previewFields={previewFields}
      summaryRows={summaryRows}
      successMessage={`${values.amount} ${currencyLabel(values.currency)} sent to ${values.recipientName || values.bakongId} via Bakong.`}
      onReset={() => setValues(INITIAL_VALUES)}
    >
      <Stack spacing={2.5}>
        <BaseSelect
          label="From Account"
          value={fromAccountId}
          onChange={(e) => set("fromAccountId", e.target.value as string)}
          options={accountSelectOptions(accounts)}
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
