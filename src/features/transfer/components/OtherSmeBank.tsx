"use client";

import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Landmark } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import ControlledBaseAmountCurrencyField from "@core/form/ControlledBaseAmountCurrencyField";
import ControlledBaseInput from "@core/form/ControlledBaseInput";
import ControlledBaseSelect from "@core/form/ControlledBaseSelect";
import ControlledBaseTextArea from "@core/form/ControlledBaseTextArea";
import { otherSmeBankDirectory, scheduleFrequencies, transferAccounts } from "../transfer.data";
import {
  accountOptionLabel,
  accountSelectOptions,
  amountPreviewValue,
  buildTransferSummaryRows,
  currencyLabel,
  CURRENCY_OPTIONS,
  findAccount,
  findOtherSmeBankAccountName,
} from "../transfer.utils";
import PreviewTransfer, { type TransferPreviewField } from "./PreviewTransfer";

export type OtherSmeBankProps = {
  open: boolean;
  onClose: () => void;
};

type OtherSmeBankFormValues = {
  fromAccountId: string;
  toAccountNumber: string;
  amountCurrency: { amount: string; currency: string };
  remark: string;
  scheduleTransfer: boolean;
  frequency: string;
  scheduleDate: string;
  saveTemplate: boolean;
  templateName: string;
};

const INITIAL_VALUES: OtherSmeBankFormValues = {
  fromAccountId: transferAccounts[0].id,
  toAccountNumber: otherSmeBankDirectory[0].number,
  amountCurrency: { amount: "", currency: "USD" },
  remark: "",
  scheduleTransfer: false,
  frequency: scheduleFrequencies[0].value,
  scheduleDate: "",
  saveTemplate: false,
  templateName: "",
};

export default function OtherSmeBank({ open, onClose }: OtherSmeBankProps) {
  const { control, watch, reset } = useForm<OtherSmeBankFormValues>({
    defaultValues: INITIAL_VALUES,
  });
  const values = watch();
  const { amount, currency } = values.amountCurrency;

  const fromAccount = findAccount(transferAccounts, values.fromAccountId);
  const toAccountName = findOtherSmeBankAccountName(otherSmeBankDirectory, values.toAccountNumber);
  const frequencyLabel = scheduleFrequencies.find((f) => f.value === values.frequency)?.label ?? "";

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    {
      label: "To Account",
      value: toAccountName ? `${values.toAccountNumber} (${toAccountName})` : values.toAccountNumber || "-",
    },
    { label: "Amount", value: amountPreviewValue(amount, currency) },
    ...(values.scheduleTransfer
      ? [
          { label: "Frequency", value: frequencyLabel },
          { label: "Date", value: values.scheduleDate || "-" },
        ]
      : []),
    ...(values.remark ? [{ label: "Remarks", value: values.remark }] : []),
    ...(values.saveTemplate && values.templateName
      ? [{ label: "Template", value: values.templateName }]
      : []),
  ];

  const summaryRows = buildTransferSummaryRows(amount, currency);

  return (
    <PreviewTransfer
      open={open}
      onClose={onClose}
      title="Other SME Bank Account"
      icon={<Landmark size={18} />}
      canSubmit={Boolean(
        amount &&
          values.fromAccountId &&
          values.toAccountNumber &&
          (!values.scheduleTransfer || values.scheduleDate),
      )}
      previewFields={previewFields}
      summaryRows={summaryRows}
      successMessage={`${amount} ${currencyLabel(currency)} sent to ${toAccountName ?? values.toAccountNumber}.`}
      onReset={() => reset(INITIAL_VALUES)}
    >
      <Stack >
         <ControlledBaseSelect
          name="fromAccountId"
          control={control}
          label="From Account"
          options={accountSelectOptions(transferAccounts)}
        />
      </Stack>
      <Stack spacing={2.5}>
       

        <Stack spacing={0.5}>
          <ControlledBaseInput
            name="toAccountNumber"
            control={control}
            label="To Account"
            placeholder="e.g. 111 022 998"
          />
        </Stack>

        <ControlledBaseAmountCurrencyField
          name="amountCurrency"
          control={control}
          options={CURRENCY_OPTIONS}
        />

        <ControlledBaseTextArea
          name="remark"
          control={control}
          label="Remarks"
          placeholder="Description"
        />

        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Set Schedule</Typography>
          <Controller
            name="scheduleTransfer"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </Stack>
        {values.scheduleTransfer && (
          <>
            <ControlledBaseSelect
              name="frequency"
              control={control}
              label="Frequency"
              options={scheduleFrequencies}
            />
            <ControlledBaseInput
              name="scheduleDate"
              control={control}
              label="Date"
              type="date"
              placeholder="Select Date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </>
        )}

        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Add to Template</Typography>
          <Controller
            name="saveTemplate"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </Stack>
        {values.saveTemplate && (
          <ControlledBaseInput name="templateName" control={control} label="Template name" />
        )}
      </Stack>
    </PreviewTransfer>
  );
}
