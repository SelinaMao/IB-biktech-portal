"use client";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import BaseDialog from "@core/components/BaseDialog";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import { showToast } from "@core/components/AppToast";
import type { AuthenticatorRequest } from "@/features/authenticator";
import { toToastError } from "@/utils/api-error";

import {
  useRequestApproverGroupChangeAuthenticatorMutation,
  useSetGroupMembersMutation,
} from "../workflow.api";
import type { ApproverGroup, ApproverGroupChangeResponse } from "../workflow.types";

type Person = { userId: string; name: string };

type Props = {
  group: ApproverGroup;
  people: Person[];
  onClose: () => void;
};

/** Who is in one of the bank's approver groups, and in what order they are asked. */
export default function GroupMembersDialog({ group, people, onClose }: Props) {
  const [setMembers, state] = useSetGroupMembersMutation();
  const [requestChangeAuth] = useRequestApproverGroupChangeAuthenticatorMutation();

  // Stored order is the order approvers are asked in, so it is kept as it comes back. A member
  // who has since lost the Approve verb is not in `people` any more; showing the id keeps them
  // visible and removable rather than dropping them on the next save.
  const [picked, setPicked] = useState<Person[]>(() =>
    group.memberIds.map((userId) => ({
      userId,
      name: people.find((person) => person.userId === userId)?.name ?? userId,
    })),
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changeId, setChangeId] = useState<string | null>(null);
  const [authenticator, setAuthenticator] = useState<AuthenticatorRequest | null>(null);
  const [qrPayload, setQrPayload] = useState<string | undefined>(undefined);
  const [isFetchingAuth, setIsFetchingAuth] = useState(false);

  const save = async () => {
    try {
      const res = (await setMembers({
        groupId: group.id,
        name: group.name,
        userIds: picked.map((person) => person.userId),
      }).unwrap()) as ApproverGroup | ApproverGroupChangeResponse;

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

      showToast("success", {
        title: "Members updated",
        message: `${group.name} now has ${picked.length} member${picked.length === 1 ? "" : "s"}.`,
      });
      onClose();
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't update the members"));
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
      title: "Members update submitted",
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
        title={group.name}
        subtitle={`Group key ${group.groupKey}`}
        onClose={onClose}
        confirmTitle="Save members"
        onConfirm={save}
        isLoading={state.isLoading || isFetchingAuth}
      >
        <Stack spacing={1.5}>
          <Alert severity="info" variant="outlined">
            A group narrows a capability pool, it never widens one: a member who does not hold the
            capability for the action being approved is skipped.
          </Alert>

          <Autocomplete
            multiple
            size="small"
            options={people}
            value={picked}
            getOptionLabel={(person) => person.name}
            isOptionEqualToValue={(a, b) => a.userId === b.userId}
            onChange={(_event, next) => setPicked(next)}
            renderTags={(value, getTagProps) =>
              value.map((person, index) => (
                <Chip
                  size="small"
                  label={`${index + 1}. ${person.name}`}
                  {...getTagProps({ index })}
                  key={person.userId}
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label="Members" placeholder="Add someone" />
            )}
          />

          <Typography variant="caption" color="text.secondary">
            The order you pick them is the order they are asked in when a level is sequential.
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
