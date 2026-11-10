"use client";

import React from "react";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Landmark } from "lucide-react";
import { useForm } from "react-hook-form";

import ControlledBaseAmountCurrencyField from "@core/form/ControlledBaseAmountCurrencyField";
import ControlledBaseInput from "@core/form/ControlledBaseInput";
import ControlledBaseTextArea from "@core/form/ControlledBaseTextArea";
import { useGetAccountDetailMutation } from "@/features/account";
import { palette } from "@/theme/palette";
import { otherSmeBankDirectory } from "../transfer.data";
import {
  accountOptionLabel,
  amountPreviewValue,
  buildTransferSummaryRows,
  currencyLabel,
  CURRENCY_OPTIONS,
  findAccount,
  findOtherSmeBankAccountName,
} from "../transfer.utils";
import { useTransferAccounts } from "../use-transfer-accounts";
import BaseFromAccount from "@core/components/BaseFromAccount";
import PreviewTransfer, { type TransferPreviewField } from "./PreviewTransfer";
import TransferScheduleSection from "./TransferScheduleSection";

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
  frequency: "one-time" | "weekly" | "monthly" | "recurring";
  timing: "today" | "later" | "weekly";
  scheduleDate: string;
  endCondition: "after-transfers" | "no-end-date";
  afterTransfersCount?: number;
  saveTemplate: boolean;
  templateName: string;
};

const INITIAL_VALUES: OtherSmeBankFormValues = {
  fromAccountId: "",
  toAccountNumber: "",
  amountCurrency: { amount: "", currency: "USD" },
  remark: "",
  scheduleTransfer: false,
  frequency: "one-time",
  timing: "today",
  scheduleDate: "",
  endCondition: "after-transfers",
  afterTransfersCount: 3,
  saveTemplate: false,
  templateName: "",
};

export default function OtherSmeBank({ open, onClose }: OtherSmeBankProps) {
  const { accounts } = useTransferAccounts(open);
  const [getAccountDetail, { data: accountDetail }] = useGetAccountDetailMutation();

  const { control, watch, setValue, reset } = useForm<OtherSmeBankFormValues>({
    defaultValues: INITIAL_VALUES,
  });
  const values = watch();
  const { amount, currency } = values.amountCurrency;

  React.useEffect(() => {
    if (!values.fromAccountId && accounts[0]?.id) {
      setValue("fromAccountId", accounts[0].id);
    }
  }, [accounts, values.fromAccountId, setValue]);

  React.useEffect(() => {
    const clean = values.toAccountNumber?.replace(/\s+/g, "") ?? "";
    if (clean.length >= 6) {
      const timer = setTimeout(() => {
        void getAccountDetail({ accountNumber: clean });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [values.toAccountNumber, getAccountDetail]);

  const fromAccount = findAccount(accounts, values.fromAccountId) || accounts[0];
  const toAccountName = accountDetail?.accountName || findOtherSmeBankAccountName(otherSmeBankDirectory, values.toAccountNumber);
  const frequencyLabel =
    values.frequency === "weekly"
      ? "Weekly"
      : values.frequency === "monthly"
      ? "Monthly"
      : values.frequency === "recurring"
      ? "Recurring"
      : "One-time";

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
          { label: "Start Date", value: values.scheduleDate || "Immediately" },
        ]
      : []),
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
    ...(values.saveTemplate && values.templateName
      ? [{ label: "Template", value: values.templateName }]
      : []),
  ];

  const summaryRows = buildTransferSummaryRows(amount, currency);

  return (
    <PreviewTransfer
      open={open}
      onClose={onClose}
      title="Other BiKTECH BANK Account"
      icon={<Landmark size={18} />}
      fromAccount={fromAccount ? { name: fromAccount.name, accountNumber: fromAccount.number } : undefined}
      toAccount={{
        name: toAccountName || values.toAccountNumber || "Sokha Chan",
        accountNumber: values.toAccountNumber,
      }}
      topSection={
        <BaseFromAccount
          name="fromAccountId"
          control={control}
          accounts={accounts}
        />
      }
      canSubmit={Boolean(
        amount &&
          fromAccount &&
          values.toAccountNumber

      )}
      previewFields={previewFields}
      summaryRows={summaryRows}
      successMessage={`${amount} ${currencyLabel(currency)} sent to ${toAccountName ?? values.toAccountNumber}.`}
      onReset={() => {
        reset(INITIAL_VALUES);
        if (accounts[0]?.id) setValue("fromAccountId", accounts[0].id);
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#0F172A", mb: 1 }}>
            Beneficiary name
          </Typography>
          <ControlledBaseInput
            name="toAccountNumber"
            control={control}
            placeholder="Sokha Chan"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#FFFFFF",
                borderRadius: "12px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#CBD5E1",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#2764A5",
                  borderWidth: 1.5,
                },
              },
            }}
            slotProps={{
              htmlInput: {
                style: {
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "#0F172A",
                  padding: "13px 16px",
                },
              },
              input: {
                endAdornment: toAccountName ? (
                  <InputAdornment position="end" sx={{ mr: 0.5 }}>
                    <CheckCircleOutlineRoundedIcon sx={{ color: "#2E937A", fontSize: 22 }} />
                  </InputAdornment>
                ) : null,
              },
            }}
          />
          <Typography sx={{ fontSize: 12.5, color: "#64748B", mt: 1, px: 0.5 }}>
            {toAccountName ? `${toAccountName} | ${currency}` : "As shown on their bank account"}
          </Typography>
        </Box>

        <Box>
          <ControlledBaseAmountCurrencyField
            name="amountCurrency"
            control={control}
            label={
              <Typography sx={{ fontWeight: 600, fontSize: 15, color: "#0F172A", mb: 0.5 }}>
                Amount
              </Typography>
            }
            options={CURRENCY_OPTIONS}
          />
        </Box>

        <TransferScheduleSection
          enabled={values.scheduleTransfer}
          onToggle={(val) => setValue("scheduleTransfer", val)}
          frequency={values.frequency}
          onFrequencyChange={(val) => setValue("frequency", val)}
          timing={values.timing}
          onTimingChange={(val) => setValue("timing", val)}
          startDate={values.scheduleDate}
          onStartDateChange={(val) => setValue("scheduleDate", val)}
          endCondition={values.endCondition}
          onEndConditionChange={(val) => setValue("endCondition", val)}
          afterTransfersCount={values.afterTransfersCount}
        />

        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 15, color: "#0F172A", mb: 1 }}>
            Remark
          </Typography>
          <ControlledBaseTextArea
            name="remark"
            control={control}
            placeholder="Input remark"
            minRows={1}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#FFFFFF",
                borderRadius: "12px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#CBD5E1",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#2764A5",
                  borderWidth: 1.5,
                },
              },
            }}
            slotProps={{
              htmlInput: {
                style: {
                  fontSize: "16px",
                  color: "#0F172A",
                },
              },
            }}
          />
          <Typography sx={{ fontSize: 12.5, color: "#64748B", mt: 1, px: 0.5 }}>
            Show on both accounts
          </Typography>
        </Box>
      </Stack>
    </PreviewTransfer>
  );
}