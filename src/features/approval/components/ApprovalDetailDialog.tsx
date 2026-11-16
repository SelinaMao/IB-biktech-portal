"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { font, palette } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseButton from "@core/components/BaseButton";
import BaseDialog from "@core/components/BaseDialog";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import BaseTextArea from "@core/form/BaseTextArea";
import { approvalStatusMeta, type ApprovalEntry } from "../approval.types";
import { showToast } from "@core/components/AppToast";
import { useGetInstanceQuery, useRaiseApprovalAuthenticatorMutation } from "@/features/workflow";
import type { AuthenticatorRequest } from "@/features/authenticator";
import { toToastError } from "@/utils/api-error";

dayjs.extend(relativeTime);

export type ApprovalDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  entry: ApprovalEntry | null;
  onApprove?: (entry: ApprovalEntry, authenticatorRequestId?: string) => void;
  onReject?: (entry: ApprovalEntry, reason: string) => void;
  onCancel?: (entry: ApprovalEntry) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  isCancelling?: boolean;
  canCancel?: boolean;
  canAct?: boolean;
};

function formatLast4(acc?: string | null) {
  if (!acc) return "";
  const cleaned = acc.replace(/\D/g, "");
  return cleaned.length >= 4 ? `•••• ${cleaned.slice(-4)}` : acc;
}

export default function ApprovalDetailDialog({
  open,
  onClose,
  entry,
  onApprove,
  onReject,
  onCancel,
  isApproving = false,
  isRejecting = false,
  isCancelling = false,
  canCancel,
  canAct,
}: ApprovalDetailDialogProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTouched, setRejectTouched] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [qrConfirmOpen, setQrConfirmOpen] = useState(false);
  const [authenticator, setAuthenticator] = useState<AuthenticatorRequest | null>(null);
  const [raiseApprovalAuthenticator, { isLoading: isRaisingAuth }] = useRaiseApprovalAuthenticatorMutation();

  useEffect(() => {
    if (!open) {
      setQrConfirmOpen(false);
      setAuthenticator(null);
      setRejectDialogOpen(false);
      setRejectReason("");
      setRejectTouched(false);
      setCancelDialogOpen(false);
    }
  }, [open]);

  const instanceId = entry?.transactionId || entry?.id;
  const { data: instanceDetail } = useGetInstanceQuery(instanceId ?? "", {
    skip: !open || !instanceId,
  });
  const ctx = (instanceDetail?.context as Record<string, unknown> | undefined) || {};

  if (!entry) return null;

  const statusMeta = approvalStatusMeta(entry.status);
  const isPending = entry.status === "PENDING";

  const resolvedAmount =
    entry.amount || Number(ctx.amount ?? ctx.totalAmount ?? ctx.originalAmount ?? 0);
  const resolvedCurrency = (entry.currency || (ctx.currency as string) || "USD").toUpperCase();

  const formattedAmount =
    resolvedCurrency === "USD"
      ? `$${resolvedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${resolvedCurrency} ${resolvedAmount.toLocaleString("en-US")}`;

  const fromDisplay =
    [
      entry.sourceAccountName || (ctx.fromAccountName as string) || (ctx.sourceAccountName as string),
      formatLast4(entry.sourceAccountNo || (ctx.fromAccountNumber as string) || (ctx.sourceAccountNo as string)),
    ]
      .filter(Boolean)
      .join(" ") || "—";

  const toAccountNo =
    entry.payToAccountNo || (ctx.payToAccountNo as string) || (ctx.toAccountNumber as string) || "";
  const toName =
    entry.payToName || (ctx.payToName as string) || (ctx.toAccountName as string) || (ctx.beneficiary as string) || "—";

  const toDisplay =
    toAccountNo && toAccountNo !== "Bakong"
      ? `${toName} ${formatLast4(toAccountNo)}`
      : toName;

  const referenceDisplay =
    entry.refNo || entry.transactionId || instanceDetail?.referenceId || (ctx.referenceId as string) || "—";

  const requesterName = entry.requestedBy || (ctx.raisedBy as string) || "Requester";
  const timeLabel = entry.creationDate || instanceDetail?.createdAt
    ? dayjs(entry.creationDate || instanceDetail?.createdAt).fromNow()
    : "";
  const subtitle = timeLabel ? `Requested by ${requesterName} · ${timeLabel}` : `Requested by ${requesterName}`;

  const handleOpenCancel = () => {
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    if (onCancel && entry) {
      onCancel(entry);
    } else if (onReject && entry) {
      onReject(entry, "Cancelled by user");
    }
    onClose();
  };

  const requestReject = () => {
    setRejectReason("");
    setRejectTouched(false);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectTouched(true);
      return;
    }
    const reason = rejectReason.trim();
    setRejectDialogOpen(false);
    onReject?.(entry, reason);
    onClose();
  };

  const rejectReasonInvalid = rejectTouched && !rejectReason.trim();

  const requestApprove = async () => {
    if (entry?.transactionId) {
      try {
        setQrConfirmOpen(true);
        const result = await raiseApprovalAuthenticator(entry.transactionId).unwrap();
        setAuthenticator(result);
        return;
      } catch (error) {
        showToast("error", toToastError(error, "Could not get authorization QR code"));
        setQrConfirmOpen(false);
        return;
      }
    }
    onApprove?.(entry);
    onClose();
  };

  const handleQrAuthorized = (requestId: string) => {
    setQrConfirmOpen(false);
    setAuthenticator(null);
    onApprove?.(entry, requestId);
    onClose();
  };

  const canCancelAllowed = canCancel !== undefined ? canCancel : Boolean(onCancel || onReject);
  const canApproveAllowed = canAct !== undefined ? canAct : Boolean(onApprove);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: "440px",
            maxWidth: "440px",
            height: "357px",
            maxHeight: "357px",
            borderRadius: "16px",
            p: "24px 28px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            bgcolor: "#FFFFFF",
            boxShadow:
              "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            m: 2,
          },
        }}
      >
        {/* Header */}
        <Box>
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1.3,
              }}
            >
              {entry.transactionType || "Outgoing transfer"}
            </Typography>
            <Box
              sx={{
                bgcolor: isPending
                  ? "#E28800"
                  : statusMeta.color === "success"
                    ? "#16A34A"
                    : statusMeta.color === "error"
                      ? "#DC2626"
                      : "#6B7280",
                color: "#000000",
                fontSize: 11,
                fontWeight: 500,
                px: 1.5,
                py: 1,
                borderRadius: "6px",
                letterSpacing: "0.2px",
                whiteSpace: "nowrap",
              }}
            >
              {isPending ? "Awaiting approval" : statusMeta.label}
            </Box>
          </Stack>
          <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 1.5 }}>
            {subtitle}
          </Typography>
        </Box>

        {/* Amount Section */}
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontSize: 12, color: "#6B7280", fontWeight: 400, mb: 0.5 }}>
            Amount
          </Typography>
          <Typography
            sx={{
              fontSize: 32,
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
            }}
          >
            <BaseBlurText>{formattedAmount}</BaseBlurText>
          </Typography>
        </Box>

        {/* Detail Rows */}
        <Stack spacing={2.5} sx={{ mt: 5 }}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography sx={{ fontSize: 13, color: "#6B7280", fontWeight: 400 }}>
              From
            </Typography>
            <Typography
              sx={{ fontSize: 13, color: "#111827", fontWeight: 600, textAlign: "right" }}
            >
              {fromDisplay}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography sx={{ fontSize: 13, color: "#6B7280", fontWeight: 400 }}>
              To
            </Typography>
            <Typography
              sx={{ fontSize: 13, color: "#111827", fontWeight: 600, textAlign: "right" }}
            >
              {toDisplay}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography sx={{ fontSize: 13, color: "#6B7280", fontWeight: 400 }}>
              Reference
            </Typography>
            <Typography
              sx={{ fontSize: 13, color: "#111827", fontWeight: 600, textAlign: "right" }}
            >
              {referenceDisplay}
            </Typography>
          </Stack>
        </Stack>

        {/* Action Buttons */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ justifyContent: "flex-end", mt: "auto", pt: 1 }}
        >
          {isPending ? (
            <>
              {canCancelAllowed && (
                <Button
                  variant="outlined"
                  onClick={handleOpenCancel}
                  disabled={isApproving || isCancelling || isRejecting}
                  sx={{
                    minWidth: 120,
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
                      borderColor: "#EF4444",
                      color: "#DC2626",
                      bgcolor: "#FEF2F2",
                    },
                  }}
                >
                  {isCancelling ? "Cancelling..." : "Cancel request"}
                </Button>
              )}
              {canApproveAllowed && (
                <Button
                  variant="contained"
                  onClick={requestApprove}
                  disabled={isApproving || isCancelling || isRejecting}
                  sx={{
                    minWidth: 90,
                    height: 38,
                    px: 2.5,
                    bgcolor: "#2764A5",
                    color: "#FFFFFF",
                    borderRadius: "8px",
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#1E5186",
                    },
                  }}
                >
                  {isApproving ? "Approving..." : "Approve"}
                </Button>
              )}
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

      {/* Reject Reason Dialog */}
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
            placeholder="Input Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            onBlur={() => setRejectTouched(true)}
            disabled={isRejecting}
            error={rejectReasonInvalid}
            helperText={rejectReasonInvalid ? "A reason is required." : undefined}
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
                "&:hover": { backgroundColor: "#FFFFFF" },
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

      {/* Cancel Request Confirmation Sub-Dialog */}
      <BaseDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Cancel Request"
        maxWidth="xs"
      >
        <Stack spacing={2.5}>
          <Typography sx={{ fontSize: 14, color: "#64748B", lineHeight: 1.5 }}>
            Are you sure you want to cancel this request? Any pending approvals will be stopped.
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end", pt: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
              sx={{
                minWidth: 90,
                height: 38,
                px: 2,
                borderColor: "#D1D5DB",
                color: "#1F2937",
                borderRadius: "8px",
                fontSize: 14,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              No, keep it
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              sx={{
                minWidth: 120,
                height: 38,
                px: 2.5,
                bgcolor: "#DC2626",
                color: "#FFFFFF",
                borderRadius: "8px",
                fontSize: 14,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": { bgcolor: "#B91C1C" },
              }}
            >
              {isCancelling ? "Cancelling…" : "Cancel request"}
            </Button>
          </Stack>
        </Stack>
      </BaseDialog>

      {/* QR Confirmation Modal with qrPayload from API */}
      <QrConfirmationDialog
        open={qrConfirmOpen}
        authenticator={authenticator}
        qrPayload={authenticator?.qrPayload}
        isLoading={isRaisingAuth && !authenticator}
        onClose={() => {
          setQrConfirmOpen(false);
          setAuthenticator(null);
        }}
        onAuthorized={handleQrAuthorized}
        onApprove={() => handleQrAuthorized(authenticator?.requestId || "")}
        onRenew={async () => {
          if (!entry?.transactionId) return;
          const result = await raiseApprovalAuthenticator(entry.transactionId).unwrap();
          setAuthenticator(result);
          return result;
        }}
        title="Confirmations"
        subtitle="Scan this QR with Bank Mobile App"
      />
    </>
  );
}
