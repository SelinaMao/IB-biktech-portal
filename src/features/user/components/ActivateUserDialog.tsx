"use client";

import { useState } from "react";

import { showToast } from "@core/components/AppToast";
import BaseDialog from "@core/components/BaseDialog";
import { BaseTextArea } from "@core/form";
import { toToastError } from "@/utils/api-error";

import { useActivateUserMutation } from "../user.api";
import type { AdminUser } from "../user.types";

export type ActivateUserDialogProps = {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
};

/**
 * Activate/reactivate a user with a required reason (captured in the audit
 * trail — see the deactivation metadata on the list response).
 */
export default function ActivateUserDialog({
  open,
  user,
  onClose,
}: ActivateUserDialogProps) {
  const [activateUser, { isLoading }] = useActivateUserMutation();
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  // Reset the field each time the dialog opens for a new target.
  const desired = open ? (user?.id ?? "open") : "closed";
  const [seededFor, setSeededFor] = useState("closed");
  if (seededFor !== desired) {
    setSeededFor(desired);
    setReason("");
    setTouched(false);
  }

  const handleConfirm = async () => {
    if (!user) return;
    if (!reason.trim()) {
      setTouched(true);
      return;
    }
    try {
      await activateUser({ id: user.id, reason: reason.trim() }).unwrap();
      showToast("success", {
        title: "User activated",
        message: `${user.fullName} can now sign in.`,
      });
      onClose();
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't activate user"));
    }
  };

  const invalid = touched && !reason.trim();

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Activate user"
      subtitle={user ? `${user.fullName} (${user.username})` : undefined}
      confirmTitle="Activate"
      confirmColor="success"
      onConfirm={handleConfirm}
      isLoading={isLoading}
      disableBackdropClick
    >
      <BaseTextArea
        label="Reason"
        isRequired
        placeholder="Why is this user being activated?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onBlur={() => setTouched(true)}
        disabled={isLoading}
        error={invalid}
        helperText={invalid ? "A reason is required." : undefined}
        minRows={3}
      />
    </BaseDialog>
  );
}
