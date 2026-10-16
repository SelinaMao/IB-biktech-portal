"use client";

import React from "react";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Landmark } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import ControlledBaseAmountCurrencyField from "@core/form/ControlledBaseAmountCurrencyField";
import ControlledBaseInput from "@core/form/ControlledBaseInput";
import ControlledBaseSelect from "@core/form/ControlledBaseSelect";
import ControlledBaseTextArea from "@core/form/ControlledBaseTextArea";
import { useGetAccountDetailMutation } from "@/features/account";
import { palette } from "@/theme/palette";
import { otherSmeBankDirectory, scheduleFrequencies } from "../transfer.data";
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
import BaseFromAccount from "../../../@core/components/BaseFromAccount";
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
  fromAccountId: "",
  toAccountNumber: "",
  amountCurrency: { amount: "", currency: "USD" },
  remark: "",
  scheduleTransfer: false,
  frequency: scheduleFrequencies[0].value,
  scheduleDate: "",
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
    const clean = values.toAccountNumber.replace(/\s+/g, "");
    if (clean.length >= 6) {
      getAccountDetail({ accountNumber: clean }).unwrap().catch(() => {});
    }
  }, [values.toAccountNumber, getAccountDetail]);

  const fromAccount = findAccount(accounts, values.fromAccountId) || accounts[0];
  const toAccountName = accountDetail?.accountName || findOtherSmeBankAccountName(otherSmeBankDirectory, values.toAccountNumber);
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

        <Box>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 15, color: "#0F172A" }}>Schedule</Typography>
            <Controller
              name="scheduleTransfer"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  sx={{
                    width: 46,
                    height: 28,
                    p: 0,
                    "& .MuiSwitch-switchBase": {
                      p: 0,
                      m: "3px",
                      transitionDuration: "200ms",
                      "&.Mui-checked": {
                        transform: "translateX(18px)",
                        color: "#FFFFFF",
                        "& + .MuiSwitch-track": {
                          backgroundColor: "#2E937A",
                          opacity: 1,
                          border: 0,
                        },
                      },
                    },
                    "& .MuiSwitch-thumb": {
                      boxSizing: "border-box",
                      width: 22,
                      height: 22,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    },
                    "& .MuiSwitch-track": {
                      borderRadius: 14,
                      backgroundColor: "#CBD5E1",
                      opacity: 1,
                      transition: "background-color 200ms",
                    },
                  }}
                />
              )}
            />
          </Stack>
          {values.scheduleTransfer && (
            <Stack spacing={2} sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${palette.slate[200]}` }}>
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
            </Stack>
          )}
        </Box>

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