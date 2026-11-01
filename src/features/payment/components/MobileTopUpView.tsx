"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  Phone,
  RotateCcw,
  Smartphone,
} from "lucide-react";

import { palette } from "@/theme/palette";
import BaseButton from "@core/components/BaseButton";
import { showToast } from "@core/components/AppToast";

export interface MobileTopUpViewProps {
  onBackToPayments?: () => void;
  onSaveTemplate?: (templateData: {
    name: string;
    type: "Mobile top-up";
    providerName: string;
    providerInitials: string;
    correspondentId: string;
  }) => void;
}

const STEPS = ["New", "Review", "Transfer"] as const;

const QUICK_AMOUNTS = [1, 2, 5, 10, 20, 50] as const;

const TOPUP_ACCOUNTS = [
  {
    id: "acc-1",
    label: "Operating account · 0012 3456 7890 · USD 32,150.00",
    name: "Operating account",
    number: "0012 3456 7890",
    balance: "USD 32,150.00",
  },
  {
    id: "acc-2",
    label: "Payroll account · 0012 3456 7891 · USD 15,400.00",
    name: "Payroll account",
    number: "0012 3456 7891",
    balance: "USD 15,400.00",
  },
  {
    id: "acc-3",
    label: "Savings account · 0012 3456 7892 · KHR 12,500,000",
    name: "Savings account",
    number: "0012 3456 7892",
    balance: "KHR 12,500,000",
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
  onBackToPayments,
  onSaveTemplate,
}: MobileTopUpViewProps) {
  // Wizard Step: 0 = New, 1 = Review, 2 = Transfer (Success)
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0);

  // Form State
  const [selectedAccountId, setSelectedAccountId] = useState(TOPUP_ACCOUNTS[0].id);
  const [mobileNumber, setMobileNumber] = useState("011 222 2222");
  const [amount, setAmount] = useState<number>(5);
  const [customAmountStr, setCustomAmountStr] = useState<string>("5.00");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("Sales team top-up");
  const [setSchedule, setSetSchedule] = useState(false);
  const [scheduleFreq, setScheduleFreq] = useState("Monthly");

  // Receipt / Reference State
  const [referenceNo] = useState(() => `TOP2610${Math.floor(100000 + Math.random() * 900000)}`);
  const [completedTime] = useState(() =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date()),
  );

  const selectedAccount = useMemo(
    () => TOPUP_ACCOUNTS.find((a) => a.id === selectedAccountId) ?? TOPUP_ACCOUNTS[0],
    [selectedAccountId],
  );

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

  const handleConfirmTopUp = () => {
    if (saveAsTemplate && onSaveTemplate) {
      onSaveTemplate({
        name: templateName.trim() || `${network.name} Top-up`,
        type: "Mobile top-up",
        providerName: network.tag,
        providerInitials: network.name.slice(0, 2).toUpperCase(),
        correspondentId: `Mobile no. ${mobileNumber.trim()}`,
      });
    }

    setActiveStep(2);
    showToast("success", {
      title: "Top-up completed",
      message: `USD ${amount.toFixed(2)} sent to ${mobileNumber} (${network.name}).`,
    });
  };

  const handleDownloadReceipt = () => {
    const text = `MOBILE TOP-UP RECEIPT\n--------------------------------\nReference: ${referenceNo}\nDate: ${completedTime}\nFrom: ${selectedAccount.name} (${selectedAccount.number})\nMobile: ${mobileNumber}\nNetwork: ${network.tag}\nAmount: USD ${amount.toFixed(2)}\nFee: USD 0.00\nTotal Debited: USD ${amount.toFixed(2)}\nStatus: Completed\n--------------------------------\nBiKTECH Corporate Portal`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt-${referenceNo}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("success", { title: "Receipt downloaded", message: "Receipt saved successfully." });
  };

  return (
    <Box sx={{ width: "100%", pb: 6 }}>
      {/* Centered Page Title */}
      <Typography
        sx={{
          fontSize: { xs: 26, sm: 30 },
          fontWeight: 700,
          color: "#0F172A",
          textAlign: "center",
          lineHeight: 1.25,
          mb: 3,
        }}
      >
        Mobile Top-Up
      </Typography>

      {/* 3-Step Wizard Stepper (New, Review, Transfer) */}
      <Box
        sx={{
          width: { xs: "100%", sm: 460 },
          maxWidth: "100%",
          mx: "auto",
          mb: 4,
          px: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
          {STEPS.map((label, i) => {
            const isCurrent = i === activeStep;
            const isCompleted = i < activeStep;
            return (
              <Stack
                key={label}
                spacing={1}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  alignItems: "center",
                }}
              >
                {/* Stepper horizontal line */}
                <Box
                  sx={{
                    width: "100%",
                    height: 4,
                    borderRadius: "999px",
                    bgcolor: isCurrent || isCompleted ? "#2764A5" : "#E2E8F0",
                    transition: "background-color 0.25s ease",
                  }}
                />
                {/* Stepper label */}
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? "#0F172A" : isCompleted ? "#2764A5" : "#64748B",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Box>

      {/* Step 0: New Top-Up Form */}
      {activeStep === 0 && (
        <Box
          sx={{
            width: { xs: "100%", sm: 540 },
            maxWidth: "100%",
            mx: "auto",
            bgcolor: "#FFFFFF",
            border: `1px solid ${palette.slate[200]}`,
            borderRadius: "20px",
            p: { xs: 2.5, sm: "28px 32px" },
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
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
                    height: 46,
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
                  {TOPUP_ACCOUNTS.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id} sx={{ fontSize: 13.5 }}>
                      {acc.label}
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
                    height: 46,
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
                    height: 46,
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

            {/* 6. Review Button */}
            <Button
              variant="contained"
              fullWidth
              disabled={!mobileNumber.trim() || amount <= 0}
              onClick={() => setActiveStep(1)}
              endIcon={<ArrowRight size={18} />}
              sx={{
                height: 48,
                borderRadius: "10px",
                bgcolor: "#2764A5",
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "none",
                mt: 1,
                "&:hover": {
                  bgcolor: "#1E5289",
                  boxShadow: "none",
                },
              }}
            >
              Review
            </Button>
          </Stack>
        </Box>
      )}

      {/* Step 1: Review Top-Up Details */}
      {activeStep === 1 && (
        <Box
          sx={{
            width: { xs: "100%", sm: 540 },
            maxWidth: "100%",
            mx: "auto",
            bgcolor: "#FFFFFF",
            border: `1px solid ${palette.slate[200]}`,
            borderRadius: "20px",
            p: { xs: 2.5, sm: "28px 32px" },
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0F172A",
              mb: 0.5,
            }}
          >
            Review top-up details
          </Typography>
          <Typography sx={{ fontSize: 13, color: palette.slate[500], mb: 3 }}>
            Please confirm your mobile top-up information before proceeding.
          </Typography>

          <Stack spacing={2} sx={{ mb: 3.5 }}>
            <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: "12px", border: `1px solid ${palette.slate[100]}` }}>
              <Typography sx={{ fontSize: 12, color: palette.slate[500], fontWeight: 500 }}>
                From account
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", mt: 0.25 }}>
                {selectedAccount.name} ({selectedAccount.number})
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: "12px", border: `1px solid ${palette.slate[100]}` }}>
              <Typography sx={{ fontSize: 12, color: palette.slate[500], fontWeight: 500 }}>
                Recipient mobile number
              </Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mt: 0.25 }}>
                {mobileNumber}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#2764A5", fontWeight: 600, mt: 0.25 }}>
                {network.tag}
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: "12px", border: `1px solid ${palette.slate[100]}` }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: 13.5, color: palette.slate[500] }}>Top-up amount</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  USD {amount.toFixed(2)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: 13.5, color: palette.slate[500] }}>Fee</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#16A34A" }}>
                  USD 0.00
                </Typography>
              </Stack>
              {setSchedule && (
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: 13.5, color: palette.slate[500] }}>Schedule</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#2764A5" }}>
                    {scheduleFreq} auto-pay
                  </Typography>
                </Stack>
              )}
              <Box sx={{ pt: 1, borderTop: `1px solid ${palette.slate[200]}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                    Total debit
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                    USD {amount.toFixed(2)}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setActiveStep(0)}
              sx={{
                height: 48,
                borderRadius: "10px",
                borderColor: palette.slate[300],
                color: palette.slate[700],
                fontSize: 14,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  borderColor: palette.slate[400],
                  bgcolor: palette.slate[50],
                },
              }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleConfirmTopUp}
              sx={{
                height: 48,
                borderRadius: "10px",
                bgcolor: "#2764A5",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#1E5289",
                  boxShadow: "none",
                },
              }}
            >
              Confirm Top-Up
            </Button>
          </Stack>
        </Box>
      )}

      {/* Step 2: Transfer (Success Screen) */}
      {activeStep === 2 && (
        <Box
          sx={{
            width: { xs: "100%", sm: 540 },
            maxWidth: "100%",
            mx: "auto",
            bgcolor: "#FFFFFF",
            border: `1px solid ${palette.slate[200]}`,
            borderRadius: "20px",
            p: { xs: 3, sm: "36px 32px" },
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          {/* Success Icon */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "#DCFCE7",
              color: "#16A34A",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <CheckCircle2 size={36} strokeWidth={2.2} />
          </Box>

          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0F172A",
              mb: 0.75,
            }}
          >
            Top-Up Successful!
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              color: palette.slate[500],
              maxWidth: 420,
              mx: "auto",
              mb: 3,
            }}
          >
            Your top-up of <strong>USD {amount.toFixed(2)}</strong> to{" "}
            <strong>{mobileNumber}</strong> ({network.name}) has been processed successfully.
          </Typography>

          {/* Receipt Info Box */}
          <Box
            sx={{
              bgcolor: "#F8FAFC",
              borderRadius: "12px",
              border: `1px solid ${palette.slate[200]}`,
              p: 2.5,
              mb: 3.5,
              textAlign: "left",
            }}
          >
            <Stack spacing={1.25}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.slate[500] }}>Reference No</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                  {referenceNo}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.slate[500] }}>Completed On</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: "#0F172A" }}>
                  {completedTime}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: palette.slate[500] }}>Debited Account</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: "#0F172A" }}>
                  {selectedAccount.name}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack spacing={1.5}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleDownloadReceipt}
              startIcon={<Download size={18} />}
              sx={{
                height: 46,
                borderRadius: "10px",
                borderColor: palette.slate[300],
                color: palette.slate[700],
                fontSize: 14,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  borderColor: palette.slate[400],
                  bgcolor: palette.slate[50],
                },
              }}
            >
              Download Receipt
            </Button>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setActiveStep(0);
                }}
                startIcon={<RotateCcw size={16} />}
                sx={{
                  height: 46,
                  borderRadius: "10px",
                  borderColor: palette.slate[300],
                  color: palette.slate[700],
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: palette.slate[400],
                    bgcolor: palette.slate[50],
                  },
                }}
              >
                Top-Up Another
              </Button>

              <Button
                variant="contained"
                fullWidth
                onClick={onBackToPayments}
                sx={{
                  height: 46,
                  borderRadius: "10px",
                  bgcolor: "#2764A5",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#1E5289",
                    boxShadow: "none",
                  },
                }}
              >
                Back to Payments
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
