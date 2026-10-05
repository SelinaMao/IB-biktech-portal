"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import BaseDialog from "@core/components/BaseDialog";
import BaseInput from "@core/form/BaseInput";
import { showToast } from "@core/components/AppToast";
import { toToastError } from "@/utils/api-error";

import { useCreateApproverGroupMutation, useUpdateApproverGroupMutation } from "../workflow.api";
import type { ApproverGroup } from "../workflow.types";

type Props = {
  group: ApproverGroup | null;
  onClose: () => void;
};

/** Define one of the organization's approver groups, or rename an existing one. */
export default function ApproverGroupDialog({ group, onClose }: Props) {
  const [create, createState] = useCreateApproverGroupMutation();
  const [update, updateState] = useUpdateApproverGroupMutation();

  const [groupKey, setGroupKey] = useState(group?.groupKey ?? "");
  const [name, setName] = useState(group?.name ?? "");
  const [submitted, setSubmitted] = useState(false);

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
      if (group) {
        // Only the name is editable — the key a mandate already names never changes.
        await update({ groupId: group.id, name: body.name }).unwrap();
        showToast("success", { title: "Group renamed", message: body.name });
      } else {
        await create(body).unwrap();
        showToast("success", {
          title: "Group created",
          message: "Add members next — a rule asking for an empty group cannot start.",
        });
      }
      onClose();
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't save the group"));
    }
  };

  return (
    <BaseDialog
      open
      title={group ? "Rename approver group" : "New approver group"}
      subtitle={
        group
          ? "The key stays as it is — your rules reference it."
          : "A reusable set of people a rule can ask for instead of naming individuals."
      }
      onClose={onClose}
      confirmTitle={group ? "Save" : "Create group"}
      onConfirm={save}
      isLoading={createState.isLoading || updateState.isLoading}
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
  );
}
