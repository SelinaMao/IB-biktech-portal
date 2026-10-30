"use client";

import { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { palette, radius } from "@/theme/palette";
import BaseDialog from "@core/components/BaseDialog";
import { showToast } from "@core/components/AppToast";
import { MOCK_PAYMENT_ACCOUNTS } from "../payment.data";
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
  const [selectedAccountId, setSelectedAccountId] = useState(MOCK_PAYMENT_ACCOUNTS[0].id);
  const [consumerId, setConsumerId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (template) {
      setConsumerId(template.correspondentId.replace(/^(Consumer ID|Mobile no\.|Organisation ID)\s*/, ""));
    } else if (provider) {
      setConsumerId("");
    }
    setAmount("");
    setNote("");
  }, [template, provider, open]);

  const targetTitle = template ? template.name : provider?.name ?? "Payment";
  const targetInitials = template ? template.providerInitials : provider?.initials ?? "BP";
  const targetSubtitle = template
    ? `${template.type} · ${template.providerName}`
    : provider?.category ?? "Bill Payment";

  const selectedAccount = MOCK_PAYMENT_ACCOUNTS.find((acc) => acc.id === selectedAccountId);

  const handleSubmit = () => {
    if (!consumerId.trim() || !amount.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast("success", {
        title: "Payment successful",
        message: `Paid $${amount} to ${targetTitle}`,
      });
      onClose();
    }, 700);
  };

  const isValid = Boolean(consumerId.trim() && amount.trim() && !isNaN(Number(amount)) && Number(amount) > 0);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Make payment"
      subtitle="Complete your payment transaction"
      confirmTitle="Pay now"
      onConfirm={handleSubmit}
      confirmDisabled={!isValid}
      isLoading={isSubmitting}
      cancelTitle="Cancel"
      maxWidth="sm"
    >
      <Stack spacing={2.5} sx={{ mt: 1 }}>
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
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              sx={{ borderRadius: `${radius.md}px` }}
            >
              {MOCK_PAYMENT_ACCOUNTS.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.name} — {acc.accountNumber} ({acc.currency} {acc.balance})
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
            onChange={(e) => setConsumerId(e.target.value)}
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
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
            onChange={(e) => setNote(e.target.value)}
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
