"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Globe } from "lucide-react";
import { useForm } from "react-hook-form";

import BaseFromAccount from "../../../@core/components/BaseFromAccount";
import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { transferCountries, transferPurposes } from "../transfer.data";
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

export type InternationalProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: "",
  swiftCode: "",
  beneficiaryAccountNumber: "",
  beneficiaryName: "",
  beneficiaryCountry: transferCountries[0],
  amount: "",
  currency: "USD",
  purpose: transferPurposes[0],
  remark: "",
};

export default function International({ open, onClose }: InternationalProps) {
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
    <PreviewTransfer
      open={open}
      onClose={onClose}
      title="International Transfer"
      icon={<Globe size={18} />}
      topSection={
        <BaseFromAccount
          name="fromAccountId"
          control={control}
          accounts={accounts}
        />
      }
      canSubmit={Boolean(
        values.amount &&
          values.swiftCode &&
          values.beneficiaryAccountNumber &&
          values.beneficiaryName &&
          fromAccountId,
      )}
      previewFields={previewFields}
      summaryRows={summaryRows}
      successMessage={`${values.amount} ${currencyLabel(values.currency)} sent to ${values.beneficiaryName || "the beneficiary"} in ${values.beneficiaryCountry}.`}
      onReset={() => {
        setValues(INITIAL_VALUES);
        reset({ fromAccountId: accounts[0]?.id ?? "" });
      }}
    >
      <Stack spacing={2.5}>
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
    </PreviewTransfer>
  );
}