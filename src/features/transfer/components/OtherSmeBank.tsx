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
  frequency: "one-time" | "recurring";
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
  scheduleDate: "Today, 14 Mar 2026",
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
  const frequencyLabel = values.frequency === "one-time" ? "One-time" : "Recurring";

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
      title="Other SME Bank Account"
      icon={<Landmark size={18} />}
      fromAccount={fromAccount ? { name: fromAccount.name, accountNumber: fromAccount.number } : undefined}
      toAccount={{
        name: toAccountName || "Sarah Jenkins",
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
          values.toAccountNumber &&
          (!values.scheduleTransfer || values.scheduleDate),
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
          <Typography sx={{ fontWeight: 600, fontSize: 15, color: "#0F172A", mb: 1 }}>
            To Account
          </Typography>
          <ControlledBaseInput
            name="toAccountNumber"
            control={control}
            placeholder="Enter Account Number"
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#F8FAFC",
                borderRadius: "16px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "transparent",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#CBD5E1",
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
          {toAccountName && (
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#64748B", mt: 0.75, px: 0.5 }}>
              {toAccountName} | {currency}
            </Typography>
          )}
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
            placeholder="Pay good service"
            minRows={2}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#F8FAFC",
                borderRadius: "16px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "transparent",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#CBD5E1",
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
          <Typography sx={{ fontSize: 13, color: "#94A3B8", mt: 0.75, px: 0.5 }}>
            Shown on both account statements.
          </Typography>
        </Box>
      </Stack>
    </PreviewTransfer>
  );
}