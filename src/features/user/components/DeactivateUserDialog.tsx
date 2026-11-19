"use client";

import { useState } from "react";

import { showToast } from "@core/components/AppToast";
import BaseDialog from "@core/components/BaseDialog";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import { BaseTextArea } from "@core/form";
import type { AuthenticatorRequest } from "@/features/authenticator/authenticator.types";
import { toToastError } from "@/utils/api-error";

import {
  useDeactivateUserMutation,
  useRequestOrgChangeAuthenticatorMutation,
} from "../user.api";
import type { AdminUser, UserChangeResponse } from "../user.types";

export type DeactivateUserDialogProps = {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
};

/**
 * Deactivate a user with a required reason (captured in the audit trail —
 * see the deactivation metadata on the list response).
 *
 * For dual-control changes, presents QrConfirmationDialog so the maker can
 * confirm the deactivation on mobile before it goes to checker approval.
 */
export default function DeactivateUserDialog({
  open,
  user,
  onClose,
}: DeactivateUserDialogProps) {
  const [deactivateUser, { isLoading }] = useDeactivateUserMutation();
  const [requestOrgChangeAuth] = useRequestOrgChangeAuthenticatorMutation();

  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changeId, setChangeId] = useState<string | null>(null);
  const [authenticator, setAuthenticator] = useState<AuthenticatorRequest | null>(null);
  const [qrPayload, setQrPayload] = useState<string | undefined>(undefined);
  const [isFetchingAuth, setIsFetchingAuth] = useState(false);

  // Reset the fields each time the dialog opens for a new target.
  const desired = open ? (user?.id ?? "open") : "closed";
  const [seededFor, setSeededFor] = useState("closed");
  if (seededFor !== desired) {
    setSeededFor(desired);
    setReason("");
    setTouched(false);
    setConfirmOpen(false);
    setChangeId(null);
    setAuthenticator(null);
    setQrPayload(undefined);
  }

  const handleConfirm = async () => {
    if (!user) return;
    if (!reason.trim()) {
      setTouched(true);
      return;
    }
    try {
      const res = (await deactivateUser({ id: user.id, reason: reason.trim() }).unwrap()) as
        | AdminUser
        | UserChangeResponse;

      const changeRes = res as UserChangeResponse;
      const isAwaiting =
        changeRes?.status === "AWAITING_AUTHORIZATION" ||
        Boolean(changeRes?.authenticator) ||
        Boolean(changeRes?.changeId);

      if (isAwaiting) {
        const cid = changeRes?.changeId ?? null;
        let auth = changeRes?.authenticator ?? null;
        setChangeId(cid);

        if (!auth && cid) {
          setIsFetchingAuth(true);
          try {
            auth = await requestOrgChangeAuth(cid).unwrap();
          } catch (err) {
            console.warn("Could not fetch change authenticator:", err);
          } finally {
            setIsFetchingAuth(false);
          }
        }

        setAuthenticator(auth);
        setQrPayload(auth?.qrPayload ?? undefined);
        setConfirmOpen(true);
        return;
      }

      showToast("success", {
        title: "User deactivated",
        message: `${user.fullName || user.username} can no longer sign in.`,
      });
      handleClose();
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't deactivate user"));
    }
  };

  const handleQrApprove = () => {
    setConfirmOpen(false);
    setAuthenticator(null);
    setQrPayload(undefined);
    setChangeId(null);
    showToast("info", {
      title: "User deactivation submitted",
      message: "Waiting for checker approval. It will take effect once approved.",
    });
    handleClose();
  };

  const handleQrClose = () => {
    setConfirmOpen(false);
  };

  const handleRenew = async () => {
    if (!changeId) return;
    try {
      const result = await requestOrgChangeAuth(changeId).unwrap();
      setAuthenticator(result);
      setQrPayload(result.qrPayload ?? undefined);
      return result;
    } catch (error) {
      console.error("Failed to renew authenticator QR:", error);
    }
  };

  const handleClose = () => {
    setConfirmOpen(false);
    setChangeId(null);
    setAuthenticator(null);
    setQrPayload(undefined);
    setReason("");
    setTouched(false);
    onClose();
  };

  const invalid = touched && !reason.trim();

  return (
    <>
      <BaseDialog
        open={open && !confirmOpen}
        onClose={handleClose}
        title="Deactivate user"
        subtitle={user ? `${user.fullName || user.username} (${user.username})` : undefined}
        confirmTitle="Deactivate"
        confirmColor="error"
        onConfirm={handleConfirm}
        isLoading={isLoading || isFetchingAuth}
        disableBackdropClick
      >
        <BaseTextArea
          label="Reason"
          isRequired
          placeholder="Why is this user being deactivated?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={isLoading || isFetchingAuth}
          error={invalid}
          helperText={invalid ? "A reason is required." : undefined}
          minRows={3}
        />
      </BaseDialog>

      <QrConfirmationDialog
        open={confirmOpen}
        authenticator={authenticator}
        qrPayload={qrPayload}
        requestId={authenticator?.requestId}
        isLoading={isFetchingAuth}
        onClose={handleQrClose}
        onApprove={handleQrApprove}
        onAuthorized={handleQrApprove}
        onConsumed={handleQrApprove}
        onRenew={handleRenew}
        title="Confirm Deactivation on Mobile"
        subtitle="Scan this QR code with your Biktech Mobile App to submit this deactivation for checker approval."
      />
    </>
  );
}
