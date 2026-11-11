"use client";

import { useEffect, useState } from "react";
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

export type ApprovalDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  entry: ApprovalEntry | null;
  onApprove?: (entry: ApprovalEntry) => void;
  onReject?: (entry: ApprovalEntry, reason: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
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
  isApproving = false,
  isRejecting = false,
}: ApprovalDetailDialogProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTouched, setRejectTouched] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setApproveConfirmOpen(false);
      setRejectDialogOpen(false);
    }
  }, [open]);

  if (!entry) return null;

  const statusMeta = approvalStatusMeta(entry.status);
  const isPending = entry.status === "PENDING";

  const formattedAmount =
    entry.currency === "USD"
      ? `$${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${entry.currency} ${entry.amount.toLocaleString("en-US")}`;

  const fromDisplay = entry.sourceAccountNo
    ? `${entry.sourceAccountName || "Operating"} ${formatLast4(entry.sourceAccountNo)}`
    : entry.sourceAccountName || "Operating •••• 4821";

  const toDisplay =
    entry.payToAccountNo && entry.payToAccountNo !== "Bakong"
      ? `${entry.payToName} ${formatLast4(entry.payToAccountNo)}`
      : entry.payToName || "—";

  const referenceDisplay = entry.refNo || entry.transactionId || "INV-2026-0912";

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
    onReject?.(entry, rejectReason.trim());
    setRejectDialogOpen(false);
    onClose();
  };

  const rejectReasonInvalid = rejectTouched && !rejectReason.trim();

  const requestApprove = () => {
    setApproveConfirmOpen(true);
  };

  const handleQrApprove = () => {
    setApproveConfirmOpen(false);
    onApprove?.(entry);
    onClose();
  };

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
            Requested by Dara Kim · 10 min ago
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
              <Button
                variant="outlined"
                onClick={requestReject}
                disabled={isApproving || isRejecting}
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
                Reject
              </Button>
              <Button
                variant="contained"
                onClick={requestApprove}
                disabled={isApproving || isRejecting}
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
                Approve
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

      {/* QR Confirmation for Approve */}
      <QrConfirmationDialog open={approveConfirmOpen} onApprove={handleQrApprove} />
    </>
  );
}
