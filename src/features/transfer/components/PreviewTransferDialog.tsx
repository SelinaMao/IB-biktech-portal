"use client";

import React from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { Inbox, Smartphone } from "lucide-react";

import BaseButton from "@core/components/BaseButton";
import BaseCard from "@core/components/BaseCard";
import BaseSideDialog from "@core/components/BaseSideDialog";
import BaseTermsLabel from "@core/components/BaseTermsLabel";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import { font, palette, radius } from "@/theme/palette";
import { AuthenticatorDialog } from "@/features/authenticator";
import type { TransferResult } from "../transfer.types";
import { useTransferAuthorization } from "../use-transfer-authorization";

const STEPS = ["New", "Review", "Submit"];

export type TransferReviewRow = { label: string; value: string };

/** One bordered box on the Review step (From Account, Amount, Remark, ...). */
export type TransferPreviewField = { label: string; value: React.ReactNode };

export type PreviewTransferDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  /** Enables the Details -> Review "Next" button. */
  canSubmit: boolean;
  /** Bordered boxes shown at the top of the Review step (From/To Account, Amount, Remark, ...). */
  previewFields: TransferPreviewField[];
  /** Label/value rows shown in the "Summary" card (Amount, Fee, Exchange Rate, Debit Amount). */
  summaryRows?: TransferReviewRow[];
  /**
   * "loading" shows the Summary's values as placeholders, "error" offers `onRetrySummary`;
   * either one holds Review's Next until the Summary is ready.
   */
  summaryStatus?: "loading" | "error" | "ready";
  onRetrySummary?: () => void;
  /** Message shown on the Success step. */
  successMessage: string;
  /** The Details-step form. */
  children: React.ReactNode;
  /** Clears the caller's form state — fired once the close transition finishes. */
  onReset: () => void;
  /** Fired on Details -> Review, e.g. to price the transfer. */
  onReview?: () => void;
  /**
   * Submits the transfer for real. When given, Review's Next submits it and the linked phone
   * authorizes it by QR; without it the mocked QR step is shown.
   */
  submit?: () => Promise<TransferResult>;
};

/**
 * Shared 3-step (Details -> Review -> Success) shell for transfer flows, built
 * on BaseSideDialog. Each transfer type only supplies its own Details fields
 * plus a mapping to review rows / success copy — the step machine, stepper
 * header, and footer buttons live here so a flow change doesn't need editing
 * in every transfer type's dialog.
 */
export default function PreviewTransferDialog({
  open,
  onClose,
  title,
  icon,
  canSubmit,
  previewFields,
  summaryRows,
  summaryStatus = "ready",
  onRetrySummary,
  successMessage,
  children,
  onReset,
  onReview,
  submit,
}: PreviewTransferDialogProps) {
  const [step, setStep] = React.useState(0);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  // What the transfer came to once the phone authorized it
  const [result, setResult] = React.useState<TransferResult | null>(null);

  const authorization = useTransferAuthorization({
    submit,
    onCompleted: (completed) => {
      setResult(completed);
      setStep(2);
    },
  });

  const handleClose = () => {
    onClose();
    // Wait out the drawer's close transition before wiping the form.
    setTimeout(() => {
      setStep(0);
      setConfirmOpen(false);
      setTermsAccepted(false);
      authorization.discard();
      setResult(null);
      onReset();
    }, 200);
  };

  const goToReview = () => {
    setStep(1);
    onReview?.();
  };

  // Editing the form discards a submitted-but-unauthorized transfer; Next submits a fresh one
  const backToDetails = () => {
    authorization.discard();
    setStep(0);
  };

  const handleReviewNext = () => {
    if (submit) void authorization.start();
    else setConfirmOpen(true);
  };

  // The QR dialog is the mocked mobile-approval step — closing it is the
  // "approved" signal, so it's what advances Review -> Success.
  const handleConfirmed = () => {
    setConfirmOpen(false);
    setStep(2);
  };

  const summaryReady = summaryStatus === "ready";

  return (
    <>
      <BaseSideDialog
        open={open}
        onClose={handleClose}
        title={title}
        icon={icon}
        steps={STEPS}
        activeStep={step}
        footer={
          step === 0 ? (
            <BaseButton
              title="Next"
              variant="contained"
              fullWidth
              disabled={!canSubmit}
              onClick={goToReview}
            />
          ) : step === 1 ? (
            <Stack direction="row" spacing={1.5}>
              <BaseButton
                title="Back"
                variant="outlined"
                fullWidth
                disabled={authorization.submitting}
                onClick={backToDetails}
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
              <BaseButton
                title={authorization.submitting ? "Submitting…" : "Next"}
                variant="contained"
                fullWidth
                disabled={!termsAccepted || !summaryReady}
                isLoading={authorization.submitting}
                onClick={handleReviewNext}
              />
            </Stack>
          ) : (
            <BaseButton title="Done" variant="contained" fullWidth onClick={handleClose} />
          )
        }
      >
        {step === 0 && children}

        {step === 1 && (
          <Stack spacing={2.5}>
            <Stack spacing={5}>
              {previewFields.map((field) => (
                <PreviewBox key={field.label} label={field.label} value={field.value} />
              ))}
            </Stack>

            {summaryRows && summaryRows.length > 0 && (
              <Box py={2}>
                <Typography sx={{ fontSize: font.size.base, mb: 1 }}>
                  Summary
                </Typography>
                <BaseCard
                  aria-busy={summaryStatus === "loading"}
                  sx={{
                    bgcolor: palette.slate[50],
                    boxShadow: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {summaryRows.map((row) => (
                    <SummaryRow
                      key={row.label}
                      label={row.label}
                      value={row.value}
                      loading={summaryStatus === "loading"}
                    />
                  ))}
                  {summaryStatus === "error" && (
                    <Stack
                      direction="row"
                      sx={{ alignItems: "center", justifyContent: "space-between", gap: 3, pt: 1 }}
                    >
                      <Typography sx={{ fontSize: font.size.sm, color: palette.danger[500] }}>
                        The fee and exchange rate could not be calculated.
                      </Typography>
                      {onRetrySummary && (
                        <Link
                          component="button"
                          type="button"
                          onClick={onRetrySummary}
                          sx={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, flexShrink: 0 }}
                        >
                          Try again
                        </Link>
                      )}
                    </Stack>
                  )}
                </BaseCard>
              </Box>
            )}

            <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                sx={{ p: 0, mt: "2px" }}
              />
              <BaseTermsLabel
                text="I've read and agreed to the"
                sx={{ color: palette.slate[500] }}
                linkSx={{ color: palette.primary.dark, fontWeight: 600 }}
              />
            </Stack>
          </Stack>
        )}

        {step === 2 && (
          <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", py: 3 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 40, color: palette.success.main }} />
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: palette.slate[500] }}>
              Success
            </Typography>

            <Stack
              direction="row"
              sx={{ alignItems: "center", justifyContent: "center", width: "100%", py: 1 }}
            >
              <IconChip icon={<Smartphone size={22} />} />
              <Box
                sx={{
                  flex: 1,
                  maxWidth: 72,
                  borderTop: `2px dashed ${palette.slate[300]}`,
                  mx: 1.5,
                }}
              />
              <IconChip icon={<Inbox size={22} />} />
            </Stack>

            <Typography variant="h6">{outcomeTitle(result)}</Typography>
            <Typography variant="body2" sx={{ color: palette.slate[400] }}>
              {outcomeMessage(result)}
            </Typography>
            <Typography variant="caption" sx={{ color: palette.slate[400] }}>
              {successMessage}
              {result ? ` Reference ${result.referenceId}.` : ""}
            </Typography>
          </Stack>
        )}
      </BaseSideDialog>

      <QrConfirmationDialog open={confirmOpen} onApprove={handleConfirmed} />
      <AuthenticatorDialog
        key={authorization.pending?.referenceId ?? "none"}
        open={authorization.qrOpen}
        authenticator={authorization.pending?.authenticator ?? null}
        subject="transfer"
        onAuthorized={authorization.authorize}
        onRenew={authorization.renew}
        onClose={authorization.closeQr}
      />
    </>
  );
}

// The Success step's wording follows where the transfer actually got to
function outcomeTitle(result: TransferResult | null) {
  switch (result?.status) {
    case "AWAITING_APPROVAL":
      return "Authorized and waiting for approval";
    case "COMPLETED":
      return "Transfer completed";
    default:
      return "Authorized and pending to be processed";
  }
}

function outcomeMessage(result: TransferResult | null) {
  switch (result?.status) {
    case "AWAITING_APPROVAL":
      return "Your approvers have been asked to sign this transfer off. It moves once they approve it.";
    case "COMPLETED":
      return "The money has moved between your accounts.";
    default:
      return "This instruction has been successfully authorized and put in a queue for processing. The status of processing will be emailed to you.";
  }
}

function IconChip({ icon }: { icon: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: `${radius.lg}px`,
        bgcolor: palette.primary[100],
        color: palette.primary[600],
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
  );
}

function SummaryRow({ label, value, loading }: TransferReviewRow & { loading: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 0.75, gap: 2 }}>
      <Typography sx={{ fontSize: font.size.sm, color: "text.secondary" }}>{label}</Typography>
      {loading ? (
        <Skeleton variant="rounded" animation="wave" width={96} height={16} />
      ) : (
        <Typography
          sx={{
            fontSize: font.size.sm,
            fontWeight: font.weight.semibold,
            color: "text.primary",
            textAlign: "right",
          }}
        >
          {value}
        </Typography>
      )}
    </Stack>
  );
}

function PreviewBox({ label, value }: TransferPreviewField) {
  return (
    <Stack spacing={0.75}>
      <Typography sx={{ fontSize: font.size.base }}>{label}</Typography>
      <Box
        sx={{
          borderRadius: `${radius.lg}px`,
          border: `1px solid ${palette.slate[200]}`,
          bgcolor: palette.white,
          px: "14px",
          py: "12px",
          fontSize: font.size.base,
        }}
      >
        {value}
      </Box>
    </Stack>
  );
}
