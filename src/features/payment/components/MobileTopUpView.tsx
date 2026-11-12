"use client";

import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChevronDown, CreditCard, Phone, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";

import { palette } from "@/theme/palette";
import {
  PreviewTransfer,
  type TransferPreviewField,
  type TransferReviewRow,
} from "@/features/transfer";
import { useTransferAccounts } from "@/features/transfer/use-transfer-accounts";

export interface MobileTopUpViewProps {
  open?: boolean;
  onClose?: () => void;
  onBackToPayments?: () => void;
  onSaveTemplate?: (templateData: {
    name: string;
    type: "Mobile top-up";
    providerName: string;
    providerInitials: string;
    correspondentId: string;
  }) => void;
}

const QUICK_AMOUNTS = [1, 2, 5, 10, 20, 50] as const;

const FALLBACK_ACCOUNTS = [
  {
    id: "acc-1",
    name: "Operating account",
    number: "0012 3456 7890",
    balance: 32150.0,
    currency: "USD",
  },
  {
    id: "acc-2",
    name: "Payroll account",
    number: "0012 3456 7891",
    balance: 15400.0,
    currency: "USD",
  },
  {
    id: "acc-3",
    name: "Savings account",
    number: "0012 3456 7892",
    balance: 12500000,
    currency: "KHR",
  },
];

/** Detect network provider based on phone prefix */
function detectNetwork(phone: string): { name: string; tag: string } {
  const clean = phone.replace(/\D/g, "");
  if (!clean || clean.length < 3) return { name: "Smart", tag: "Smart · prepaid" };

  const prefix = clean.startsWith("0") ? clean.slice(0, 3) : `0${clean.slice(0, 2)}`;

  // Cellcard prefixes
  if (["012", "017", "061", "076", "077", "078", "079", "085", "089", "092", "095", "099"].includes(prefix)) {
    return { name: "Cellcard", tag: "Cellcard · prepaid" };
  }
  // Metfone prefixes
  if (["031", "060", "066", "067", "068", "071", "088", "090", "097"].includes(prefix)) {
    return { name: "Metfone", tag: "Metfone · prepaid" };
  }
  // Smart prefixes (default in Cambodia: 010, 011, 015, 016, 069, 070, 081, 086, 087, 093, 096, 098)
  return { name: "Smart", tag: "Smart · prepaid" };
}

export default function MobileTopUpView({
  open = true,
  onClose,
  onBackToPayments,
  onSaveTemplate,
}: MobileTopUpViewProps) {
  const router = useRouter();
  const { accounts: fetchedAccounts } = useTransferAccounts(open);

  const accounts = useMemo(() => {
    if (fetchedAccounts && fetchedAccounts.length > 0) {
      return fetchedAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        number: a.number,
        balance: a.balance,
        currency: a.currency,
      }));
    }
    return FALLBACK_ACCOUNTS;
  }, [fetchedAccounts]);

  // Form State
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id);
  const [mobileNumber, setMobileNumber] = useState("");
  const [amount, setAmount] = useState<number>(5);
  const [customAmountStr, setCustomAmountStr] = useState<string>("5.00");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("Sales team top-up");
  const [setSchedule, setSetSchedule] = useState(false);
  const [scheduleFreq, setScheduleFreq] = useState("Monthly");

  // Reference IDs
  const [referenceNo] = useState(() => `TOP2610${Math.floor(100000 + Math.random() * 900000)}`);
  const [transactionId] = useState(() => `#TOP-${Math.floor(10000000 + Math.random() * 90000000)}`);

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) ?? accounts[0] ?? FALLBACK_ACCOUNTS[0];
  }, [accounts, selectedAccountId]);

  const network = useMemo(() => detectNetwork(mobileNumber), [mobileNumber]);

  const handleSelectQuickAmount = (val: number) => {
    setAmount(val);
    setCustomAmountStr(val.toFixed(2));
  };

  const handleCustomAmountChange = (valStr: string) => {
    setCustomAmountStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (onBackToPayments) {
      onBackToPayments();
    } else {
      router.push("/payment");
    }
  };

  const handleReset = () => {
    setSelectedAccountId(accounts[0]?.id || FALLBACK_ACCOUNTS[0].id);
    setMobileNumber("011 222 2222");
    setAmount(5);
    setCustomAmountStr("5.00");
    setSaveAsTemplate(false);
    setTemplateName("Sales team top-up");
    setSetSchedule(false);
    setScheduleFreq("Monthly");
  };

  const handleReviewStep = () => {
    if (saveAsTemplate && onSaveTemplate) {
      onSaveTemplate({
        name: templateName.trim() || `${network.name} Top-up`,
        type: "Mobile top-up",
        providerName: network.tag,
        providerInitials: network.name.slice(0, 2).toUpperCase(),
        correspondentId: `Mobile no. ${mobileNumber.trim()}`,
      });
    }
  };

  const join = (...parts: Array<string | number | null | undefined>) =>
    parts.filter((p) => p !== null && p !== undefined && String(p).trim() !== "").join(" · ");

  const amountNum = Number(amount);
  const safeAmount = Number.isFinite(amountNum) ? amountNum : 0;

  const previewFields: TransferPreviewField[] = [
    {
      label: "From Account",
      value: join(selectedAccount?.name, selectedAccount?.number) || "-",
    },
    {
      label: "To Account",
      value: join(network?.tag, mobileNumber) || "-",
    },
    {
      label: "Amount",
      value: `USD ${safeAmount.toFixed(2)}`,
    },
    ...(setSchedule && scheduleFreq
      ? [{ label: "Schedule", value: `${scheduleFreq} auto-pay` }]
      : []),
    ...(saveAsTemplate && templateName.trim()
      ? [{ label: "Remark", value: templateName.trim() }]
      : []),
  ];

  const summaryRows: TransferReviewRow[] = [
    { label: "Amount Transferred", value: `USD ${amount.toFixed(2)}` },
    { label: "Transaction ID", value: transactionId },
    { label: "Reference no", value: referenceNo },
    { label: "Debit amount", value: `USD ${amount.toFixed(2)}` },
    { label: "Fee", value: "USD 0.00" },
    { label: "Operator", value: network.tag },
    { label: "Recipient Phone", value: mobileNumber },
  ];

  return (
    <PreviewTransfer
      open={open}
      onClose={handleClose}
      title="Mobile Top-Up"
      breadcrumbPrefix="Payment"
      breadcrumbSubPrefix="Mobile Top-up"
      fromAccount={{
        name: selectedAccount.name,
        accountNumber: selectedAccount.number,
      }}
      toAccount={{
        name: network.tag,
        accountNumber: mobileNumber,
      }}
      canSubmit={Boolean(mobileNumber.trim() && amount > 0)}
      previewFields={previewFields}
      summaryRows={summaryRows}
      successTitle="Top-up successful"
      successSubtitle="Mobile Top-Up Payment"
      successMessage={`USD ${amount.toFixed(2)} sent to ${mobileNumber} (${network.name}).`}
      makeAnotherTitle="Make another top-up"
      backButtonTitle="Back to Payments"
      receiptTitle="MOBILE TOP-UP RECEIPT"
      step0ActionPosition="inside"
      step0ButtonTitle="Review"
      onBackToMain={handleClose}
      onReview={handleReviewStep}
      onReset={handleReset}
    >
      {/* Step 0 Form Matching Design Mockup */}
      <Box>
        {/* Card Title */}
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 700,
            color: "#0F172A",
            mb: 3,
          }}
        >
          Payment details
        </Typography>

        <Stack spacing={2.75}>
          {/* 1. From account */}
          <Box>
            <Typography
              sx={{
                fontSize: 13.5,
                fontWeight: 600,
                color: palette.slate[700],
                mb: 1,
              }}
            >
              From account
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                IconComponent={ChevronDown}
                sx={{
                  borderRadius: "12px",
                  height: 48,
                  "& .MuiSelect-select": {
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "#0F172A",
                  },
                  "& fieldset": {
                    borderColor: palette.slate[200],
                  },
                }}
                startAdornment={
                  <InputAdornment position="start" sx={{ mr: 0.5 }}>
                    <CreditCard size={18} color="#64748B" />
                  </InputAdornment>
                }
              >
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id} sx={{ fontSize: 13.5 }}>
                    {`${acc.name} · ${acc.number} · ${acc.currency} ${Number(acc.balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 2. Mobile number */}
          <Box>
            <Typography
              sx={{
                fontSize: 13.5,
                fontWeight: 600,
                color: palette.slate[700],
                mb: 1,
              }}
            >
              Mobile number
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="011 222 2222"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone size={18} color={palette.slate[400]} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 48,
                  borderRadius: "12px",
                  bgcolor: "#F8FAFC",
                  borderColor: palette.slate[200],
                  fontSize: 14,
                  color: "#0F172A",
                },
              }}
            />
            <Typography
              sx={{
                fontSize: 12,
                color: palette.slate[500],
                mt: 0.75,
              }}
            >
              We add the leading 0 for you. Up to 10 digits.
            </Typography>

            {/* Detected Operator Pill Badge */}
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mt: 1.25 }}>
              <Box
                sx={{
                  bgcolor: "#F1F5F9",
                  border: `1px solid ${palette.slate[200]}`,
                  borderRadius: "6px",
                  px: 1.25,
                  py: 0.4,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <Smartphone size={13} color="#334155" />
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>
                  {network.tag}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: palette.slate[500] }}>
                Network detected from the number
              </Typography>
            </Stack>
          </Box>

          {/* 3. Choose an amount */}
          <Box>
            <Typography
              sx={{
                fontSize: 13.5,
                fontWeight: 600,
                color: palette.slate[700],
                mb: 1.25,
              }}
            >
              Choose an amount
            </Typography>

            {/* Quick Amount Pills */}
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 1.5 }}>
              {QUICK_AMOUNTS.map((amt) => {
                const isSelected = amount === amt;
                return (
                  <Box
                    key={amt}
                    component="button"
                    type="button"
                    onClick={() => handleSelectQuickAmount(amt)}
                    sx={{
                      minWidth: 46,
                      height: 36,
                      borderRadius: "8px",
                      border: isSelected ? "1px solid #2764A5" : `1px solid ${palette.slate[200]}`,
                      bgcolor: isSelected ? "#2764A5" : "#FFFFFF",
                      color: isSelected ? "#FFFFFF" : palette.slate[700],
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      px: 1.5,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: isSelected ? "#2764A5" : palette.slate[300],
                        bgcolor: isSelected ? "#1E5289" : palette.slate[50],
                      },
                    }}
                  >
                    ${amt}
                  </Box>
                );
              })}
            </Stack>

            {/* Custom Amount Input Field */}
            <TextField
              fullWidth
              size="small"
              value={customAmountStr}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 48,
                  borderRadius: "12px",
                  fontSize: 14,
                  color: "#0F172A",
                  bgcolor: "#F8FAFC",
                },
              }}
            />
            <Typography
              sx={{
                fontSize: 12,
                color: palette.slate[500],
                mt: 0.75,
              }}
            >
              Default currency is USD.
            </Typography>
          </Box>

          {/* 4. Save as template Toggle Row */}
          <Box
            sx={{
              bgcolor: "#F8FAFC",
              border: `1px solid ${palette.slate[100]}`,
              borderRadius: "12px",
              p: "14px 18px",
            }}
          >
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  Save as template
                </Typography>
                <Typography sx={{ fontSize: 12, color: palette.slate[500], mt: 0.25 }}>
                  Reuse these details next time
                </Typography>
              </Box>
              <Switch
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                color="primary"
              />
            </Stack>

            {saveAsTemplate && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${palette.slate[200]}` }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: palette.slate[700], mb: 0.5 }}>
                  Template name
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { height: 40, borderRadius: "8px", bgcolor: "#FFFFFF" } }}
                />
              </Box>
            )}
          </Box>

          {/* 5. Set schedule Toggle Row */}
          <Box
            sx={{
              bgcolor: "#F8FAFC",
              border: `1px solid ${palette.slate[100]}`,
              borderRadius: "12px",
              p: "14px 18px",
            }}
          >
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  Set schedule
                </Typography>
                <Typography sx={{ fontSize: 12, color: palette.slate[500], mt: 0.25 }}>
                  {setSchedule ? `On — ${scheduleFreq} auto-pay` : "Off — pay now"}
                </Typography>
              </Box>
              <Switch
                checked={setSchedule}
                onChange={(e) => setSetSchedule(e.target.checked)}
                color="primary"
              />
            </Stack>

            {setSchedule && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${palette.slate[200]}` }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: palette.slate[700], mb: 0.5 }}>
                  Top-up frequency
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={scheduleFreq}
                    onChange={(e) => setScheduleFreq(e.target.value)}
                    sx={{ borderRadius: "8px", height: 40, bgcolor: "#FFFFFF" }}
                  >
                    <MenuItem value="Weekly">Weekly</MenuItem>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Once">Once on specific date</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        </Stack>
      </Box>
    </PreviewTransfer>
  );
}
