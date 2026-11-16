"use client";

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import BaseBlurText from "@core/components/BaseBlurText";
import BaseButton from "@core/components/BaseButton";
import BaseDialog from "@core/components/BaseDialog";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import BaseTextArea from "@core/form/BaseTextArea";
import { showToast } from "@core/components/AppToast";
import { useGetInstanceQuery, useRaiseApprovalAuthenticatorMutation } from "../workflow.api";
import type { AuthenticatorRequest } from "@/features/authenticator";
import { font, palette } from "@/theme/palette";
import { toToastError } from "@/utils/api-error";

dayjs.extend(relativeTime);

export interface DetailDialogEntry {
  id?: string;
  transactionType?: string;
  refNo?: string;
  transactionId?: string;
  amount?: number | string;
  currency?: string;
  payToName?: string;
  payToAccountNo?: string;
  sourceAccountName?: string;
  sourceAccountNo?: string;
  creationDate?: string;
  requestedBy?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | string;
  rejectReason?: string;
  [key: string]: unknown;
}

export interface DetailDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pass an entry object (e.g. ApprovalEntry or task record) */
  entry?: DetailDialogEntry | null;
  /** Explicit title override (default: entry.transactionType || "Outgoing transfer") */
  title?: string;
  /** Initiator / Requester name */
  requestedBy?: string;
  /** Relative time or date string */
  requestedTime?: string;
  /** Amount value */
  amount?: number | string;
  /** Currency code (e.g. "USD", "KHR") */
  currency?: string;
  /** Source account display label */
  from?: string;
  /** Destination display label */
  to?: string;
  /** Reference number */
  reference?: string;
  /** Status string: "PENDING" | "APPROVED" | "REJECTED" */
  status?: "PENDING" | "APPROVED" | "REJECTED" | string;
  /** Rejection reason (if rejected) */
  rejectReason?: string;
  /** Callback when Approve is clicked */
  onApprove?: (entry?: DetailDialogEntry | null, authenticatorRequestId?: string) => void | Promise<void>;
  /** Callback when Reject is confirmed */
  onReject?: (entry?: DetailDialogEntry | null, reason?: string) => void | Promise<void>;
  /** Loading state for Approve */
  isApproving?: boolean;
  /** Loading state for Reject */
  isRejecting?: boolean;
  /** Whether to show QR code confirmation before calling onApprove (default: false) */
  requireQrConfirmation?: boolean;
}

function formatLast4(acc?: string | null): string {
  if (!acc) return "";
  const cleaned = acc.replace(/\D/g, "");
  return cleaned.length >= 4 ? `•••• ${cleaned.slice(-4)}` : acc;
}

export default function DetailDialog({
  open,
  onClose,
  entry,
  title,
  requestedBy,
  requestedTime,
  amount,
  currency,
  from,
  to,
  reference,
  status,
  rejectReason: explicitRejectReason,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
  requireQrConfirmation = false,
}: DetailDialogProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [rejectTouched, setRejectTouched] = useState(false);
  const [qrConfirmOpen, setQrConfirmOpen] = useState(false);
  const [authenticator, setAuthenticator] = useState<AuthenticatorRequest | null>(null);
  const [raiseApprovalAuthenticator, { isLoading: isRaisingAuth }] = useRaiseApprovalAuthenticatorMutation();

  const workflowId =
    (entry?.transactionId as string) ||
    (entry?.id && typeof entry.id === "string" && !entry.id.includes(" ") ? String(entry.id) : null);

  const { data: instanceDetail } = useGetInstanceQuery(workflowId ?? "", {
    skip: !open || !workflowId,
  });

  const ctx = (instanceDetail?.context as Record<string, unknown> | undefined) || {};

  useEffect(() => {
    if (!open) {
      setQrConfirmOpen(false);
      setAuthenticator(null);
      setRejectDialogOpen(false);
      setRejectReasonInput("");
      setRejectTouched(false);
    }
  }, [open]);

  // Resolve status: "PENDING" | "APPROVED" | "REJECTED"
  const rawStatus = (
    status ||
    instanceDetail?.status ||
    (entry?.status as string) ||
    "PENDING"
  ).toUpperCase();

  const isPending =
    rawStatus === "PENDING" ||
    rawStatus === "IN_PROGRESS" ||
    rawStatus === "AWAITING APPROVAL" ||
    rawStatus === "DUE";
  const isApproved =
    rawStatus === "APPROVED" ||
    rawStatus === "PROCESSED" ||
    rawStatus === "SUCCESS";
  const isRejected =
    rawStatus === "REJECTED" ||
    rawStatus === "CANCELLED" ||
    rawStatus === "FAILED";

  // Header Title & Subtitle
  const dialogTitle =
    title ||
    instanceDetail?.functionName ||
    entry?.transactionType ||
    "Approval request";

  const requesterName =
    requestedBy ||
    entry?.requestedBy ||
    (ctx.raisedBy as string) ||
    "—";

  const timeLabel = (() => {
    if (requestedTime) return requestedTime;
    const dateStr = entry?.creationDate || instanceDetail?.createdAt;
    if (dateStr) {
      const d = dayjs(dateStr);
      if (d.isValid()) return d.fromNow();
    }
    return "—";
  })();

  // Amount
  const resolvedAmount =
    amount !== undefined
      ? amount
      : entry?.amount !== undefined && entry.amount !== 0
        ? entry.amount
        : ctx.amount ?? ctx.totalAmount ?? ctx.originalAmount ?? 0;

  const resolvedCurrency = (
    currency ||
    entry?.currency ||
    (ctx.currency as string) ||
    "USD"
  ).toUpperCase();

  const numAmount = Number(resolvedAmount);
  const formattedAmount =
    resolvedCurrency === "USD"
      ? `$${(isNaN(numAmount) ? 0 : numAmount).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : `${resolvedCurrency} ${(isNaN(numAmount) ? 0 : numAmount).toLocaleString("en-US")}`;

  // Key-Value rows
  const fromDisplay =
    from ||
    [
      entry?.sourceAccountName || (ctx.fromAccountName as string) || (ctx.sourceAccountName as string),
      formatLast4(entry?.sourceAccountNo || (ctx.fromAccountNumber as string) || (ctx.sourceAccountNo as string)),
    ]
      .filter(Boolean)
      .join(" ") ||
    "—";

  const toAccountNo =
    entry?.payToAccountNo ||
    (ctx.payToAccountNo as string) ||
    (ctx.toAccountNumber as string) ||
    "";

  const toName =
    entry?.payToName ||
    (ctx.payToName as string) ||
    (ctx.toAccountName as string) ||
    (ctx.beneficiary as string) ||
    "—";

  const toDisplay =
    to ||
    (toAccountNo && toAccountNo !== "Bakong"
      ? `${toName} — ${formatLast4(toAccountNo)}`
      : toName);

  const referenceDisplay =
    reference ||
    entry?.refNo ||
    entry?.transactionId ||
    instanceDetail?.referenceId ||
    (ctx.referenceId as string) ||
    "—";

  const finalRejectReason =
    explicitRejectReason ||
    (entry?.rejectReason as string) ||
    (instanceDetail?.tasks?.find((t) => t.reason)?.reason as string) ||
    "";

  // Status Badge Configuration
  const statusMeta = (() => {
    if (isApproved) {
      return {
        label: "Approved",
        bg: "#16A34A", // Green
        color: "#FFFFFF",
      };
    }
    if (isRejected) {
      return {
        label: "Rejected",
        bg: "#DC2626", // Red
        color: "#FFFFFF",
      };
    }
    if (isPending) {
      return {
        label: "Awaiting approval",
        bg: "#E28800", // Amber / Orange
        color: "#FFFFFF",
      };
    }
    return {
      label: rawStatus,
      bg: "#64748B",
      color: "#FFFFFF",
    };
  })();

  // Rejection handling
  const handleOpenReject = () => {
    setRejectReasonInput("");
    setRejectTouched(false);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReasonInput.trim()) {
      setRejectTouched(true);
      return;
    }
    const reason = rejectReasonInput.trim();
    setRejectDialogOpen(false);
    await onReject?.(entry, reason);
    onClose();
  };

  // Approval handling -> Fetch QR from API (qrPayload) and alert QR confirmation modal
  const handleOpenApprove = async () => {
    const workflowId = entry?.transactionId || (entry?.id ? String(entry.id) : null);
    if (workflowId) {
      try {
        setQrConfirmOpen(true);
        const result = await raiseApprovalAuthenticator(workflowId).unwrap();
        setAuthenticator(result);
        return;
      } catch (error) {
        showToast("error", toToastError(error, "Could not get authorization QR code"));
        setQrConfirmOpen(false);
        return;
      }
    }
    // Fallback for entries with no workflowId
    await onApprove?.(entry);
    onClose();
  };

  const handleQrAuthorized = async (requestId: string) => {
    setQrConfirmOpen(false);
    setAuthenticator(null);
    await onApprove?.(entry, requestId);
    onClose();
  };

  const handleQrClose = () => {
    setQrConfirmOpen(false);
    setAuthenticator(null);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        slotProps={{
          backdrop: {
            sx: { bgcolor: "rgba(15, 23, 42, 0.4)" },
          },
          paper: {
            sx: {
              width: "100%",
              maxWidth: "440px",
              borderRadius: "20px",
              p: "28px 28px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              bgcolor: "#FFFFFF",
              boxShadow:
                "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              m: 2,
            },
          },
        }}
      >
        {/* Header */}
        <Box>
          <Stack
            direction="row"
            sx={{
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.3,
                }}
              >
                {dialogTitle}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: "#64748B",
                  mt: 0.5,
                  fontWeight: 400,
                }}
              >
                Requested by {requesterName} · {timeLabel}
              </Typography>
            </Box>

            {/* Dynamic Status Pill */}
            <Box
              sx={{
                bgcolor: statusMeta.bg,
                color: statusMeta.color,
                fontSize: 11.5,
                fontWeight: 600,
                px: 1.5,
                py: 0.6,
                borderRadius: "6px",
                letterSpacing: "0.2px",
                whiteSpace: "nowrap",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {statusMeta.label}
            </Box>
          </Stack>
        </Box>

        {/* Amount Section */}
        <Box sx={{ mt: 3, mb: 3 }}>
          <Typography
            sx={{
              fontSize: 12.5,
              color: "#64748B",
              fontWeight: 400,
              mb: 0.5,
            }}
          >
            Amount
          </Typography>
          <Typography
            sx={{
              fontSize: 32,
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
            }}
          >
            <BaseBlurText>{formattedAmount}</BaseBlurText>
          </Typography>
        </Box>

        {/* Detail Rows */}
        <Stack spacing={2} sx={{ mb: 3.5 }}>
          {/* From */}
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography sx={{ fontSize: 13.5, color: "#64748B", fontWeight: 400 }}>
              From
            </Typography>
            <Typography
              sx={{
                fontSize: 13.5,
                color: "#0F172A",
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              {fromDisplay}
            </Typography>
          </Stack>

          {/* To */}
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography sx={{ fontSize: 13.5, color: "#64748B", fontWeight: 400 }}>
              To
            </Typography>
            <Typography
              sx={{
                fontSize: 13.5,
                color: "#0F172A",
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              {toDisplay}
            </Typography>
          </Stack>

          {/* Reference */}
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography sx={{ fontSize: 13.5, color: "#64748B", fontWeight: 400 }}>
              Reference
            </Typography>
            <Typography
              sx={{
                fontSize: 13.5,
                color: "#0F172A",
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              {referenceDisplay}
            </Typography>
          </Stack>

          {/* Rejection Reason (shown if rejected) */}
          {isRejected && finalRejectReason && (
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Typography sx={{ fontSize: 13.5, color: "#DC2626", fontWeight: 400 }}>
                Reason
              </Typography>
              <Typography
                sx={{
                  fontSize: 13.5,
                  color: "#DC2626",
                  fontWeight: 500,
                  textAlign: "right",
                  maxWidth: "70%",
                }}
              >
                {finalRejectReason}
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Dynamic Action Buttons based on status */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center",
            mt: "auto",
            pt: 1,
          }}
        >
          {isPending ? (
            /* Pending: Outlined Reject + Blue Approve */
            <>
              <Button
                variant="outlined"
                onClick={handleOpenReject}
                disabled={isApproving || isRejecting}
                sx={{
                  minWidth: 84,
                  height: 38,
                  px: 2.5,
                  borderColor: "#D1D5DB",
                  color: "#1F2937",
                  bgcolor: "#FFFFFF",
                  borderRadius: "8px",
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: "#EF4444",
                    color: "#DC2626",
                    bgcolor: "#FEF2F2",
                  },
                }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                onClick={handleOpenApprove}
                disabled={isApproving || isRejecting}
                sx={{
                  minWidth: 94,
                  height: 38,
                  px: 2.5,
                  bgcolor: "#1C64B4", // Blue for Approve
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: "#154F91",
                  },
                }}
              >
                {isApproving ? "Approving..." : "Approve"}
              </Button>
            </>
          ) : isApproved ? (
            /* Approved: Close + Dynamic Green Approved Button */
            <>
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  minWidth: 80,
                  height: 38,
                  px: 2.5,
                  borderColor: "#D1D5DB",
                  color: "#1F2937",
                  bgcolor: "#FFFFFF",
                  borderRadius: "8px",
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    borderColor: "#9CA3AF",
                    bgcolor: "#F9FAFB",
                  },
                }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                disabled
                sx={{
                  minWidth: 100,
                  height: 38,
                  px: 3,
                  bgcolor: "#16A34A !important", // Dynamic Green for Approved
                  color: "#FFFFFF !important",
                  borderRadius: "8px",
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  opacity: 1,
                }}
              >
                Approved
              </Button>
            </>
          ) : isRejected ? (
            /* Rejected: Close + Dynamic Red Rejected Button */
            <>
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  minWidth: 80,
                  height: 38,
                  px: 2.5,
                  borderColor: "#D1D5DB",
                  color: "#1F2937",
                  bgcolor: "#FFFFFF",
                  borderRadius: "8px",
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    borderColor: "#9CA3AF",
                    bgcolor: "#F9FAFB",
                  },
                }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                disabled
                sx={{
                  minWidth: 100,
                  height: 38,
                  px: 3,
                  bgcolor: "#DC2626 !important", // Dynamic Red for Rejected
                  color: "#FFFFFF !important",
                  borderRadius: "8px",
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  opacity: 1,
                }}
              >
                Rejected
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                minWidth: 80,
                height: 38,
                px: 2.5,
                borderColor: "#D1D5DB",
                color: "#1F2937",
                bgcolor: "#FFFFFF",
                borderRadius: "8px",
                fontSize: 14,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  borderColor: "#9CA3AF",
                  bgcolor: "#F9FAFB",
                },
              }}
            >
              Close
            </Button>
          )}
        </Stack>
      </Dialog>

      {/* Reject Reason Sub-Dialog */}
      <BaseDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        title="Reason for rejection"
        maxWidth="xs"
        titleSx={{ fontSize: font.size.lg, fontWeight: font.weight.medium }}
        hideActions
        disableBackdropClick={isRejecting}
      >
        <Stack spacing={3}>
          <BaseTextArea
            placeholder="Input reason for rejection..."
            value={rejectReasonInput}
            onChange={(e) => setRejectReasonInput(e.target.value)}
            onBlur={() => setRejectTouched(true)}
            disabled={isRejecting}
            error={rejectTouched && !rejectReasonInput.trim()}
            helperText={
              rejectTouched && !rejectReasonInput.trim()
                ? "A reason is required to reject this transaction."
                : undefined
            }
            minRows={3}
          />
          <Stack direction="row" spacing={1.5}>
            <BaseButton
              title="Cancel"
              variant="outlined"
              fullWidth
              onClick={() => setRejectDialogOpen(false)}
              disabled={isRejecting}
              sx={{
                backgroundColor: "#FFFFFF",
                color: palette.text.primary,
                borderColor: "#ADADAD",
                fontWeight: font.weight.regular,
                "&:hover": { backgroundColor: "#F9FAFB" },
              }}
            />
            <BaseButton
              title="Reject"
              variant="contained"
              fullWidth
              onClick={handleConfirmReject}
              isLoading={isRejecting}
              sx={{
                backgroundColor: palette.danger.main,
                fontWeight: font.weight.regular,
                "&:hover": { backgroundColor: palette.danger[600] },
              }}
            />
          </Stack>
        </Stack>
      </BaseDialog>

      {/* QR Confirmation Modal with qrPayload from API */}
      <QrConfirmationDialog
        open={qrConfirmOpen}
        authenticator={authenticator}
        qrPayload={authenticator?.qrPayload}
        isLoading={isRaisingAuth && !authenticator}
        onClose={handleQrClose}
        onAuthorized={handleQrAuthorized}
        onApprove={() => handleQrAuthorized(authenticator?.requestId || "")}
        onRenew={async () => {
          const workflowId = entry?.transactionId || (entry?.id ? String(entry.id) : null);
          if (!workflowId) return;
          const result = await raiseApprovalAuthenticator(workflowId).unwrap();
          setAuthenticator(result);
          return result;
        }}
        title="Confirmations"
        subtitle="Scan this QR with Bank Mobile App"
      />
    </>
  );
}
