"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Settings } from "lucide-react";

import { showToast } from "@core/components/AppToast";
import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import Typography from "@mui/material/Typography";
import { toToastError } from "@/utils/api-error";
import {
  useInquireExternalAccountMutation,
  useSubmitBakongWalletTransferMutation,
} from "../transfer.api";
import type { ExternalAccountInquiryResult } from "../transfer.types";
import {
  accountOptionLabel,
  accountSelectOptions,
  amountPreviewValue,
  formatMoney,
  parseTransferAmount,
  CURRENCY_OPTIONS,
  findAccount,
} from "../transfer.utils";
import { useTransferAccounts } from "../use-transfer-accounts";
import { useTransferQuote } from "../use-transfer-quote";
import PreviewTransfer, { type TransferPreviewField } from "./PreviewTransfer";
import { BaseAmountCurrencyField } from "@core/form";

export type BakongProps = {
  open: boolean;
  onClose: () => void;
};

const INITIAL_VALUES = {
  fromAccountId: "",
  bakongId: "",
  amount: "",
  currency: "USD",
  remark: "",
};

export default function Bakong({ open, onClose }: BakongProps) {
  const [values, setValues] = React.useState(INITIAL_VALUES);
  const { accounts } = useTransferAccounts(open);
  const [inquireExternalAccount, { isLoading: inquiring }] = useInquireExternalAccountMutation();
  const [submitBakongTransfer] = useSubmitBakongWalletTransferMutation();
  const quote = useTransferQuote();
  const [inquiry, setInquiry] = React.useState<{
    key: string;
    result: ExternalAccountInquiryResult;
  } | null>(null);
  const [inquiryRequestedFor, setInquiryRequestedFor] = React.useState<string | null>(null);

  const set = <K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === "bakongId") {
      setInquiry(null);
      setInquiryRequestedFor(null);
    }
  };

  const fromAccountId = values.fromAccountId || accounts[0]?.id || "";
  const fromAccount = findAccount(accounts, fromAccountId);
  const normalizedBakongId = values.bakongId.replace(/\s+/g, "");
  const inquiryKey = normalizedBakongId;
  const recipient = inquiry?.key === inquiryKey ? inquiry.result : null;
  const participantCode = recipient?.participantCode ?? recipient?.bankCode ?? "";
  const amount = parseTransferAmount(values.amount);
  const amountIsValid = !Number.isNaN(amount);

  React.useEffect(() => {
    let active = true;
    if (!open || normalizedBakongId.length < 6 || inquiryRequestedFor !== inquiryKey) {
      return () => {
        active = false;
      };
    }

    void inquireExternalAccount({
      accountNumber: normalizedBakongId,
      transferPlatform: "BAKONG",
      transferPlatformCode: "BAKONG",
      boundType: "LOCAL",
    })
      .unwrap()
      .then((result) => {
        if (!active) return;
        setInquiry({ key: inquiryKey, result });
        if (CURRENCY_OPTIONS.some((option) => option.value === result.currency)) {
          setValues((prev) => ({ ...prev, currency: result.currency }));
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setInquiryRequestedFor(null);
          showToast("error", toToastError(error, "Could not verify Bakong account"));
        }
      });

    return () => {
      active = false;
    };
  }, [open, normalizedBakongId, inquiryKey, inquiryRequestedFor, inquireExternalAccount]);

  const priceTransfer = () => {
    if (!fromAccount || !recipient || !amountIsValid) return;
    void quote.fetchQuote({
      transferType: "BAKONG_WALLET",
      fromAccountNumber: fromAccount.number,
      fromAccountCurrency: fromAccount.currency,
      toAccountNumber: normalizedBakongId,
      toAccountCurrency: recipient.currency,
      participantCode,
      amount,
      currency: values.currency,
    });
  };

  const submit = (idempotencyKey?: string) => {
    if (!fromAccount || !recipient || !participantCode || !amountIsValid) {
      throw new Error("Complete the Bakong recipient and transfer details before submitting");
    }
    return submitBakongTransfer({
      body: {
        fromAccountNumber: fromAccount.number,
        bakongId: normalizedBakongId,
        participantCode,
        amount,
        currency: values.currency,
        remark: values.remark.trim() || undefined,
      },
      idempotencyKey: idempotencyKey || crypto.randomUUID(),
    }).unwrap();
  };

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "Bakong ID / Phone", value: normalizedBakongId || "-" },
    { label: "Recipient Name", value: recipient?.accountName || "-" },
    { label: "Amount", value: amountPreviewValue(values.amount, values.currency) },
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
  ];

  const summaryRows = quote.quote
    ? [
        {
          label: "Amount Transferred",
          value: formatMoney(quote.quote.amount, quote.quote.currency),
        },
        { label: "Transaction ID", value: "-" },
        { label: "Reference no", value: "-" },
        {
          label: "Debit amount",
          value: formatMoney(quote.quote.totalAmount, quote.quote.originalCurrency),
        },
        {
          label: "Fee",
          value: formatMoney(quote.quote.feeAmount, quote.quote.feeCurrency),
        },
        ...(quote.quote.exchangeRate
          ? [{ label: "Exchange Rate", value: String(quote.quote.exchangeRate) }]
          : []),
        {
          label: "Credit Amount",
          value: formatMoney(quote.quote.receivedAmount, quote.quote.receivedCurrency),
        },
      ]
    : [
        { label: "Amount Transferred", value: "-" },
        { label: "Transaction ID", value: "-" },
        { label: "Reference no", value: "-" },
        { label: "Debit amount", value: "-" },
      ];

  return (
    <PreviewTransfer
      splitView
      open={open}
      onClose={onClose}
      title="To Bakong"
      icon={<Settings size={18} />}
      fromAccount={fromAccount ? { name: fromAccount.name, accountNumber: fromAccount.number, balance: fromAccount.balance, currency: fromAccount.currency } : undefined}
      toAccount={{
        name: recipient?.accountName || "Bakong Recipient",
        accountNumber: normalizedBakongId,
      }}
      canSubmit={Boolean(amountIsValid && recipient && participantCode && fromAccount)}
      previewFields={previewFields}
      summaryRows={summaryRows}
      summaryStatus={
        quote.status === "error" ? "error" : quote.status === "ready" ? "ready" : "loading"
      }
      onRetrySummary={quote.retry}
      onReview={priceTransfer}
      submit={submit}
      successMessage={`${formatMoney(amount, values.currency)} sent to ${recipient?.accountName || "the Bakong recipient"} via Bakong.`}
      onReset={() => {
        setValues(INITIAL_VALUES);
        setInquiry(null);
        setInquiryRequestedFor(null);
        quote.reset();
      }}
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
          onBlur={() => setInquiryRequestedFor(inquiryKey)}
          placeholder="e.g. 012 345 678"
        />
        <BaseInput
          label="Recipient Name"
          value={recipient?.accountName ?? ""}
          disabled={!recipient}
          placeholder={inquiring ? "Verifying account..." : "Verified name appears here"}
          helperText={
            recipient
              ? participantCode
                ? `Verified account · ${recipient.currency}`
                : "Bakong did not return a participant code for this account"
              : "Enter a Bakong ID or phone number to verify the recipient"
          }
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
