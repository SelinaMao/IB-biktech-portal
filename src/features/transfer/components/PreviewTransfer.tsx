"use client";

import React from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { ChevronLeft, Inbox, Smartphone } from "lucide-react";

import BaseButton from "@core/components/BaseButton";
import BaseCard from "@core/components/BaseCard";
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

export type PreviewTransferProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
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
    /** Clears the caller's form state — fired once the view closes. */
    onReset: () => void;
    /** Fired on Details -> Review, e.g. to price the transfer. */
    onReview?: () => void;
    /**
     * Submits the transfer for real. When given, Review's Next submits it and the linked phone
     * authorizes it by QR; without it the mocked QR step is shown.
     */
    submit?: () => Promise<TransferResult>;
};

export type PreviewTransferDialogProps = PreviewTransferProps;

/**
 * Shared 3-step (New -> Review -> Submit) page shell for transfer flows.
 * Each transfer type supplies its Details fields plus a mapping to review rows
 * and success copy.
 */
export default function PreviewTransfer({
    open,
    onClose,
    title,
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
}: PreviewTransferProps) {
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

    if (!open) return null;

    const handleClose = () => {
        setStep(0);
        setConfirmOpen(false);
        setTermsAccepted(false);
        authorization.discard();
        setResult(null);
        onReset();
        onClose();
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

    const footer =
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
        );

    return (
        <Box sx={{ width: "100%" }}>
            {/* Back Button & Page Title */}
            <Box sx={{
                mx: -6,
                mt: -6,
                mb: 4,
                px: 6,
                py: 4,
                bgcolor: "background.paper",
                borderBottom: 0.1,
                borderColor: "divider",

            }}>
                <Box
                    component="button"
                    type="button"
                    onClick={handleClose}
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        border: "none",
                        bgcolor: "white",
                        p: 0,
                        width: "100%",
                        mb: 1,
                        cursor: "pointer",
                        "&:hover": { opacity: 0.85 },
                    }}
                >
                    <Box
                        sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: "#E6EEF8",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <ChevronLeft size={15} color={palette.primary[40]} />
                    </Box>
                    <Typography
                        sx={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: palette.primary[40],
                        }}
                    >
                        Transfer
                    </Typography>
                </Box>

                <Typography
                    sx={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: "#0F172A",
                        lineHeight: 1.25,
                    }}
                >
                    {title}
                </Typography>
                    <Box sx={{width:"50%",margin:"auto",mt:4, mb: 4, px: { xs: 1, sm: 4 } }}>
                        <TransferStepper steps={STEPS} activeStep={step} />
                    </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>

                
                {/* Main Content Card */}
                <Box
                    sx={{
                        bgcolor: "#FFFFFF",
                        borderRadius: "20px",
                        p: { xs: 3, md: 5 },
                        width: { xs: "100%", md: "75%", lg: "50%" },
                        maxWidth: "100%",
                        mx: { xs: 0, md: "auto" },
                    }}
                >
                

                    <Box sx={{ mb: 4 }}>
                        {step === 0 && children}

                        {step === 1 && (
                            <Stack spacing={2.5}>
                                <Stack spacing={3}>
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
                    </Box>

                    {footer}
                </Box>

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
            </Box>
        </Box>
    );
}

function TransferStepper({
  steps,
  activeStep,
}: {
  steps: string[];
  activeStep: number;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
      {steps.map((label, i) => (
        <Stack
          key={label}
          spacing={1.5}
          sx={{
            flex: 1,
            minWidth: 0,
            alignItems:
              i === 0 ? "flex-start" : i === steps.length - 1 ? "flex-end" : "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: 6,
              borderRadius: "999px",
              bgcolor: i <= activeStep ? palette.info[900] : palette.slate[200],
              transition: "background-color 0.3s ease",
            }}
          />
          <Typography
            sx={{
              fontSize: font.size.md,
              fontWeight: i === activeStep ? font.weight.bold : font.weight.regular,
              color: i === activeStep ? palette.info[900] : palette.slate[950],
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Typography>
        </Stack>
      ))}
    </Stack>
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
