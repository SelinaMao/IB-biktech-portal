"use client";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import BaseDialog from "@core/components/BaseDialog";
import { showToast } from "@core/components/AppToast";
import { toToastError } from "@/utils/api-error";

import { useSetGroupMembersMutation } from "../workflow.api";
import type { ApproverGroup } from "../workflow.types";

type Person = { userId: string; name: string };

type Props = {
  group: ApproverGroup;
  people: Person[];
  onClose: () => void;
};

/** Who is in one of the bank's approver groups, and in what order they are asked. */
export default function GroupMembersDialog({ group, people, onClose }: Props) {
  const [setMembers, state] = useSetGroupMembersMutation();
  // Stored order is the order approvers are asked in, so it is kept as it comes back. A member
  // who has since lost the Approve verb is not in `people` any more; showing the id keeps them
  // visible and removable rather than dropping them on the next save.
  const [picked, setPicked] = useState<Person[]>(() =>
    group.memberIds.map((userId) => ({
      userId,
      name: people.find((person) => person.userId === userId)?.name ?? userId,
    })),
  );

  const save = async () => {
    try {
      await setMembers({
        groupId: group.id,
        userIds: picked.map((person) => person.userId),
      }).unwrap();
      showToast("success", {
        title: "Members updated",
        message: `${group.name} now has ${picked.length} member${picked.length === 1 ? "" : "s"}.`,
      });
      onClose();
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't update the members"));
    }
  };

  return (
    <BaseDialog
      open
      title={group.name}
      subtitle={`Group key ${group.groupKey}`}
      onClose={onClose}
      confirmTitle="Save members"
      onConfirm={save}
      isLoading={state.isLoading}
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
  );
}
