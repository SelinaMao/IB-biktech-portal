"use client";

import { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { palette, radius } from "@/theme/palette";
import BaseDialog from "@core/components/BaseDialog";
import { showToast } from "@core/components/AppToast";
import { useTransferAccounts } from "@/features/transfer/use-transfer-accounts";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { useIdempotencyKey } from "@/features/transfer/use-idempotency-key";
import { toToastError } from "@/utils/api-error";
import { BILL_PROVIDERS } from "../payment.data";
import { useInquireBillMutation, useSubmitBillPaymentMutation } from "../payment.api";
import type { BillProvider, PaymentTemplate } from "../payment.types";

export interface PayBillDialogProps {
  open: boolean;
  onClose: () => void;
  template?: PaymentTemplate | null;
  provider?: BillProvider | null;
}

export default function PayBillDialog({
  open,
  onClose,
  template,
  provider,
}: PayBillDialogProps) {
  const { accounts, loading: loadingAccounts } = useTransferAccounts(open);
  const canInitiateBill = useCan(CLIENT_PERMISSIONS.PAYMENT.BILL_CREATE);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedBillProviderId, setSelectedBillProviderId] = useState(() => {
    if (provider) return provider.providerId;
    return BILL_PROVIDERS.find(
      (item) =>
        item.providerId === template?.providerId ||
        item.name.toLowerCase() === template?.providerName.trim().toLowerCase(),
    )?.providerId ?? "";
  });
  const [consumerId, setConsumerId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [verifiedBillKey, setVerifiedBillKey] = useState("");
  const [inquiryError, setInquiryError] = useState<{
    billKey: string;
    title: string;
    message: string;
    referenceCode?: string;
  } | null>(null);
  const [inquireBill, { isLoading: isInquiring }] = useInquireBillMutation();
  const [submitBillPayment, { isLoading: isSubmitting }] = useSubmitBillPaymentMutation();
  const { ensure: ensureIdempotencyKey, reset: resetIdempotencyKey } = useIdempotencyKey();

  useEffect(() => {
    resetIdempotencyKey();
    if (template) {
      setConsumerId(template.correspondentId.replace(/^(Consumer ID|Mobile no\.|Organisation ID)\s*/, ""));
    } else if (provider) {
      setConsumerId(provider.sampleConsumerId);
    }
    setAmount("");
    setNote("");
  }, [template, provider, open, resetIdempotencyKey]);

  const targetTitle = template ? template.name : provider?.name ?? "Payment";
  const targetInitials = template ? template.providerInitials : provider?.initials ?? "BP";
  const mappedTemplateProvider = BILL_PROVIDERS.find(
    (item) =>
      item.providerId === template?.providerId ||
      item.name.toLowerCase() === template?.providerName.trim().toLowerCase(),
  );
  const billProvider =
    provider ??
    mappedTemplateProvider ??
    BILL_PROVIDERS.find((item) => item.providerId === selectedBillProviderId);
  const targetSubtitle = template
    ? `${template.type} · ${billProvider?.name ?? template.providerName}`
    : provider?.category ?? "Bill Payment";
  const billKey = billProvider && consumerId.trim()
    ? `${billProvider.providerId}:${consumerId.trim()}`
    : "";
  const billInquired = Boolean(billKey && verifiedBillKey === billKey);

  const activeAccountId = accounts.some((account) => account.id === selectedAccountId)
    ? selectedAccountId
    : accounts[0]?.id ?? "";
  const selectedAccount = accounts.find((account) => account.id === activeAccountId);

  const handleInquiry = async () => {
    if (!billProvider?.paymentSupported || !consumerId.trim()) return;

    try {
      await inquireBill({
        providerId: billProvider.providerId,
        customerNumber: consumerId.trim(),
      }).unwrap();
      setVerifiedBillKey(billKey);
      setInquiryError(null);
    } catch (error) {
      setVerifiedBillKey("");
      const errorDetails = toToastError(error, "Could not verify bill details");
      setInquiryError({
        billKey,
        title: errorDetails.title,
        message: errorDetails.message ?? "Please check the bill details and try again.",
        referenceCode: errorDetails.referenceCode,
      });
    }
  };

  const handleClose = () => {
    setVerifiedBillKey("");
    resetIdempotencyKey();
    onClose();
  };

  const handleSubmit = async () => {
    const parsedAmount = Number(amount);
    if (!selectedAccount || !billProvider?.paymentSupported || !consumerId.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    try {
      const result = await submitBillPayment({
        body: {
          fromAccountNumber: selectedAccount.number,
          providerId: billProvider.providerId,
          customerNumber: consumerId.trim(),
          amount: parsedAmount,
          currency: selectedAccount.currency,
          remark: note.trim() || undefined,
        },
        idempotencyKey: ensureIdempotencyKey(),
      }).unwrap();
      resetIdempotencyKey();

      if (result.status !== "AWAITING_APPROVAL") {
        showToast("warning", {
          title: "Bill payment status needs review",
          message: `The server returned ${result.status}. No payment-completed confirmation was shown. Reference: ${result.referenceId}`,
        });
        return;
      }

      showToast("success", {
        title: "Bill payment submitted for approval",
        message: `A checker must approve this request before payment is processed. Reference: ${result.referenceId}`,
      });
      handleClose();
    } catch (error) {
      showToast("error", toToastError(error, "Bill payment was not submitted"));
    }
  };

  const isValid = Boolean(
    canInitiateBill &&
    billProvider?.paymentSupported &&
      selectedAccount &&
      consumerId.trim() &&
      amount.trim() &&
      Number.isFinite(Number(amount)) &&
      Number(amount) > 0,
  );

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title="Make payment"
      subtitle="Submit this bill payment for checker approval"
      confirmTitle="Submit for approval"
      onConfirm={handleSubmit}
      confirmDisabled={!isValid}
      isLoading={isSubmitting}
      cancelTitle="Cancel"
      maxWidth="sm"
    >
      <Stack spacing={2.5} sx={{ mt: 1 }}>
        {!canInitiateBill && (
          <Alert severity="warning">
            You do not have permission to initiate bill payments.
          </Alert>
        )}
        {template?.type === "Bill payment" && !mappedTemplateProvider && !provider && (
          <>
            <Alert severity="warning">
              This saved template is not linked to a CBS bill provider. Select the correct provider to continue.
            </Alert>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.slate[700], mb: 0.75 }}>
                Bill provider
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  value={selectedBillProviderId}
                  onChange={(event) => {
                    setSelectedBillProviderId(event.target.value);
                    setVerifiedBillKey("");
                    setInquiryError(null);
                  }}
                  sx={{ borderRadius: `${radius.md}px` }}
                >
                  <MenuItem value="" disabled>Select the correct bill provider</MenuItem>
                  {BILL_PROVIDERS.filter((item) => item.paymentSupported).map((item) => (
                    <MenuItem key={item.providerId} value={item.providerId}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </>
        )}
        {template?.type === "Bill payment" && !billProvider && (
          <Alert severity="error">
            Select a bill provider before submitting this payment.
          </Alert>
        )}
        {/* Recipient summary card */}
        <Box
          sx={{
            p: 2,
            bgcolor: palette.slate[50],
            border: `1px solid ${palette.slate[200]}`,
            borderRadius: `${radius.lg}px`,
          }}
        >
          <Stack direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: "#E2E8F0",
                color: palette.slate[900],
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {targetInitials}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 15, color: palette.slate[900] }}>
                {targetTitle}
              </Typography>
              <Typography sx={{ fontSize: 13, color: palette.slate[500], mt: 0.25 }}>
                {targetSubtitle}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Source Account */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.slate[700], mb: 0.75 }}>
            Pay from account
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={activeAccountId}
              onChange={(e) => {
                resetIdempotencyKey();
                setSelectedAccountId(e.target.value);
              }}
              disabled={loadingAccounts || accounts.length === 0}
              sx={{ borderRadius: `${radius.md}px` }}
            >
              {accounts.length === 0 && (
                <MenuItem value="" disabled>
                  {loadingAccounts ? "Loading accounts..." : "No available accounts"}
                </MenuItem>
              )}
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.name} — {acc.number} ({acc.currency} {acc.balance})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Customer / Correspondent ID */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.slate[700], mb: 0.75 }}>
            Customer / Consumer ID
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter consumer or account number"
            value={consumerId}
            onChange={(e) => {
              resetIdempotencyKey();
              setVerifiedBillKey("");
              setInquiryError(null);
              setConsumerId(e.target.value);
            }}
            onBlur={() => {
              if (!billInquired && !isInquiring) void handleInquiry();
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${radius.md}px`,
              },
            }}
          />
          {isInquiring && (
            <Typography variant="caption" color="text.secondary">
              Checking bill details...
            </Typography>
          )}
        </Box>
        {billInquired && (
          <Alert severity="success">
            Bill details verified.
          </Alert>
        )}
        {/* Amount */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.slate[700], mb: 0.75 }}>
            Amount ({selectedAccount?.currency ?? "USD"})
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="0.00"
            type="number"
            value={amount}
            onChange={(e) => {
              resetIdempotencyKey();
              setAmount(e.target.value);
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${radius.md}px`,
              },
            }}
          />
        </Box>

        {/* Note */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.slate[700], mb: 0.75 }}>
            Payment note (optional)
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. Monthly bill settlement"
            value={note}
            onChange={(e) => {
              resetIdempotencyKey();
              setNote(e.target.value);
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${radius.md}px`,
              },
            }}
          />
        </Box>
      </Stack>
    </BaseDialog>
  );
}
