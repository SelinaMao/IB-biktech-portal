"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import BaseDialog from "@core/components/BaseDialog";
import BaseInput from "@core/form/BaseInput";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import { showToast } from "@core/components/AppToast";
import type { AuthenticatorRequest } from "@/features/authenticator";
import { toToastError } from "@/utils/api-error";

import {
  useCreateApproverGroupMutation,
  useRequestApproverGroupChangeAuthenticatorMutation,
  useUpdateApproverGroupMutation,
} from "../workflow.api";
import type { ApproverGroup, ApproverGroupChangeResponse } from "../workflow.types";

type Props = {
  group: ApproverGroup | null;
  onClose: () => void;
};

/** Define one of the organization's approver groups, or rename an existing one. */
export default function ApproverGroupDialog({ group, onClose }: Props) {
  const [create, createState] = useCreateApproverGroupMutation();
  const [update, updateState] = useUpdateApproverGroupMutation();
  const [requestChangeAuth] = useRequestApproverGroupChangeAuthenticatorMutation();

  const [groupKey, setGroupKey] = useState(group?.groupKey ?? "");
  const [name, setName] = useState(group?.name ?? "");
  const [submitted, setSubmitted] = useState(false);

  // Maker-checker mobile confirmation states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changeId, setChangeId] = useState<string | null>(null);
  const [authenticator, setAuthenticator] = useState<AuthenticatorRequest | null>(null);
  const [qrPayload, setQrPayload] = useState<string | undefined>(undefined);
  const [isFetchingAuth, setIsFetchingAuth] = useState(false);

  const keyValid = /^[A-Z][A-Z0-9_]*$/.test(groupKey.trim().toUpperCase());
  const nameValid = name.trim().length > 0;

  const save = async () => {
    setSubmitted(true);
    if (!nameValid || (!group && !keyValid)) return;

    const body = {
      groupKey: (group?.groupKey ?? groupKey).trim().toUpperCase(),
      name: name.trim(),
    };

    try {
      const res = group
        ? ((await update({
            groupId: group.id,
            name: body.name,
            memberIds: group.memberIds ?? [],
          }).unwrap()) as ApproverGroup | ApproverGroupChangeResponse)
        : ((await create(body).unwrap()) as
            | ApproverGroup
            | ApproverGroupChangeResponse);

      const changeRes = res as ApproverGroupChangeResponse;
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
            auth = await requestChangeAuth(cid).unwrap();
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

      if (group) {
        // Only the name is editable — the key a mandate already names never changes.
        showToast("success", { title: "Group renamed", message: body.name });
      } else {
        showToast("success", {
          title: "Group created",
          message: "Add members next — a rule asking for an empty group cannot start.",
        });
      }
      onClose();
    } catch (error) {
      showToast("error", toToastError(error, group ? "Couldn't rename group" : "Couldn't save the group"));
    }
  };

  const handleQrClose = () => {
    setConfirmOpen(false);
  };

  const handleQrApprove = () => {
    setConfirmOpen(false);
    setAuthenticator(null);
    setQrPayload(undefined);
    setChangeId(null);
    showToast("info", {
      title: group ? "Group update submitted" : "Group creation submitted",
      message: "Waiting for checker approval. It will take effect once approved.",
    });
    onClose();
  };

  const handleRenew = async () => {
    if (!changeId) return;
    try {
      const result = await requestChangeAuth(changeId).unwrap();
      setAuthenticator(result);
      setQrPayload(result.qrPayload ?? undefined);
      return result;
    } catch (error) {
      console.error("Failed to renew authenticator QR:", error);
    }
  };

  return (
    <>
      <BaseDialog
        open={!confirmOpen}
        title={group ? "Rename approver group" : "New approver group"}
        subtitle={
          group
            ? "The key stays as it is — your rules reference it."
            : "A reusable set of people a rule can ask for instead of naming individuals."
        }
        onClose={onClose}
        confirmTitle={group ? "Save" : "Create group"}
        onConfirm={save}
        isLoading={createState.isLoading || updateState.isLoading || isFetchingAuth}
      >
        <Stack spacing={2}>
          <BaseInput
            isRequired
            label="Key"
            value={group?.groupKey ?? groupKey}
            disabled={Boolean(group)}
            placeholder="SENIOR_APPROVERS"
            error={submitted && !group && !keyValid}
            helperText="Upper-case letters, digits and underscores. A rule names this, so it never changes."
            onChange={(event) => setGroupKey(event.target.value.toUpperCase())}
          />
          <BaseInput
            isRequired
            label="Name"
            value={name}
            placeholder="Senior approvers"
            error={submitted && !nameValid}
            onChange={(event) => setName(event.target.value)}
          />
          <Typography variant="caption" color="text.secondary">
            A group narrows a capability pool, it never widens one — a member who does not hold the
            capability for the action being approved is skipped.
          </Typography>
        </Stack>
      </BaseDialog>

      <QrConfirmationDialog
        open={confirmOpen}
        authenticator={authenticator}
        qrPayload={qrPayload || (authenticator?.qrPayload ?? undefined)}
        value={
          qrPayload ||
          (authenticator?.qrPayload ?? (changeId ? `approver-group-change:${changeId}` : undefined))
        }
        requestId={authenticator?.requestId || (changeId ?? undefined)}
        isLoading={isFetchingAuth}
        onClose={handleQrClose}
        onApprove={handleQrApprove}
        onAuthorized={handleQrApprove}
        onConsumed={handleQrApprove}
        onRenew={handleRenew}
        title="Confirm on Mobile"
        subtitle="Scan this QR code with your Biktech Mobile App to submit for checker approval."
      />
    </>
  );
}
