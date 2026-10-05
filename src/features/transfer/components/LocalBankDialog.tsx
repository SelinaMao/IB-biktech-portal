"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Globe } from "lucide-react";

import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { localBanks, transferAccounts } from "../transfer.data";
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

export type LocalBankDialogProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: transferAccounts[0].id,
  beneficiaryBank: localBanks[0],
  beneficiaryAccountNumber: "",
  beneficiaryName: "",
  amount: "",
  currency: "USD",
  remark: "",
};

export default function LocalBankDialog({ open, onClose }: LocalBankDialogProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);

  const set = <K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const fromAccount = findAccount(transferAccounts, values.fromAccountId);

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "Beneficiary Bank", value: values.beneficiaryBank },
    { label: "Beneficiary Account", value: values.beneficiaryAccountNumber || "-" },
    { label: "Beneficiary Name", value: values.beneficiaryName || "-" },
    { label: "Amount", value: amountPreviewValue(values.amount, values.currency) },
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
  ];

  const summaryRows = buildTransferSummaryRows(values.amount, values.currency);

  return (
    <PreviewTransferDialog
      open={open}
      onClose={onClose}
      title="To Local Bank"
      icon={<Globe size={18} />}
      canSubmit={Boolean(
        values.amount && values.beneficiaryAccountNumber && values.beneficiaryName && values.fromAccountId,
      )}
      previewFields={previewFields}
      summaryRows={summaryRows}
      successMessage={`${values.amount} ${currencyLabel(values.currency)} sent to ${values.beneficiaryName || "the beneficiary"} at ${values.beneficiaryBank}.`}
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
