"use client";

import { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { palette, radius } from "@/theme/palette";
import BaseDialog from "@core/components/BaseDialog";
import { showToast } from "@core/components/AppToast";
import { useTransferAccounts } from "@/features/transfer/use-transfer-accounts";
import { useTransferAuthorization } from "@/features/transfer/use-transfer-authorization";
import { AuthenticatorDialog } from "@/features/authenticator";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { BILL_PROVIDERS } from "../payment.data";
import { useSubmitBillPaymentMutation } from "../payment.api";
import { savePaymentTemplate } from "../payment.templates";
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
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [submitBillPayment, { isLoading: isSubmitting }] = useSubmitBillPaymentMutation();

  useEffect(() => {
    if (!open) return;
    if (template) {
      setConsumerId(template.correspondentId.replace(/^(Consumer ID|Mobile no\.|Organisation ID)\s*/, ""));
      if (template.providerId) {
        setSelectedBillProviderId(template.providerId);
      } else {
        const found = BILL_PROVIDERS.find(
          (item) => item.name.toLowerCase() === template.providerName.trim().toLowerCase(),
        );
        if (found) setSelectedBillProviderId(found.providerId);
      }
    } else if (provider) {
      setSelectedBillProviderId(provider.providerId);
      setConsumerId(provider.sampleConsumerId);
    }
    setAmount("");
    setNote("");
    setSaveAsTemplate(false);
    setTemplateName(template?.name ?? provider?.name ?? "Bill payment");
  }, [template, provider, open]);

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
    BILL_PROVIDERS.find((item) => item.providerId === selectedBillProviderId) ??
    BILL_PROVIDERS[0];
  const targetSubtitle = template
    ? `${template.type} · ${billProvider?.name ?? template.providerName}`
    : provider?.category ?? "Bill Payment";
  const authorization = useTransferAuthorization({
    submit: (idempotencyKey) => submitBillPayment({
      body: {
        fromAccountNumber: selectedAccount?.number ?? "",
        providerId: billProvider?.providerId ?? "",
        amount: Number(amount),
        currency: selectedAccount?.currency ?? "",
        remark: note.trim() || undefined,
        isSaveTemplate: saveAsTemplate,
        templateName: saveAsTemplate ? templateName.trim() || targetTitle : undefined,
      },
      idempotencyKey,
    }).unwrap(),
    onCompleted: (result) => {
      if (saveAsTemplate) {
        savePaymentTemplate({
          name: templateName.trim() || targetTitle,
          type: "Bill payment",
          providerName: billProvider?.name ?? "Bill payment",
          providerId: billProvider?.providerId,
          providerInitials: targetInitials,
          correspondentId: consumerId.trim(),
        });
      }
      if (result.status === "AWAITING_APPROVAL") {
        showToast("success", {
          title: "Bill payment submitted for approval",
          message: `A checker must approve this request before payment is processed. Reference: ${result.referenceId}`,
        });
      } else {
        showToast("success", {
          title: "Bill payment authorized",
          message: `The payment service returned ${result.status}. Reference: ${result.referenceId}`,
        });
      }
      handleClose();
    },
  });

  const activeAccountId = accounts.some((account) => account.id === selectedAccountId)
    ? selectedAccountId
    : accounts[0]?.id ?? "";
  const selectedAccount = accounts.find((account) => account.id === activeAccountId);

  const handleClose = () => {
    authorization.discard();
    onClose();
  };

  const handleSubmit = async () => {
    const parsedAmount = Number(amount);
    if (!selectedAccount || !consumerId.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    if (saveAsTemplate) {
      savePaymentTemplate({
        name: templateName.trim() || targetTitle,
        type: "Bill payment",
        providerName: billProvider?.name ?? "Bill payment",
        providerId: billProvider?.providerId,
        providerInitials: targetInitials,
        correspondentId: consumerId.trim(),
      });
    }

    await authorization.start();
  };

  const isValid = Boolean(
    canInitiateBill &&
      selectedAccount &&
      consumerId.trim() &&
      amount.trim() &&
      Number.isFinite(Number(amount)) &&
      Number(amount) > 0,
  );

  return (
    <>
      <BaseDialog
        open={open}
        onClose={handleClose}
        title="Make payment"
        subtitle="Authorize this bill payment on your phone. Checker approval may follow."
        confirmTitle={authorization.pending ? "Show authorization QR" : "Continue to authorization"}
        onConfirm={handleSubmit}
        confirmDisabled={!isValid || isSubmitting || authorization.submitting}
        isLoading={isSubmitting || authorization.submitting}
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
                authorization.discard();
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
              authorization.discard();
              setConsumerId(e.target.value);
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${radius.md}px`,
              },
            }}
          />
        </Box>

        {/* Amount */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.slate[700], mb: 0.75 }}>
            Amount ({selectedAccount?.currency ?? "USD"})
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d*\.?\d*$/.test(val)) {
                authorization.discard();
                setAmount(val);
              }
            }}
            slotProps={{
              htmlInput: {
                inputMode: "decimal",
              },
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
              authorization.discard();
              setNote(e.target.value);
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${radius.md}px`,
              },
            }}
          />
        </Box>
        <Box>
          <FormControlLabel
            control={<Switch checked={saveAsTemplate} onChange={(event) => setSaveAsTemplate(event.target.checked)} />}
            label="Save receiving account as a template"
          />
          {saveAsTemplate && (
            <TextField
              fullWidth
              size="small"
              label="Template name"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              inputProps={{ maxLength: 50 }}
              sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: `${radius.md}px` } }}
            />
          )}
        </Box>
        </Stack>
      </BaseDialog>
      <AuthenticatorDialog
        key={authorization.pending?.referenceId ?? "none"}
        open={authorization.qrOpen}
        authenticator={authorization.pending?.authenticator ?? null}
        subject="bill payment"
        waitForConsumption
        onConsumed={(_requestId, result) => authorization.done(result)}
        onRenew={authorization.renew}
        onClose={authorization.closeQr}
      />
    </>
  );
}
