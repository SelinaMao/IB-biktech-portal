"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import Typography from "@mui/material/Typography";
import BaseFromAccount from "@core/components/BaseFromAccount";
import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { internationalBanks, transferPurposes } from "../transfer.data";
import { useSubmitInternationalTransferMutation } from "../transfer.api";
import {
  accountOptionLabel,
  amountPreviewValue,
  buildTransferSummaryRows,
  currencyLabel,
  CURRENCY_OPTIONS,
  findAccount,
  parseTransferAmount,
} from "../transfer.utils";
import { useTransferAccounts } from "../use-transfer-accounts";
import PreviewTransfer, { type TransferPreviewField } from "./PreviewTransfer";
import { BaseAmountCurrencyField } from "@core/form";

export type InternationalProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: "",
  swiftCode: "",
  beneficiaryAccountNumber: "",
  beneficiaryName: "",
  beneficiaryCountry: "",
  amount: "",
  currency: "USD",
  purpose: transferPurposes[0],
  remark: "",
};

export default function International({ open, onClose }: InternationalProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);
  const { accounts } = useTransferAccounts(open);
  const [submitInternationalTransfer] = useSubmitInternationalTransferMutation();
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
  const selectedBank = internationalBanks.find((bank) => bank.swiftCode === values.swiftCode);
  const amount = parseTransferAmount(values.amount);
  const amountIsValid = Number.isFinite(amount) && amount > 0;

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "Beneficiary Bank", value: selectedBank?.bankName || "-" },
    { label: "SWIFT / Bank Code", value: values.swiftCode || "-" },
    { label: "Beneficiary Account", value: values.beneficiaryAccountNumber || "-" },
    { label: "Beneficiary Name", value: values.beneficiaryName || "-" },
    { label: "Country", value: values.beneficiaryCountry },
    { label: "Amount", value: amountPreviewValue(values.amount, values.currency) },
    { label: "Purpose", value: values.purpose },
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
  ];

  const summaryRows = buildTransferSummaryRows(values.amount, values.currency);
  const submit = (idempotencyKey?: string) => {
    if (
      !fromAccount ||
      !selectedBank ||
      !amountIsValid ||
      !values.beneficiaryAccountNumber.trim() ||
      !values.beneficiaryName.trim()
    ) {
      throw new Error("Complete the beneficiary and transfer details before submitting");
    }

    return submitInternationalTransfer({
      body: {
        fromAccountNumber: fromAccount.number,
        swiftCode: selectedBank.swiftCode,
        beneficiaryAccountNumber: values.beneficiaryAccountNumber.trim(),
        beneficiaryName: values.beneficiaryName.trim(),
        beneficiaryCountry: values.beneficiaryCountry,
        amount,
        currency: values.currency,
        purposeOfTransfer: values.purpose,
        remark: values.remark.trim() || undefined,
      },
      idempotencyKey: idempotencyKey || crypto.randomUUID(),
    }).unwrap();
  };

  return (
    <PreviewTransfer
      splitView
      open={open}
      onClose={onClose}
      title="International Transfer"
      icon={<Globe size={18} />}
      fromAccount={fromAccount ? { name: fromAccount.name, accountNumber: fromAccount.number, balance: fromAccount.balance, currency: fromAccount.currency } : undefined}
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
        amountIsValid &&
        selectedBank &&
        values.beneficiaryAccountNumber &&
        values.beneficiaryName &&
        fromAccountId,
      )}
      previewFields={previewFields}
      summaryRows={summaryRows}
      submit={submit}
      successMessage={`${values.amount} ${currencyLabel(values.currency)} sent to ${values.beneficiaryName || "the beneficiary"} in ${values.beneficiaryCountry}.`}
      onReset={() => {
        setValues(INITIAL_VALUES);
        reset({ fromAccountId: accounts[0]?.id ?? "" });
      }}
    >
      <Stack spacing={2.5}>
        <BaseSelect
          label="Beneficiary Bank"
          value={values.swiftCode}
          onChange={(event) => {
            const bank = internationalBanks.find((candidate) => candidate.swiftCode === event.target.value);
            if (!bank) return;
            setValues((prev) => ({
              ...prev,
              swiftCode: bank.swiftCode,
              beneficiaryCountry: bank.countryName,
            }));
          }}
          options={internationalBanks.map((bank) => ({
            value: bank.swiftCode,
            label: `${bank.bankName} (${bank.swiftCode}) · ${bank.countryCode}`,
          }))}
          placeholder="Select a beneficiary bank"
        />
        {selectedBank && (
          <BaseInput
            label="SWIFT / Bank Code"
            value={`${selectedBank.swiftCode} / ${selectedBank.bankCode}`}
            disabled
          />
        )}
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
        <BaseInput
          label="Beneficiary Country"
          value={values.beneficiaryCountry}
          disabled
          placeholder="Selected bank country appears here"
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