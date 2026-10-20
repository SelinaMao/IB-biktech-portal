"use client";

import React from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowRight, Check, ChevronLeft, Info, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

import BaseButton from "@core/components/BaseButton";
import BaseCard from "@core/components/BaseCard";
import BaseTermsLabel from "@core/components/BaseTermsLabel";
import BaseTransferFromAccount, { type TransferParty } from "@core/components/BaseTransferFromAccount";
import ApproveTransfer from "@core/components/ApproveTransfer";
import ChooseVerifyDialog from "@core/components/ChooseVerifyDialog";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import { showToast } from "@core/components/AppToast";
import { font, palette, radius } from "@/theme/palette";
import { AuthenticatorDialog } from "@/features/authenticator";
import { downloadBlob } from "@/utils/download-file";
import { formatCCY } from "@/utils";
import type { TransferResult } from "../transfer.types";
import { useTransferAuthorization } from "../use-transfer-authorization";
import { formatAccountNumber } from "@/utils/format-account-number";
import { parseTransferAmount } from "../transfer.utils";

const STEPS = ["New", "Review", "Transfer"];

function maskAccount(acc?: string | null) {
    if (!acc) return "•••• 0000";
    const clean = acc.replace(/\s+/g, "");
    const last4 = clean.length > 4 ? clean.slice(-4) : clean;
    return `•••• ${last4}`;
}

const DEFAULT_MOCK_TRANSACTION_ID = "#TRX-28491024";
const DEFAULT_MOCK_REFERENCE_NO = "SSM0499765223000";

export type TransferReviewRow = { label: string; value: string };

/** One bordered box on the Review step (From Account, Amount, Remark, ...). */
export type TransferPreviewField = { label: string; value: React.ReactNode };

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
    submit?: (idempotencyKey: string) => Promise<TransferResult>;
};

export type PreviewTransferDialogProps = PreviewTransferProps;



function ReviewRow({ field }: { field: TransferPreviewField }) {
    return (
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#8C9BAE" }}>{field.label}</Typography>
            <Box sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", textAlign: "right" }}>
                {field.value}
            </Box>
        </Stack>
    );
}

/**
 * Shared 3-step (New -> Review -> Transfer) page shell for transfer flows.
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
    summaryStatus = "ready",
    onRetrySummary,
    successMessage,
    children,
    onReset,
    onReview,
    submit,
}: PreviewTransferProps) {
    const [step, setStep] = React.useState(0);
    const [chooseVerifyOpen, setChooseVerifyOpen] = React.useState(false);
    const [approveTransferOpen, setApproveTransferOpen] = React.useState(false);
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

    const fromField = previewFields.find((f) => /^from/i.test(f.label));
    const toField = previewFields.find((f) => /^(to|beneficiary|recipient)/i.test(f.label));
    const scheduleField = previewFields.find((f) => /schedule|frequency|date/i.test(f.label));
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
    const amountTransferred = summaryRows?.find((r) => /amount\s*transferred/i.test(r.label))?.value || "$900.90";
    const transactionId = summaryRows?.find((r) => /transaction\s*id/i.test(r.label))?.value || DEFAULT_MOCK_TRANSACTION_ID;
    const referenceNo = summaryRows?.find((r) => /reference\s*no/i.test(r.label))?.value || DEFAULT_MOCK_REFERENCE_NO;
    const debitAmount = summaryRows?.find((r) => /debit\s*amount/i.test(r.label))?.value || amountTransferred;
    const otherSummaryRows = summaryRows?.filter(
        (r) => !/amount\s*transferred|transaction\s*id|reference\s*no|debit\s*amount/i.test(r.label)
    ) ?? [];

    if (!open) return null;

    const handleClose = () => {
        setStep(0);
        setChooseVerifyOpen(false);
        setApproveTransferOpen(false);
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

    const router = useRouter();

    const handleReviewNext = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // Button Transfer -> opens ChooseVerifyDialog
        setChooseVerifyOpen(true);
    };

    const handleSelectQr = () => {
        setChooseVerifyOpen(false);
        // Direct QR selection -> opens QrConfirmationDialog
        setConfirmOpen(true);
    };

    const handleSelectMobileApp = async () => {
        setChooseVerifyOpen(false);
        if (submit) {
            const started = await authorization.start();
            if (started) {
                return;
            }
        }
        // ChooseVerifyDialog -> opens ApproveTransfer
        setApproveTransferOpen(true);
    };

    const handleSelectSms = () => {
        setChooseVerifyOpen(false);
        showToast("info", {
            title: "SMS Verification",
            message: "A verification code has been sent to your phone.",
        });
        // ChooseVerifyDialog -> opens ApproveTransfer
        setApproveTransferOpen(true);
    };

    const handleNotReceived = () => {
        setApproveTransferOpen(false);
        // ApproveTransfer -> opens QrConfirmationDialog
        setConfirmOpen(true);
    };

    const handleBackToDashboard = () => {
        handleClose();
        router.push("/dashboard");
    };

    const handleMakeAnotherTransfer = () => {
        setStep(0);
        setResult(null);
        onReset();
    };

    const displayFromName = result?.fromAccountName || resolvedFromAccount.name || "Shiiping co., ltd.";
    const displayFromNumber = result?.fromAccountNumber || resolvedFromAccount.accountNumber || "0068";
    const displayToName = result?.toAccountName || resolvedToAccount.name || "Sarah Jenkins";
    const displayToNumber = result?.toAccountNumber || resolvedToAccount.accountNumber || "0567";
    const displayTransactionId = result?.cbsReference || result?.referenceId || transactionId || DEFAULT_MOCK_TRANSACTION_ID;
    const displayReferenceNo = result?.referenceId || referenceNo || DEFAULT_MOCK_REFERENCE_NO;
    const completedDateStr = dayjs(result?.executedAt || result?.createdAt || new Date()).format("MMM D, YYYY • h:mm A");
    const displayAmountVal = result?.amount ? formatCCY(result.amount, result.currency || "USD") : amountTransferred;
    const displayFee = "$0.00";

    const handleDownloadReceipt = () => {
        const content = `TRANSFER RECEIPT\n--------------------------------\nTransaction ID: ${displayTransactionId}\nReference No: ${displayReferenceNo}\nStatus: Completed\nCompleted On: ${completedDateStr}\n\nFrom: ${displayFromName}\nAccount: ${displayFromNumber}\n\nTo: ${displayToName}\nAccount: ${displayToNumber}\n\nAmount: ${displayAmountVal}\nTransfer Fee: ${displayFee}\nTotal Debited: ${displayAmountVal}\n--------------------------------\nSecured by Obsidian Ops`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        downloadBlob(blob, `Receipt-${displayReferenceNo}.txt`);
        showToast("success", {
            title: "Receipt downloaded",
            message: "Receipt saved successfully.",
        });
    };

    // The QR dialog is the mocked mobile-approval step — closing/approving it advances Review -> Success.
    const handleConfirmed = () => {
        setConfirmOpen(false);
        setResult({
            referenceId: referenceNo || DEFAULT_MOCK_REFERENCE_NO,
            transferType: "TRANSFER",
            method: "MANUAL",
            functionCode: "TRANSFER",
            status: "COMPLETED",
            fromAccountNumber: resolvedFromAccount?.accountNumber || "000 000 0068",
            fromAccountName: resolvedFromAccount?.name || "Shiiping co., ltd.",
            toAccountNumber: resolvedToAccount?.accountNumber || "000 000 0567",
            toAccountName: resolvedToAccount?.name || "Sarah Jenkins",
            amount: parseTransferAmount(amountTransferred) || 900.9,
            currency: "USD",
            createdAt: new Date().toISOString(),
            executedAt: new Date().toISOString(),
        });
        setStep(2);
    };

    const summaryReady = summaryStatus === "ready";

    const footer =
        step === 0 ? (
            <BaseButton
                title="Review"
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
                        backgroundColor: "#EEF2F6",
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
                    onClick={step === 2 ? handleBackToDashboard : handleClose}
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        border: "none",
                        bgcolor: "transparent",
                        p: 0,
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
                            fontSize: 14,
                            fontWeight: 600,
                            color: palette.primary[40],
                        }}
                    >
                        {step === 2 ? "Back to Dashboard" : "Transfer"}
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
                {step === 2 && (
                    <Typography sx={{ fontSize: 14, color: "#64748B", mt: 0.5 }}>
                        Transfer to Other Account Bank
                    </Typography>
                )}
                <Box sx={{ width: { xs: "100%", sm: 500, md: 520 }, maxWidth: "100%", mx: "auto", mt: 4, mb: 1 }}>
                    <TransferStepper steps={STEPS} activeStep={step} />
                </Box>
            </Box>

            <Box sx={{ display: "block", justifyContent: "center", alignItems: "center" }}>
                {/* Top Card (only shown on Step 0 when topSection is provided) */}
                {step === 0 && topSection && (
                    <Box
                        sx={{
                            mx: "auto",
                            width: { xs: "100%", sm: 500, md: 520 },
                            maxWidth: "100%",
                            bgcolor: "#FFFFFF",
                            borderRadius: "20px",
                            p: { xs: 2.5, md: 3 },
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                    >
                        {topSection}
                    </Box>
                )}

                {/* Step 0: Main Details Card */}
                {step === 0 && (
                    <Box
                        sx={{
                            mt: 2.5,
                            bgcolor: "#FFFFFF",
                            borderRadius: "20px",
                            p: { xs: 3, md: 3.5 },
                            width: { xs: "100%", sm: 500, md: 520 },
                            maxWidth: "100%",
                            mx: "auto",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                    >
                        {children}
                    </Box>
                )}

                {/* Step 1: Review Cards (Styled exactly as design) */}
                {step === 1 && (
                    <Box
                        sx={{
                            mt: 2.5,
                            width: { xs: "100%", sm: 500, md: 520 },
                            maxWidth: "100%",
                            mx: "auto",
                        }}
                    >
                        <Stack spacing={2}>
                            {/* Card 1: From -> To Card */}
                            <BaseTransferFromAccount from={resolvedFromAccount} to={resolvedToAccount} />

                            {/* Card 2: Transfer Details Card */}
                            <Box
                                sx={{
                                    bgcolor: "#FFFFFF",
                                    borderRadius: "20px",
                                    p: { xs: 3, md: 3.5 },
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                }}
                            >
                                {/* Amount Transferred */}
                                <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#8C9BAE" }}>
                                    Amount Transferred
                                </Typography>
                                <Box
                                    sx={{
                                        fontSize: { xs: 34, sm: 38 },
                                        fontWeight: 800,
                                        color: "#0F172A",
                                        mt: 0.75,
                                        mb: 2.5,
                                        letterSpacing: "-0.5px",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {amountTransferred}
                                </Box>

                                {/* Dotted Divider */}
                                <Box sx={{ borderBottom: "1.5px dotted #E2E8F0", my: 2.5 }} />

                                {/* Transaction ID & Reference no */}
                                <Stack spacing={1.75}>
                                    <ReviewRow field={{ label: "Transaction ID", value: transactionId }} />
                                    <ReviewRow field={{ label: "Reference no", value: referenceNo }} />
                                </Stack>

                                {/* Dotted Divider */}
                                <Box sx={{ borderBottom: "1.5px dotted #E2E8F0", my: 2.5 }} />

                                {/* Debit amount & Additional quote rows (Fee, Exchange Rate, Credit Amount, etc.) */}
                                <Stack spacing={1.75}>
                                    <ReviewRow
                                        field={{
                                            label: "Debit amount",
                                            value: debitAmount,
                                        }}
                                    />
                                    {otherSummaryRows.map((row) => (
                                        <ReviewRow key={row.label} field={row} />
                                    ))}
                                </Stack>

                                {/* Dotted Divider */}
                                <Box sx={{ borderBottom: "1.5px dotted #E2E8F0", my: 2.5 }} />

                                {/* Schedule & Remark */}
                                <Stack spacing={1.75}>
                                    <ReviewRow
                                        field={{
                                            label: "Schedule",
                                            value: scheduleField?.value ?? "Immediately",
                                        }}
                                    />
                                    <ReviewRow
                                        field={{
                                            label: "Remark",
                                            value: remarkField?.value ?? "Business Days",
                                        }}
                                    />
                                </Stack>
                            </Box>
                        </Stack>
                    </Box>
                )}

                {/* Step 2: New Success Step UI (Matching Screenshot) */}
                {step === 2 && (
                    <Box
                        sx={{
                            mt: 2.5,
                            mb: 6,
                            bgcolor: "#FFFFFF",
                            borderRadius: "24px",
                            border: "1px solid #EDEDEC",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            width: { xs: "100%", md: 840, lg: 920 },
                            maxWidth: "100%",
                            mx: "auto",
                            overflow: "hidden",
                        }}
                    >
                        <Grid container>
                            {/* Left Column: Transfer Success Details */}
                            <Grid
                                size={{ xs: 12, md: 7 }}
                                sx={{
                                    p: { xs: 3, sm: 4, md: 4.5 },
                                    borderRight: { md: "1px solid #F1F5F9" },
                                }}
                            >
                                {/* Checkmark circle */}
                                <Box
                                    sx={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: "50%",
                                        bgcolor: "#E6F7F0",
                                        color: "#10B981",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mx: "auto",
                                        mb: 2,
                                    }}
                                >
                                    <Check size={26} strokeWidth={2.5} />
                                </Box>

                                {/* Title & Subtitle */}
                                <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#0F172A", textAlign: "center" }}>
                                    Transfer successful
                                </Typography>
                                <Typography sx={{ fontSize: 13.5, color: "#64748B", textAlign: "center", mt: 0.5, mb: 3 }}>
                                    Your bank transfer was completed and the receipt is ready.
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
                                        Amount Transferred
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: { xs: 32, sm: 38 },
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
                                            gap: 0.75,
                                            bgcolor: "#E8F8F0",
                                            color: "#16A34A",
                                            borderRadius: "999px",
                                            px: 1.5,
                                            py: 0.35,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#16A34A" }} />
                                        Completed
                                    </Box>
                                </Box>

                                {/* From -> To Box */}
                                <Box
                                    sx={{
                                        bgcolor: "#F8FAFC",
                                        borderRadius: "16px",
                                        p: 2,
                                        mb: 3,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Box sx={{ flex: 1, minWidth: 0, padding: 2 }}>
                                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                                            FROM
                                        </Typography>
                                        <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, color: "#0F172A", mt: 0.25 }}>
                                            {displayFromName}
                                        </Typography>
                                        <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.25 }}>
                                            {maskAccount(displayFromNumber)}
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{
                                            width: 30,
                                            height: 30,
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
                                        <ArrowRight size={15} />
                                    </Box>

                                    <Box sx={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                                            TO
                                        </Typography>
                                        <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, color: "#0F172A", mt: 0.25 }}>
                                            {displayToName}
                                        </Typography>
                                        <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.25 }}>
                                            {maskAccount(displayToNumber)}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Metadata Rows */}
                                <Stack spacing={3} divider={<Box sx={{ borderBottom: "1px solid #F1F5F9" }} />}>
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

                                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 0.5 }}>
                                        <Typography sx={{ fontSize: 13, color: "#64748B" }}>Transfer fee</Typography>
                                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                            {displayFee}
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 0.5 }}>
                                        <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: "#64748B" }}>Total debited</Typography>
                                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                                            {displayAmountVal}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Grid>

                            {/* Right Column: Receipt & Actions */}
                            <Grid
                                size={{ xs: 12, md: 5 }}
                                sx={{
                                    p: { xs: 3, sm: 4, md: 4.5 },
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    bgcolor: "#F5F7FA"
                                }}
                            >
                                <Box>
                                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
                                        Transfer receipt
                                    </Typography>
                                    <Typography sx={{ fontSize: 13, color: "#64748B", mt: 0.5, mb: 2.5 }}>
                                        Keep this receipt for your accounting records.
                                    </Typography>

                                    {/* Mini Receipt Box */}
                                    <Box
                                        sx={{
                                            border: "1px solid #E2E8F0",
                                            borderRadius: "16px",
                                            bgcolor: "#ffffff",
                                            p: 4,
                                            mb: 2,
                                        }}
                                    >
                                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0F172A", mb: 2 }}>
                                                {displayToName}
                                            </Typography>
                                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                                                -{displayAmountVal}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                                            <Typography sx={{ fontSize: 12, color: "#64748B" }}>
                                                {completedDateStr}
                                            </Typography>
                                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#16A34A" }}>
                                                Completed
                                            </Typography>
                                        </Stack>
                                    </Box>

                                    {/* Info Alert */}
                                    <Box
                                        sx={{
                                            bgcolor: "#EFF6FF",
                                            border: "1px solid #DBEAFE",
                                            borderRadius: "12px",
                                            p: 1.5,
                                            mb: 3.5,
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 1.25,
                                        }}
                                    >
                                        <Info size={17} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
                                        <Typography sx={{ fontSize: 12, color: "#1E3A8A", lineHeight: 1.45 }}>
                                            Funds are usually credited within the recipient bank&apos;s processing window.
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Action Buttons & Security Footer */}
                                <Box>
                                    <Stack spacing={2}>
                                        <BaseButton
                                            title="Back to Dashboard"
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
                                            title="Make another transfer"
                                            variant="text"
                                            fullWidth
                                            onClick={handleMakeAnotherTransfer}
                                            sx={{
                                                height: 48,
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
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {/* Bottom Action Button on page background (Only for Step 0 & 1) */}
                {step !== 2 && (
                    <Box
                        sx={{
                            mt: 3,
                            mb: 5,
                            width: { xs: "100%", sm: 500, md: 520 },
                            maxWidth: "100%",
                            mx: "auto",
                        }}
                    >
                        {footer}
                    </Box>
                )}

                <ChooseVerifyDialog
                    open={chooseVerifyOpen}
                    onClose={() => setChooseVerifyOpen(false)}
                    onBack={() => setChooseVerifyOpen(false)}
                    onSelectQr={handleSelectQr}
                    onSelectMobileApp={handleSelectMobileApp}
                    onSelectSms={handleSelectSms}
                />

                <ApproveTransfer
                    open={approveTransferOpen}
                    onClose={() => setApproveTransferOpen(false)}
                    onNotReceived={handleNotReceived}
                    onApprove={handleConfirmed}
                />
                
                <QrConfirmationDialog
                    open={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onApprove={handleConfirmed}
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
                            fontWeight: i <= activeStep ? font.weight.bold : font.weight.regular,
                            color: i <= activeStep ? palette.info[900] : palette.slate[950],
                            whiteSpace: "nowrap",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                        }}
                    >
                        {i <= activeStep && (
                            <Box component="span" sx={{ fontSize: "14px", fontWeight: "bold" }}>
                                ✓
                            </Box>
                        )}
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
