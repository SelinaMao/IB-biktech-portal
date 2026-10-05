"use client";

import React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { CirclePlus } from "lucide-react";

import BaseButton from "@core/components/BaseButton";
import BaseSideDialog from "@core/components/BaseSideDialog";
import BaseInput from "@core/form/BaseInput";
import BaseSelect from "@core/form/BaseSelect";
import BaseTextArea from "@core/form/BaseTextArea";
import { palette } from "@/theme/palette";

const STEPS = ["Details", "Review", "Success"];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "current", label: "Current / CASA Account" },
  { value: "savings", label: "Savings Account" },
  { value: "term-deposit", label: "Term Deposit" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "KHR", label: "៛ KHR" },
];

const BRANCH_OPTIONS = [
  { value: "phnom-penh-main", label: "Phnom Penh Main Branch" },
  { value: "siem-reap", label: "Siem Reap Branch" },
  { value: "sihanoukville", label: "Sihanoukville Branch" },
];

const INITIAL_VALUES = {
  accountType: "current",
  currency: "USD",
  branch: BRANCH_OPTIONS[0].value,
  initialDeposit: "",
  enableOdLimit: false,
  odLimitAmount: "",
  enableAmountBlock: false,
  amountBlockAmount: "",
  remark: "",
};

export type NewAccountDialogProps = {
  open: boolean;
  onClose: () => void;
};

/** "New Account" creation flow — Details -> Review -> Success, mirroring the
 *  transfer wizard's step shell on top of BaseSideDialog. */
export default function NewAccountDialog({ open, onClose }: NewAccountDialogProps) {
  const [step, setStep] = React.useState(0);
  const [values, setValues] = React.useState(INITIAL_VALUES);

  const set = <K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const accountTypeLabel =
    ACCOUNT_TYPE_OPTIONS.find((o) => o.value === values.accountType)?.label ?? "";
  const currencyLabel =
    CURRENCY_OPTIONS.find((o) => o.value === values.currency)?.label ?? values.currency;
  const branchLabel = BRANCH_OPTIONS.find((o) => o.value === values.branch)?.label ?? "";

  const isCasa = values.accountType === "current";

  const canSubmit = Boolean(
    values.accountType &&
      values.currency &&
      values.branch &&
      values.initialDeposit &&
      (!values.enableOdLimit || values.odLimitAmount) &&
      (!values.enableAmountBlock || values.amountBlockAmount),
  );

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(0);
      setValues(INITIAL_VALUES);
    }, 200);
  };

  const reviewRows = [
    { label: "Account Type", value: accountTypeLabel },
    { label: "Currency", value: currencyLabel },
    { label: "Branch", value: branchLabel },
    { label: "Initial Deposit", value: values.initialDeposit ? `${values.initialDeposit} ${values.currency}` : "-" },
    ...(values.enableOdLimit
      ? [{ label: "OD Limit", value: `${values.odLimitAmount} ${values.currency}` }]
      : []),
    ...(values.enableAmountBlock
      ? [{ label: "Amount Block", value: `${values.amountBlockAmount} ${values.currency}` }]
      : []),
    ...(values.remark ? [{ label: "Remark", value: values.remark }] : []),
  ];

  return (
    <BaseSideDialog
      open={open}
      onClose={handleClose}
      title="New Account"
      icon={<CirclePlus size={18} />}
      steps={STEPS}
      activeStep={step}
      footer={
        step === 0 ? (
          <BaseButton
            title="Next"
            variant="contained"
            fullWidth
            disabled={!canSubmit}
            onClick={() => setStep(1)}
          />
        ) : step === 1 ? (
          <Stack direction="row" spacing={1.5}>
            <BaseButton
              title="Back"
              variant="outlined"
              fullWidth
              onClick={() => setStep(0)}
              sx={{
                backgroundColor: "#DFDFDE",
                borderColor: "#DFDFDE",
                color: palette.text.primary,
                "&:hover": {
                  backgroundColor: "#DFDFDE",
                  borderColor: "#DFDFDE",
                },
              }}
            />
            <BaseButton title="Submit" variant="contained" fullWidth onClick={() => setStep(2)} />
          </Stack>
        ) : (
          <BaseButton title="Done" variant="contained" fullWidth onClick={handleClose} />
        )
      }
    >
      {step === 0 && (
        <Stack spacing={2.5}>
          <BaseSelect
            label="Account Type"
            value={values.accountType}
            onChange={(e) => set("accountType", e.target.value as string)}
            options={ACCOUNT_TYPE_OPTIONS}
          />

          {isCasa && (
            <Alert severity="warning" icon={false} sx={{ bgcolor: palette.warning.bg, color: palette.warning[900] }}>
              For customers who have an approved OD Limit and Amount Block — applies to
              Current / CASA accounts only.
            </Alert>
          )}

          <Stack direction="row" spacing={1.5}>
            <Box sx={{ flex: 1 }}>
              <BaseSelect
                label="Currency"
                value={values.currency}
                onChange={(e) => set("currency", e.target.value as string)}
                options={CURRENCY_OPTIONS}
              />
            </Box>
            <Box sx={{ flex: 2 }}>
              <BaseSelect
                label="Branch"
                value={values.branch}
                onChange={(e) => set("branch", e.target.value as string)}
                options={BRANCH_OPTIONS}
              />
            </Box>
          </Stack>

          <BaseInput
            label="Initial Deposit"
            value={values.initialDeposit}
            onChange={(e) => set("initialDeposit", e.target.value)}
            placeholder="0.00"
          />

          {isCasa && (
            <>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Enable OD Limit</Typography>
                <Switch
                  checked={values.enableOdLimit}
                  onChange={(e) => set("enableOdLimit", e.target.checked)}
                />
              </Stack>
              {values.enableOdLimit && (
                <BaseInput
                  label="OD Limit Amount"
                  value={values.odLimitAmount}
                  onChange={(e) => set("odLimitAmount", e.target.value)}
                  placeholder="0.00"
                />
              )}

              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Enable Amount Block</Typography>
                <Switch
                  checked={values.enableAmountBlock}
                  onChange={(e) => set("enableAmountBlock", e.target.checked)}
                />
              </Stack>
              {values.enableAmountBlock && (
                <BaseInput
                  label="Amount Block Amount"
                  value={values.amountBlockAmount}
                  onChange={(e) => set("amountBlockAmount", e.target.value)}
                  placeholder="0.00"
                />
              )}
            </>
          )}

          <BaseTextArea
            label="Remark"
            value={values.remark}
            onChange={(e) => set("remark", e.target.value)}
            placeholder="Optional note"
          />
        </Stack>
      )}

      {step === 1 && (
        <Stack spacing={0.5}>
          {reviewRows.map((row) => (
            <Stack
              key={row.label}
              direction="row"
              sx={{
                justifyContent: "space-between",
                py: 1.5,
                borderBottom: `1px solid ${palette.slate[100]}`,
              }}
            >
              <Typography variant="body2" sx={{ color: palette.slate[400] }}>
                {row.label}
              </Typography>
              <Typography sx={{ fontWeight: 600, fontSize: 14, textAlign: "right" }}>
                {row.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      {step === 2 && (
        <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", py: 3 }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 40, color: palette.success.main }} />
          <Typography variant="h6">Request submitted</Typography>
          <Typography variant="body2" sx={{ color: palette.slate[400] }}>
            The new {accountTypeLabel.toLowerCase()} request for {branchLabel} has been queued
            for dual-control approval. You&apos;ll be notified once it&apos;s processed.
          </Typography>
        </Stack>
      )}
    </BaseSideDialog>
  );
}
