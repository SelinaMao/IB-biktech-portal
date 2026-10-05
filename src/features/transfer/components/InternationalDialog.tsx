"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Globe } from "lucide-react";

import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { transferAccounts, transferCountries, transferPurposes } from "../transfer.data";
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

export type InternationalDialogProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: transferAccounts[0].id,
  swiftCode: "",
  beneficiaryAccountNumber: "",
  beneficiaryName: "",
  beneficiaryCountry: transferCountries[0],
  amount: "",
  currency: "USD",
  purpose: transferPurposes[0],
  remark: "",
};

export default function InternationalDialog({ open, onClose }: InternationalDialogProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);

  const set = <K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const fromAccount = findAccount(transferAccounts, values.fromAccountId);

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "SWIFT / Bank Code", value: values.swiftCode || "-" },
    { label: "Beneficiary Account", value: values.beneficiaryAccountNumber || "-" },
    { label: "Beneficiary Name", value: values.beneficiaryName || "-" },
    { label: "Country", value: values.beneficiaryCountry },
    { label: "Amount", value: amountPreviewValue(values.amount, values.currency) },
    { label: "Purpose", value: values.purpose },
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
  ];

  const summaryRows = buildTransferSummaryRows(values.amount, values.currency);

  return (
    <PreviewTransferDialog
      open={open}
      onClose={onClose}
      title="International Transfer"
      icon={<Globe size={18} />}
      canSubmit={Boolean(
        values.amount &&
          values.swiftCode &&
          values.beneficiaryAccountNumber &&
          values.beneficiaryName &&
          values.fromAccountId,
      )}
      previewFields={previewFields}
      summaryRows={summaryRows}
      successMessage={`${values.amount} ${currencyLabel(values.currency)} sent to ${values.beneficiaryName || "the beneficiary"} in ${values.beneficiaryCountry}.`}
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
          label="SWIFT / Bank Code"
          value={values.swiftCode}
          onChange={(e) => set("swiftCode", e.target.value)}
          placeholder="e.g. BOFAUS3N"
        />
        <BaseInput
          label="Beneficiary Account Number / IBAN"
          value={values.beneficiaryAccountNumber}
          onChange={(e) => set("beneficiaryAccountNumber", e.target.value)}
        />
        <BaseInput
          label="Beneficiary Name"
          value={values.beneficiaryName}
          onChange={(e) => set("beneficiaryName", e.target.value)}
        />
        <BaseSelect
          label="Beneficiary Country"
          value={values.beneficiaryCountry}
          onChange={(e) => set("beneficiaryCountry", e.target.value as string)}
          options={transferCountries.map((c) => ({ value: c, label: c }))}
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

        <BaseSelect
          label="Purpose of Transfer"
          value={values.purpose}
          onChange={(e) => set("purpose", e.target.value as string)}
          options={transferPurposes.map((p) => ({ value: p, label: p }))}
        />

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
