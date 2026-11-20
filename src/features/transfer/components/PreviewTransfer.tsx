"use client";

import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowRight, Check, ChevronLeft, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useTopBarBreadcrumb } from "@core/layout";

import BaseButton from "@core/components/BaseButton";
import BaseIconButton from "@core/components/BaseIconButton";
import BaseStep from "@core/components/BaseStep";
import BaseTransferReviewCard from "@core/components/BaseTransferReviewCard";
import type { TransferParty } from "@core/components/BaseTransferFromAccount";
import VerifyActionFlow from "@core/components/VerifyActionFlow";
import { showToast } from "@core/components/AppToast";
import { palette } from "@/theme/palette";
import { AuthenticatorDialog } from "@/features/authenticator";
import { downloadBlob } from "@/utils/download-file";
import { formatCCY } from "@/utils";
import type { TransferResult } from "../transfer.types";
import { useTransferAuthorization } from "../use-transfer-authorization";

const DEFAULT_STEPS = ["New", "Review", "Transfer"];

function generateTransactionId() {
    return `#TRX-${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function generateReferenceNo() {
    return `SSM${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;
}

function maskAccount(acc?: string | null) {
    if (!acc || acc === "-") return "-";
    const clean = acc.replace(/\s+/g, "");
    if (!/\d/.test(clean)) return acc;
    if (clean.length <= 4) return clean;
    const last4 = clean.slice(-4);
    return `•••• ${last4}`;
}

export type TransferReviewRow = { label: string; value: string };

/** One bordered box on the Review step (From Account, Amount, Remark, ...). */
export type TransferPreviewField = { label: string; value: React.ReactNode };

export type SuccessStepRenderProps = {
    result: TransferResult | null;
    displayFromName: string;
    displayFromNumber: string;
    displayToName: string;
    displayToNumber: string;
    displayAmountVal: string;
    displayTransactionId: string;
    displayReferenceNo: string;
    completedDateStr: string;
    displayFee: string;
    displayTotalDebited: string;
    dynamicExtraFields: TransferPreviewField[];
    handleClose: () => void;
    handleMakeAnotherTransfer: () => void;
    handleDownloadReceipt: () => void;
    handleBackToDashboard: () => void;
};

export type PreviewTransferProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
    topSection?: React.ReactNode;
    fromAccount?: TransferParty;
    toAccount?: TransferParty;
    /** Enables the Details -> Review "Next" button. */
    canSubmit: boolean;
    /** Bordered boxes shown at the top of the Review step (legacy format). */
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
    successMessage?: string;
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
    submit?: (idempotencyKey?: string) => Promise<TransferResult>;
    breadcrumbPrefix?: string;
    breadcrumbSubPrefix?: string;
    successTitle?: string;
    successSubtitle?: string;
    makeAnotherTitle?: string;
    backButtonTitle?: string;
    onBackToMain?: () => void;
    receiptTitle?: string;
    step0ActionPosition?: "inside" | "outside";
    step0ButtonTitle?: string;
    /** Custom steps labels, default is ["New", "Review", "Success"] */
    steps?: string[];
    /** Optional custom fields to display dynamically in the Success step */
    successFields?: TransferPreviewField[];
    /** Optional custom render function for the Success step */
    renderSuccess?: (props: SuccessStepRenderProps) => React.ReactNode;
    /**
     * Enables the Fund Transfers split view: the transfer-type sidebar, plus
     * title/stepper/from-account/fields/action merged into one card on step 0.
     * Off by default so other `PreviewTransfer` callers (e.g. Mobile Top-Up)
     * keep their existing layout untouched.
     */
    splitView?: boolean;
    /**
     * Width of the card container and stepper when splitView is false.
     * Defaults to 576 (matching the width of other transfer forms).
     */
    cardWidth?: number | string;
};

export type PreviewTransferDialogProps = PreviewTransferProps;

/**
 * Shared 3-step (New -> Review -> Success) page shell for transfer flows.
 * Uses TransferPreviewField and summaryRows directly.
 */
export default function PreviewTransfer({
    open,
    onClose,
    title,
    topSection,
    fromAccount,
    toAccount,
    canSubmit,
    previewFields = [],
    summaryRows,
    summaryStatus,
    onRetrySummary,
    successMessage,
    children,
    onReset,
    onReview,
    submit,
    breadcrumbPrefix,
    breadcrumbSubPrefix,
    successTitle,
    makeAnotherTitle,
    backButtonTitle,
    receiptTitle,
    step0ActionPosition,
    step0ButtonTitle,
    steps,
    successFields,
    renderSuccess,
    splitView = false,
    cardWidth = 576,
}: PreviewTransferProps) {
    const router = useRouter();
    const [step, setStep] = React.useState(0);
    const [verifyFlowOpen, setVerifyFlowOpen] = React.useState(false);
    const [termsAccepted, setTermsAccepted] = React.useState(false);
    // What the transfer came to once the phone authorized it
    const [result, setResult] = React.useState<TransferResult | null>(null);

    const resolvedCardWidth = cardWidth ?? 576;

    const [dynamicTrxId, setDynamicTrxId] = React.useState(generateTransactionId);
    const [dynamicRefNo, setDynamicRefNo] = React.useState(generateReferenceNo);

    const activeSteps = steps ?? DEFAULT_STEPS;
    const summaryReady = summaryStatus === undefined || summaryStatus === "ready";

    const authorization = useTransferAuthorization({
        submit,
        onCompleted: (completed) => {
            setResult(completed);
            setStep(2);
        },
    });
    const fromField = previewFields.find((f) => /^from/i.test(f.label));
    const toField = previewFields.find((f) => /^(to|beneficiary|recipient)/i.test(f.label));
    const explicitScheduleField = previewFields.find((f) => /^schedule$/i.test(f.label));
    const frequencyField = previewFields.find((f) => /^frequency$/i.test(f.label));
    const dateField = previewFields.find((f) => /(start\s*)?date/i.test(f.label));
    const remarkField = previewFields.find((f) => /remark|note|purpose/i.test(f.label));

    const resolvedFromAccount: TransferParty = fromAccount ?? {
        name: typeof fromField?.value === "string" ? fromField.value : undefined,
        accountNumber: undefined,
    };
    const resolvedToAccount: TransferParty = toAccount ?? {
        name: typeof toField?.value === "string" ? toField.value : undefined,
        accountNumber: undefined,
    };

    // Sourced directly from quoteSummaryRows / buildTransferSummaryRows
    const amountTransferred = summaryRows?.find((r) => /amount\s*transferred/i.test(r.label))?.value || "";
    const transactionId = summaryRows?.find((r) => /transaction\s*id/i.test(r.label))?.value || "";
    const referenceNo = summaryRows?.find((r) => /reference\s*no/i.test(r.label))?.value || "";
    const debitAmount = summaryRows?.find((r) => /debit\s*amount/i.test(r.label))?.value || amountTransferred;
    const otherSummaryRows = summaryRows?.filter(
        (r) => !/amount\s*transferred|transaction\s*id|reference\s*no|debit\s*amount/i.test(r.label)
    ) ?? [];

    const rawAmountStr = String(amountTransferred || debitAmount || "");
    const cleanNumber = rawAmountStr.replace(/[^\d.]/g, "");
    const parsedAmount = parseFloat(cleanNumber) || 0;
    const detectedCurrency = rawAmountStr.toUpperCase().includes("KHR")
        ? "KHR"
        : (resolvedFromAccount.currency || "USD");

    const displayFromName = result?.fromAccountName || resolvedFromAccount.name || "-";
    const displayFromNumber = result?.fromAccountNumber || resolvedFromAccount.accountNumber || "-";
    const displayToName = result?.toAccountName || resolvedToAccount.name || "-";
    const displayToNumber = result?.toAccountNumber || resolvedToAccount.accountNumber || "-";

    const displayTransactionId =
        result?.cbsReference ||
        (transactionId && transactionId !== "#TRX-28491024" ? transactionId : dynamicTrxId);

    const displayReferenceNo =
        result?.referenceId ||
        (referenceNo && referenceNo !== "SSM0499765223000" ? referenceNo : dynamicRefNo);

    const completedDateStr = dayjs(result?.executedAt || result?.createdAt || new Date()).format("MMM D, YYYY • h:mm A");

    const displayAmountVal = result?.amount
        ? formatCCY(result.amount, result.currency || detectedCurrency)
        : (amountTransferred || (parsedAmount > 0 ? formatCCY(parsedAmount, detectedCurrency) : "-"));

    const summaryFee = summaryRows?.find((r) => /fee/i.test(r.label))?.value;
    const displayFee = summaryFee || (detectedCurrency === "KHR" ? "0 KHR" : "$0.00");

    const summaryDebit = summaryRows?.find((r) => /debit\s*amount/i.test(r.label))?.value;
    const displayTotalDebited = summaryDebit || displayAmountVal;

    const dynamicExtraFields = (successFields ?? previewFields).filter((f) => {
        const label = f.label.toLowerCase();
        return (
            !label.startsWith("from") &&
            !label.startsWith("to") &&
            !label.startsWith("amount") &&
            !label.includes("beneficiary name") &&
            !label.includes("recipient name")
        );
    });

    const handleClose = () => {
        setStep(0);
        setVerifyFlowOpen(false);
        setTermsAccepted(false);
        authorization.discard();
        setResult(null);
        setDynamicTrxId(generateTransactionId());
        setDynamicRefNo(generateReferenceNo());
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

    // Button Transfer -> submits to backend and opens live authenticator QR, or falls back to verify flow
    const handleReviewNext = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (submit) {
            void authorization.start();
        } else {
            setVerifyFlowOpen(true);
        }
    };

    const handleBackToDashboard = () => {
        handleClose();
        router.push("/dashboard");
    };

    const handleMakeAnotherTransfer = () => {
        setStep(0);
        setResult(null);
        setDynamicTrxId(generateTransactionId());
        setDynamicRefNo(generateReferenceNo());
        onReset();
    };

    useTopBarBreadcrumb(
        open
            ? {
                prefix: breadcrumbPrefix ?? "Transfer",
                subPrefix: breadcrumbSubPrefix ?? title,
                onBack: step === 2 ? handleBackToDashboard : handleClose,
            }
            : null
    );

    if (!open) return null;

    const handleDownloadReceipt = () => {
        const extraFieldsTxt = dynamicExtraFields
            .map((f) => `${f.label}: ${typeof f.value === "string" || typeof f.value === "number" ? f.value : ""}`)
            .filter((txt) => !txt.endsWith(": "))
            .join("\n");
        const content = `${receiptTitle ?? "TRANSFER RECEIPT"}\n--------------------------------\nTransaction ID: ${displayTransactionId}\nReference No: ${displayReferenceNo}\nStatus: Completed\nCompleted On: ${completedDateStr}\n\nFrom: ${displayFromName}\nAccount: ${displayFromNumber}\n\nTo: ${displayToName}\nAccount: ${displayToNumber}\n\nAmount: ${displayAmountVal}\nTransfer Fee: ${displayFee}\nTotal Debited: ${displayTotalDebited}${extraFieldsTxt ? `\n\n${extraFieldsTxt}` : ""}\n--------------------------------\nSecured by Obsidian Ops`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        downloadBlob(blob, `Receipt-${displayReferenceNo}.txt`);
        showToast("success", {
            title: "Receipt downloaded",
            message: "Receipt saved successfully.",
        });
    };

    // Any verification method confirming advances Review -> Success.
    const handleConfirmed = () => {
        setVerifyFlowOpen(false);
        setResult({
            referenceId: displayReferenceNo,
            cbsReference: displayTransactionId,
            transferType: "TRANSFER",
            method: "MANUAL",
            functionCode: "TRANSFER",
            status: "COMPLETED",
            fromAccountNumber: resolvedFromAccount?.accountNumber || "",
            fromAccountName: resolvedFromAccount?.name || "",
            toAccountNumber: resolvedToAccount?.accountNumber || "",
            toAccountName: resolvedToAccount?.name || "",
            amount: parsedAmount,
            currency: detectedCurrency,
            remark: typeof remarkField?.value === "string" ? remarkField.value : undefined,
            createdAt: new Date().toISOString(),
            executedAt: new Date().toISOString(),
        });
        setStep(2);
    };

    const unifyStep0Card = splitView;

    const footer =
        step === 0 ? (
            <BaseButton
                title={step0ButtonTitle ?? "Review"}
                variant="contained"
                fullWidth
                disabled={!canSubmit}
                onClick={goToReview}
                sx={{
                    height: 52,
                    borderRadius: "999px",
                    bgcolor: "#2764A5",
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                        bgcolor: "#1E5289",
                    },
                    "&.Mui-disabled": {
                        bgcolor: "#CBD5E1",
                        color: "#FFFFFF",
                    },
                }}
            />
        ) : step === 1 ? (
            <Stack direction="row" spacing={2}>
                <BaseButton
                    title="Back"
                    variant="outlined"
                    fullWidth
                    onClick={backToDetails}
                    sx={{
                        height: 52,
                        borderRadius: "999px",
                        backgroundColor: "#E2E8F0",
                        borderColor: "transparent",
                        color: "#0F172A",
                        fontSize: 16,
                        fontWeight: 600,
                        textTransform: "none",
                        boxShadow: "none",
                        "&:hover": {
                            backgroundColor: "#E2E8F0",
                            borderColor: "transparent",
                        },
                    }}
                />
                <BaseButton
                    title="Transfer"
                    variant="contained"
                    fullWidth
                    disabled={!termsAccepted || !summaryReady}
                    isLoading={authorization.submitting}
                    onClick={handleReviewNext}
                    sx={{
                        height: 52,
                        borderRadius: "999px",
                        bgcolor: "#2764A5",
                        color: "#FFFFFF",
                        fontSize: 16,
                        fontWeight: 600,
                        textTransform: "none",
                        boxShadow: "none",
                        "&:hover": {
                            bgcolor: "#1E5289",
                        },
                        "&.Mui-disabled": {
                            bgcolor: "#CBD5E1",
                            color: "#FFFFFF",
                        },
                    }}
                />
            </Stack>
        ) : (
            <BaseButton
                title="Done"
                variant="contained"
                fullWidth
                onClick={handleClose}
                sx={{
                    height: 52,
                    borderRadius: "999px",
                    bgcolor: "#2764A5",
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                        bgcolor: "#1E5289",
                    },
                }}
            />
        );

    return (
        <Box >
            <Grid container spacing={2.5}>
                <Grid size={12}>
                    {/* Page Title (under splitView, steps 0, 1 & 2 merge this into their card below instead) */}
                    {!unifyStep0Card && (
                        <Box sx={{ mb: 4 }}>
                            <Typography
                                sx={{
                                    fontSize: 28,
                                    fontWeight: 700,
                                    color: "#0F172A",
                                    lineHeight: 1.25,
                                    textAlign: "center"
                                }}
                            >
                                {title}
                            </Typography>
                            <Box
                                sx={{
                                    width: "100%",
                                    maxWidth: resolvedCardWidth,
                                    mx: "auto",
                                    mt: 3,
                                    mb: 1,
                                }}
                            >
                                <BaseStep steps={activeSteps} activeStep={step} />
                            </Box>
                        </Box>
                    )}

                    <Box sx={{ display: "block", justifyContent: "center", alignItems: "center" }}>
                        {/* Top Card (only shown on Step 0 when topSection is provided, and not merged into the unified card) */}
                        {step === 0 && topSection && !unifyStep0Card && (
                            <Box
                                sx={{
                                    mx: "auto",
                                    width: "100%",
                                    maxWidth: resolvedCardWidth,
                                    bgcolor: "#FFFFFF",
                                    borderRadius: "20px",
                                    border: "1px solid #EDEDEC",
                                    p: { xs: 2.5, md: 3 },
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                }}
                            >
                                {topSection}
                            </Box>
                        )}

                        {/* Step 0: Main Details — under splitView, title/stepper sit above the card, matching Review */}
                        {step === 0 && (
                            <Box
                                sx={{
                                    mt: unifyStep0Card ? 0 : 2,
                                    // splitView: hugs the form and sits at the start (left), like the preview
                                    ...(unifyStep0Card
                                        ? { width: "100%", maxWidth: 576 }
                                        : { width: "100%", maxWidth: resolvedCardWidth, mx: "auto" }),
                                }}
                            >
                                {unifyStep0Card && (
                                    <>
                                        <Typography
                                            sx={{
                                                fontSize: 28,
                                                fontWeight: 700,
                                                color: "#0F172A",
                                                lineHeight: 1.25,
                                                textAlign: "center"
                                            }}
                                        >
                                            {title}
                                        </Typography>
                                        <Box sx={{ mt: 3, mb: 3.5 }}>
                                            {/* Step 0 (New) → back to the transfer type list */}
                                            <StepperWithBack
                                                activeStep={step}
                                                steps={activeSteps}
                                                onBack={handleClose}
                                                backTooltip="Back to Transfer"
                                            />
                                        </Box>
                                    </>
                                )}
                                <Box
                                    sx={{
                                        bgcolor: "#FFFFFF",
                                        borderRadius: "20px",
                                        border: "1px solid #EDEDEC",
                                        p: unifyStep0Card ? 10 : { xs: 3, md: 4 },
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                    }}
                                >
                                    {unifyStep0Card && topSection && (
                                        <Box sx={{ mb: 3.5 }}>{topSection}</Box>
                                    )}
                                    {children}
                                    {(unifyStep0Card || step0ActionPosition === "inside") && (
                                        <Box sx={{ mt: 3.5 }}>
                                            {footer}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* Step 1: Review Cards (Styled exactly as design) */}
                        {step === 1 && (
                            <Box
                                sx={{
                                    mt: unifyStep0Card ? 0 : 2.5,
                                    // splitView: card hugs the form and sits at the start (left), like the preview
                                    ...(unifyStep0Card
                                        ? { width: "100%", maxWidth: 576 }
                                        : { width: "100%", maxWidth: resolvedCardWidth, mx: "auto" }),
                                }}
                            >
                                {unifyStep0Card && (
                                    <>
                                        <Typography
                                            sx={{
                                                fontSize: 28,
                                                fontWeight: 700,
                                                color: "#0F172A",
                                                lineHeight: 1.25,
                                                textAlign: "center"
                                            }}
                                        >
                                            {title}
                                        </Typography>
                                        <Box sx={{ mt: 3, mb: 3.5 }}>
                                            {/* Step 1 (Review) → back to New */}
                                            <StepperWithBack
                                                activeStep={step}
                                                steps={activeSteps}
                                                onBack={backToDetails}
                                                backTooltip="Back to edit details"
                                            />
                                        </Box>
                                    </>
                                )}
                                <BaseTransferReviewCard
                                    from={resolvedFromAccount}
                                    to={resolvedToAccount}
                                    spacious={unifyStep0Card}
                                    amountTransferred={amountTransferred}
                                    transactionId={transactionId}
                                    referenceNo={referenceNo}
                                    debitAmount={debitAmount}
                                    extraRows={otherSummaryRows}
                                    schedule={
                                        explicitScheduleField?.value
                                            ? explicitScheduleField.value
                                            : frequencyField?.value
                                                ? dateField?.value && dateField.value !== "-" && dateField.value !== "Immediately"
                                                    ? `${frequencyField.value} • ${dateField.value}`
                                                    : frequencyField.value
                                                : dateField?.value ?? "Immediately"
                                    }
                                    remark={remarkField?.value ?? "Business Days"}
                                    termsAccepted={termsAccepted}
                                    onTermsAcceptedChange={setTermsAccepted}
                                />
                                {summaryStatus === "loading" && (
                                    <Typography
                                        role="status"
                                        sx={{ mt: 1.5, color: "#64748B", fontSize: 13 }}
                                    >
                                        Loading transfer quote...
                                    </Typography>
                                )}
                                {summaryStatus === "error" && (
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{ mt: 1.5, alignItems: "center", justifyContent: "space-between" }}
                                    >
                                        <Typography role="alert" sx={{ color: "#B42318", fontSize: 13 }}>
                                            Could not load the transfer quote. Try again before continuing.
                                        </Typography>
                                        {onRetrySummary && (
                                            <BaseButton
                                                title="Retry"
                                                variant="outlined"
                                                onClick={onRetrySummary}
                                            />
                                        )}
                                    </Stack>
                                )}
                            </Box>
                        )}

                        {/* Step 2: New Success Step UI (Matching Screenshot) */}
                        {step === 2 && (
                            <Box
                                sx={{
                                    mt: unifyStep0Card ? 0 : 2.5,
                                    // splitView: card hugs the form and sits at the start (left), like steps 0 & 1
                                    ...(unifyStep0Card
                                        ? { width: "100%", maxWidth: 576 }
                                        : { width: "100%", maxWidth: resolvedCardWidth, mx: "auto" }),
                                }}
                            >
                                {unifyStep0Card && (
                                    <>
                                        <Typography
                                            sx={{
                                                fontSize: 28,
                                                fontWeight: 700,
                                                color: "#0F172A",
                                                lineHeight: 1.25,
                                                textAlign: "center"
                                            }}
                                        >
                                            {title}
                                        </Typography>
                                        <Box sx={{ mt: 3, mb: 3.5 }}>
                                            {/* Step 2 (Success) → back to New */}
                                            <StepperWithBack
                                                activeStep={step}
                                                steps={activeSteps}
                                                onBack={handleMakeAnotherTransfer}
                                                backTooltip="Back to New Transfer"
                                            />
                                        </Box>
                                    </>
                                )}
                                {renderSuccess ? (
                                    renderSuccess({
                                        result,
                                        displayFromName,
                                        displayFromNumber,
                                        displayToName,
                                        displayToNumber,
                                        displayAmountVal,
                                        displayTransactionId,
                                        displayReferenceNo,
                                        completedDateStr,
                                        displayFee,
                                        displayTotalDebited,
                                        dynamicExtraFields,
                                        handleClose,
                                        handleMakeAnotherTransfer,
                                        handleDownloadReceipt,
                                        handleBackToDashboard,
                                    })
                                ) : (
                                    <>
                                        <Box
                                            sx={{
                                                mt: unifyStep0Card ? 0 : 2.5,
                                                mb: 3,
                                                bgcolor: "#FFFFFF",
                                                borderRadius: "24px",
                                                border: "1px solid #EDEDEC",
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                                width: "100%",
                                                p: { xs: 3, sm: 4, md: 4.5 },
                                            }}
                                        >
                                            {/* Double-circle checkmark icon */}
                                            <Box
                                                sx={{
                                                    width: 52,
                                                    height: 52,
                                                    borderRadius: "50%",
                                                    bgcolor: "#E1F5EC",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    mx: "auto",
                                                    mb: 2,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: "50%",
                                                        bgcolor: "#248058",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <Check size={20} strokeWidth={3} color="#FFFFFF" />
                                                </Box>
                                            </Box>

                                            {/* Title & Subtitle */}
                                            <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#0F172A", textAlign: "center" }}>
                                                {successTitle ?? "Transfer successful"}
                                            </Typography>
                                            <Typography sx={{ fontSize: 13.5, color: "#64748B", textAlign: "center", mt: 0.75, mb: 3, lineHeight: 1.45 }}>
                                                {successMessage || "Your bank transfer was completed and the receipt is ready."}
                                            </Typography>

                                            {/* Amount Transferred Block */}
                                            <Box sx={{ textAlign: "center", mb: 3 }}>
                                                <Typography
                                                    sx={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        color: "#94A3B8",
                                                        letterSpacing: "0.5px",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    AMOUNT TRANSFERRED
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontSize: { xs: 32, sm: 36 },
                                                        fontWeight: 800,
                                                        color: "#0F172A",
                                                        my: 0.75,
                                                        lineHeight: 1.15,
                                                    }}
                                                >
                                                    {displayAmountVal}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        bgcolor: "#E8F8F0",
                                                        color: "#16A34A",
                                                        borderRadius: "999px",
                                                        px: 2,
                                                        py: 0.35,
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        letterSpacing: "0.2px",
                                                    }}
                                                >
                                                    Complete
                                                </Box>
                                            </Box>

                                            {/* From -> To Box */}
                                            <Box
                                                sx={{
                                                    bgcolor: "#F8FAFC",
                                                    borderRadius: "16px",
                                                    p: 2.25,
                                                    mb: 3,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                                                        FROM
                                                    </Typography>
                                                    <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, color: "#0F172A", mt: 0.25 }}>
                                                        {displayFromName}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 12.5, color: "#64748B", mt: 0.25 }}>
                                                        {maskAccount(displayFromNumber)}
                                                    </Typography>
                                                </Box>

                                                <Box
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: "50%",
                                                        bgcolor: "#E6F7F0",
                                                        color: "#10B981",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        mx: 1.5,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <ArrowRight size={15} strokeWidth={2.5} />
                                                </Box>

                                                <Box sx={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                                                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                                                        TO
                                                    </Typography>
                                                    <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, color: "#0F172A", mt: 0.25 }}>
                                                        {displayToName}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 12.5, color: "#64748B", mt: 0.25 }}>
                                                        {maskAccount(displayToNumber)}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Metadata Rows */}
                                            <Stack spacing={1.75} divider={<Box sx={{ borderBottom: "1px solid #F1F5F9" }} />}>
                                                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 0.5 }}>
                                                    <Typography sx={{ fontSize: 13, color: "#64748B" }}>Transaction ID</Typography>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                                        {displayTransactionId}
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 0.5 }}>
                                                    <Typography sx={{ fontSize: 13, color: "#64748B" }}>Reference no</Typography>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                                        {displayReferenceNo}
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 0.5 }}>
                                                    <Typography sx={{ fontSize: 13, color: "#64748B" }}>Completed on</Typography>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                                        {completedDateStr}
                                                    </Typography>
                                                </Stack>

                                                {dynamicExtraFields.map((field, idx) => (
                                                    <Stack key={idx} direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 0.5 }}>
                                                        <Typography sx={{ fontSize: 13, color: "#64748B" }}>{field.label}</Typography>
                                                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A", textAlign: "right" }}>
                                                            {field.value}
                                                        </Typography>
                                                    </Stack>
                                                ))}

                                                <Box sx={{ pt: 0.5 }}>
                                                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                                                        <Typography sx={{ fontSize: 13, color: "#64748B" }}>Transfer fee</Typography>
                                                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                                            {displayFee}
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                                                        <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: "#64748B" }}>Total debited</Typography>
                                                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                                                            {displayTotalDebited}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Stack>
                                        </Box>

                                        {/* Action Buttons Below Card */}
                                        {/* <Box
                                            sx={{
                                                width: "100%",
                                                mt: 3,
                                                mb: 6,
                                            }}
                                        >
                                            <Stack spacing={2}>
                                                <BaseButton
                                                    title={backButtonTitle ?? "Back to Dashboard"}
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={handleBackToDashboard}
                                                    sx={{
                                                        height: 48,
                                                        borderRadius: "999px",
                                                        bgcolor: "#2764A5",
                                                        color: "#FFFFFF",
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        textTransform: "none",
                                                        boxShadow: "none",
                                                        "&:hover": { bgcolor: "#1E5289" },
                                                    }}
                                                />

                                                <BaseButton
                                                    title="Download receipt"
                                                    variant="outlined"
                                                    fullWidth
                                                    onClick={handleDownloadReceipt}
                                                    sx={{
                                                        height: 48,
                                                        borderRadius: "999px",
                                                        borderColor: "#10B981",
                                                        color: "#10B981",
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        textTransform: "none",
                                                        boxShadow: "none",
                                                        "&:hover": {
                                                            borderColor: "#059669",
                                                            bgcolor: "#F0FDF4",
                                                        },
                                                    }}
                                                />

                                                <BaseButton
                                                    title={makeAnotherTitle ?? "Make another transfer"}
                                                    variant="text"
                                                    fullWidth
                                                    onClick={handleMakeAnotherTransfer}
                                                    sx={{
                                                        height: 44,
                                                        color: "#2764A5",
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        textTransform: "none",
                                                        bgcolor: "transparent",
                                                        "&:hover": { bgcolor: palette.primary[40], textDecoration: "underline", color: "white" },
                                                    }}
                                                />
                                            </Stack>

                                            <Stack
                                                direction="row"
                                                spacing={0.75}
                                                sx={{ justifyContent: "center", alignItems: "center", mt: 2.5 }}
                                            >
                                                <ShieldCheck size={14} color="#94A3B8" />
                                                <Typography sx={{ fontSize: 12, color: "#94A3B8" }}>
                                                    Secured by Obsidian Ops
                                                </Typography>
                                            </Stack>
                                        </Box> */}
                                    </>
                                )}
                            </Box>
                        )}

                        {/* Bottom Action Button on page background (Only for Step 0 & 1) */}
                        {step !== 2 && (step !== 0 || (!unifyStep0Card && step0ActionPosition !== "inside")) && (
                            <Box
                                sx={{
                                    mt: 3,
                                    mb: 5,
                                    ...(unifyStep0Card && step === 1
                                        ? { width: "100%", maxWidth: 576, mx: 0 }
                                        : { width: "100%", maxWidth: resolvedCardWidth, mx: "auto" }),
                                }}
                            >
                                {footer}
                            </Box>
                        )
                        }

                        <VerifyActionFlow
                            open={verifyFlowOpen}
                            onClose={() => setVerifyFlowOpen(false)}
                            onVerified={handleConfirmed}
                            subject="transfer"
                            onSelectMobileApp={submit ? async () => { await authorization.start(); } : undefined}
                            onSelectQr={submit ? async () => { await authorization.start(); } : undefined}
                        />
                        <AuthenticatorDialog
                            key={authorization.pending?.referenceId ?? "none"}
                            open={authorization.qrOpen}
                            authenticator={authorization.pending?.authenticator ?? null}
                            subject="transfer"
                            onAuthorized={authorization.authorize}
                            onRenew={authorization.renew}
                            onClose={authorization.closeQr}
                        />
                    </Box >
                </Grid >
            </Grid >
        </Box >
    );
}


const STEPPER_BAR_HEIGHT = 6;

function StepperWithBack({
    activeStep,
    steps = DEFAULT_STEPS,
    onBack,
    backTooltip = "Back",
}: {
    activeStep: number;
    steps?: string[];
    onBack?: () => void;
    backTooltip?: string;
}) {
    return (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, width: "100%" }}>
            <Box
                sx={{
                    width: 36,
                    height: STEPPER_BAR_HEIGHT,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    visibility: onBack ? "visible" : "hidden",
                }}
            >
                <BaseIconButton
                    icon={<ChevronLeft size={18} />}
                    tooltip={backTooltip}
                    onClick={onBack ?? (() => { })}
                />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <BaseStep steps={steps} activeStep={activeStep} />
            </Box>
        </Box>
    );
}




