"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { NorthEastRounded } from "@mui/icons-material";
import Image from "next/image";

import { font, palette, radius } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseButton from "@core/components/BaseButton";
import BaseDialog from "@core/components/BaseDialog";
import BaseSideDialog from "@core/components/BaseSideDialog";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import BaseTextArea from "@core/form/BaseTextArea";
import { formatDate } from "@/utils/date-time";
import { approvalStatusMeta, type ApprovalEntry } from "../approval.types";

const STATUS_TEXT_COLOR: Record<string, string> = {
  success: palette.success.main,
  warning: palette.warning.main,
  error: palette.danger.main,
  info: palette.info.main,
  default: palette.slate[400],
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        py: 1.5,
        borderBottom: `1px solid ${palette.slate[100]}`,
        gap: 2,
      }}
    >
      <Typography variant="body2" sx={{ color: palette.slate[400], flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600, fontSize: 14, textAlign: "right" }}>{value}</Typography>
    </Stack>
  );
}

function PartyCard({ label, name, account }: { label: string; name: string; account: string }) {
  return (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ color: palette.slate[400] }}>
        {label}
      </Typography>
      <Box sx={{ bgcolor: palette.slate[50], borderRadius: `${radius.lg}px`, px: 2, py: 1.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{name}</Typography>
        <Typography variant="body2" sx={{ color: palette.slate[400], mt: 0.25 }}>
          {account}
        </Typography>
      </Box>
    </Stack>
  );
}

const formatAmount = (amount: number, currency: string) =>
  `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

export type ApprovalDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  entry: ApprovalEntry | null;
  onApprove?: (entry: ApprovalEntry) => void;
  onReject?: (entry: ApprovalEntry, reason: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
};

/** Slide-over triggered by clicking an Approval Lists row — transaction
 *  summary up front, then From/To parties and reference fields, then the
 *  Approve action for entries still pending review. */
export default function ApprovalDetailDialog({
  open,
  onClose,
  entry,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: ApprovalDetailDialogProps) {
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTouched, setRejectTouched] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState(false);

  // Drawer instance is reused across entries — clear the approve flow so a
  // freshly opened entry doesn't inherit the previous one's success screen.
  useEffect(() => {
    if (!open) {
      setApproveConfirmOpen(false);
      setApproveSuccess(false);
    }
  }, [open]);

  if (!entry) return null;

  const statusMeta = approvalStatusMeta(entry.status);
  const isPending = entry.status === "PENDING";
  const amountLabel = formatAmount(entry.amount, entry.currency);

  // Closing a pending entry drops the reviewer out of the approval flow —
  // confirm first so a stray click on the backdrop/X doesn't lose the review.
  const requestClose = () => {
    if (isPending) {
      setConfirmCloseOpen(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setConfirmCloseOpen(false);
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
    onReject?.(entry, rejectReason.trim());
    setRejectDialogOpen(false);
  };

  const rejectReasonInvalid = rejectTouched && !rejectReason.trim();

  // Approve goes through the same mobile-app QR confirmation as other
  // dual-control actions before the entry is actually marked approved.
  const requestApprove = () => {
    setApproveConfirmOpen(true);
  };

  const handleQrApprove = () => {
    setApproveConfirmOpen(false);
    setApproveSuccess(true);
  };

  const handleDoneApprove = () => {
    onApprove?.(entry);
  };

  return (
    <BaseSideDialog
      open={open}
      onClose={requestClose}
      title={approveSuccess ? "Approved" : "Transaction Details"}
      width={500}
      footer={
        isPending ? (
          approveSuccess ? (
            <BaseButton title="Done" fullWidth onClick={handleDoneApprove} />
          ) : (
            <Stack direction="row" spacing={1.5}>
              <BaseButton
                title="Reject"
                variant="contained"
                fullWidth
                onClick={requestReject}
                disabled={isApproving || isRejecting}
                sx={{
                  backgroundColor: palette.danger.main,
                  "&:hover": { backgroundColor: palette.danger[600] },
                }}
              />
              <BaseButton
                title="Approved"
                fullWidth
                onClick={requestApprove}
                isLoading={isApproving}
                disabled={isRejecting}
              />
            </Stack>
          )
        ) : undefined
      }
    >
      <BaseDialog
        open={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        title="Close without approving?"
        confirmTitle="Close"
        confirmColor="error"
        cancelTitle="Keep reviewing"
        onConfirm={handleConfirmClose}
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          This transaction is still pending. Are you sure you want to close without approving it?
        </Typography>
      </BaseDialog>

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

      <QrConfirmationDialog open={approveConfirmOpen} onApprove={handleQrApprove} />

      {approveSuccess ? (
        <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", py: 3 }}>
          <Image src="/assets/icons/Ico.svg" alt="Success" width={40} height={40} />
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: palette.slate[500] }}>
            Submitted
          </Typography>

          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "center", width: "100%", py: 1 }}
          >
            <IconChip
              icon={<Image src="/assets/icons/send-to-mobile.svg" alt="" width={28} height={28} />}
            />
            <Box sx={{ position: "relative", flex: 1, maxWidth: 72, mx: 1.5 }}>
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  borderTopWidth: 2,
                  borderTopStyle: "dashed",
                  borderTopColor: palette.navy[800],
                  transform: "translateY(-50%)",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: -1,
                  transform: "translateY(-50%)",
                  width: 0,
                  height: 0,
                  borderTop: "4px solid transparent",
                  borderBottom: "4px solid transparent",
                  borderLeft: `6px solid ${palette.navy[800]}`,
                }}
              />
            </Box>
            <IconChip
              icon={<Image src="/assets/icons/wallet-cards.svg" alt="" width={28} height={28} />}
            />
          </Stack>

          <Typography variant="h6">Submitted and pending to be authorized</Typography>
          <Typography variant="body2" sx={{ color: palette.slate[400] }}>
            This instruction has been successfully submitted and put in a queue for authorization.
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center", py: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                bgcolor: palette.danger.bg,
                color: palette.danger.main,
              }}
            >
              <NorthEastRounded sx={{ fontSize: 22 }} />
            </Box>

            <Typography sx={{ fontSize: 14, fontWeight: 600, color: palette.slate[400] }}>
              {entry.transactionType}
            </Typography>

            <Typography sx={{ fontSize: 26, fontWeight: 700 }}>
              <BaseBlurText>{amountLabel}</BaseBlurText>
            </Typography>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: palette.slate[400] }}>
                {formatDate(entry.creationDate, "DD MMM YYYY, hh:mm A")}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: STATUS_TEXT_COLOR[statusMeta.color] ?? STATUS_TEXT_COLOR.default,
                }}
              >
                {statusMeta.label}
              </Typography>
            </Stack>
          </Stack>

          <PartyCard label="From" name={entry.sourceAccountName} account={entry.sourceAccountNo} />
          <PartyCard label="To" name={entry.payToName} account={entry.payToAccountNo} />

          <Stack spacing={0.5}>
            <Row label="Transaction ID" value={entry.transactionId} />
            <Row label="Reference No." value={entry.refNo} />
            <Row label="Remark" value={entry.transactionType} />
            <Row label="Debit From Account" value={<BaseBlurText>{amountLabel}</BaseBlurText>} />
            <Row label="Rejection Reason" value={entry.rejectReason} />
          </Stack>
        </Stack>
      )}
    </BaseSideDialog>
  );
}

function IconChip({ icon }: { icon: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: `${radius.lg}px`,
        bgcolor: palette.info[50],
        color: palette.primary[50],
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
  );
}
