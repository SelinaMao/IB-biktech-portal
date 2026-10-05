"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import BaseActionBar from "@core/components/BaseActionBar";
import BaseButton from "@core/components/BaseButton";
import BaseCard from "@core/components/BaseCard";
import BaseDialog from "@core/components/BaseDialog";
import BaseListSection from "@core/components/BaseListSection";
import BaseTable from "@core/components/BaseTable";
import BaseTitle from "@core/components/BaseTitle";
import { showToast } from "@core/components/AppToast";
import type { BaseTableColumn } from "@core/types/BaseTable.types";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { useListUsersQuery } from "@/features/user";
import {
  ApproverGroupDialog,
  GroupMembersDialog,
  useDeleteApproverGroupMutation,
  useListApproverGroupsQuery,
  useListEligibleApproversQuery,
  type ApproverGroup,
  type EligibleApprover,
} from "@/features/workflow";
import { toToastError } from "@/utils/api-error";

const PAGE_SIZE = 200;

export default function ApprovalApproversPage() {
  const canViewUsers = useCan(CLIENT_PERMISSIONS.USER.VIEW);
  const canViewGroups = useCan(CLIENT_PERMISSIONS.APPROVER_GROUP.VIEW);
  const canCreateGroups = useCan(CLIENT_PERMISSIONS.APPROVER_GROUP.CREATE);
  const canEditGroups = useCan(CLIENT_PERMISSIONS.APPROVER_GROUP.UPDATE);
  const canDeleteGroups = useCan(CLIENT_PERMISSIONS.APPROVER_GROUP.DELETE);

  const [tab, setTab] = useState(0);
  const [membersTarget, setMembersTarget] = useState<ApproverGroup | null>(null);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ApproverGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApproverGroup | null>(null);
  const [deleteGroup, deleteState] = useDeleteApproverGroupMutation();

  // No function means the whole pool: everyone whose role grants Approve on anything.
  const approvers = useListEligibleApproversQuery({});
  const groups = useListApproverGroupsQuery(undefined, { skip: !canViewGroups });
  const users = useListUsersQuery({ page: 0, size: PAGE_SIZE }, { skip: !canViewUsers });

  /**
   * A group stores ids; the server does not send names with them. Anyone who has since lost the
   * Approve verb is no longer in the approver list, so the id is shown rather than dropping a
   * member silently — the count would otherwise disagree with what a rule will ask for.
   */
  const nameOf = (userId: string) => {
    const person = (approvers.data ?? []).find((entry) => entry.userId === userId);
    return person ? person.fullName || person.username : userId;
  };

  const roleByUserId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const entry of users.data?.content ?? []) {
      map.set(entry.user.id, entry.user.roles.map((role) => role.name));
    }
    return map;
  }, [users.data]);

  const people = useMemo(
    () =>
      (approvers.data ?? []).map((person) => ({
        userId: person.userId,
        name: person.fullName || person.username,
      })),
    [approvers.data],
  );

  const openGroupForm = (group: ApproverGroup | null) => {
    setEditingGroup(group);
    setGroupFormOpen(true);
  };

  const confirmDeleteGroup = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGroup(deleteTarget.id).unwrap();
      showToast("success", {
        title: "Group removed",
        message: "Any rule that named it can no longer resolve approvers — check your rules.",
      });
      setDeleteTarget(null);
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't remove the group"));
    }
  };

  const approverColumns: BaseTableColumn<EligibleApprover>[] = [
    {
      key: "person",
      header: "Approver",
      render: (person) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {person.fullName || person.username}
        </Typography>
      ),
    },
    {
      key: "roles",
      header: "Why they can approve",
      render: (person) => {
        const roles = roleByUserId.get(person.userId) ?? [];
        return roles.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            An approving role
          </Typography>
        ) : (
          <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap" }}>
            {roles.map((role) => (
              <Chip key={role} size="small" variant="outlined" label={role} />
            ))}
          </Stack>
        );
      },
    },
  ];

  const groupColumns: BaseTableColumn<ApproverGroup>[] = [
    {
      key: "group",
      header: "Group",
      render: (group) => (
        <Stack sx={{ gap: 0.25 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {group.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
            {group.groupKey}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "members",
      header: "Members",
      render: (group) =>
        group.memberIds.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nobody yet — a rule asking for this group cannot start
          </Typography>
        ) : (
          <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap" }}>
            {/* The list order IS the order approvers are asked in, so it is not re-sorted. */}
            {group.memberIds.map((userId, index) => (
              <Chip
                key={userId}
                size="small"
                variant="outlined"
                label={`${index + 1}. ${nameOf(userId)}`}
              />
            ))}
          </Stack>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 240,
      render: (group) => (
        <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ gap: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            disabled={!canEditGroups}
            onClick={() => setMembersTarget(group)}
          >
            Set members
          </Button>
          <Tooltip title="Rename">
            <span>
              <IconButton size="small" disabled={!canEditGroups} onClick={() => openGroupForm(group)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Remove group">
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={!canDeleteGroups}
                onClick={() => setDeleteTarget(group)}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <BaseTitle fontSize={24} fontWeight={600}>
          Who can approve
        </BaseTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: "80ch" }}>
          Someone appears here when a role they hold ticks Approve on at least one function. The
          approval rule then decides which of them a request actually needs.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_event, next) => setTab(next)} sx={{ mb: 2 }}>
        <Tab label={`Approvers${approvers.data?.length ? ` (${approvers.data.length})` : ""}`} />
        <Tab label={`Approver groups${groups.data?.length ? ` (${groups.data.length})` : ""}`} />
      </Tabs>

      {tab === 0 && (
        <BaseCard>
          <BaseListSection>
            <Alert severity="info" variant="outlined">
              This list is read from roles. Tick or untick Approve on a function under
              <strong> Roles</strong>, or give the person a different role.
            </Alert>
            <BaseTable
              rows={approvers.data ?? []}
              columns={approverColumns}
              getRowKey={(person) => person.userId}
              isLoading={approvers.isLoading || approvers.isFetching}
              emptyTitle="Nobody can approve yet"
              emptyDescription="Tick Approve on a function in some role, then assign that role to a user."
            />
          </BaseListSection>
        </BaseCard>
      )}

      {tab === 1 && (
        <BaseCard>
          <BaseListSection>
            {!canViewGroups ? (
              <Alert severity="info" variant="outlined">
                You do not have permission to see approver groups.
              </Alert>
            ) : (
              <>
                <BaseActionBar>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    Your organization&apos;s groups. A rule can ask for one instead of naming people.
                  </Typography>
                  {canCreateGroups && (
                    <BaseButton
                      title="New group"
                      variant="contained"
                      startIcon={<AddRoundedIcon />}
                      onClick={() => openGroupForm(null)}
                    />
                  )}
                </BaseActionBar>
                <BaseTable
                  rows={groups.data ?? []}
                  columns={groupColumns}
                  getRowKey={(group) => group.id}
                  isLoading={groups.isLoading || groups.isFetching}
                  minWidth={860}
                  emptyTitle="No approver groups yet"
                  emptyDescription="Create one to reuse a set of people across rules, or leave it and pick people per rule."
                />
              </>
            )}
          </BaseListSection>
        </BaseCard>
      )}

      {membersTarget && (
        <GroupMembersDialog
          group={membersTarget}
          people={people}
          onClose={() => setMembersTarget(null)}
        />
      )}

      {groupFormOpen && (
        <ApproverGroupDialog
          group={editingGroup}
          onClose={() => {
            setGroupFormOpen(false);
            setEditingGroup(null);
          }}
        />
      )}

      {deleteTarget && (
        <BaseDialog
          open
          title="Remove this group?"
          subtitle={deleteTarget.name}
          confirmTitle="Remove"
          confirmColor="error"
          isLoading={deleteState.isLoading}
          onConfirm={confirmDeleteGroup}
          onClose={() => setDeleteTarget(null)}
        >
          <Typography variant="body2">
            Any rule that asks for <strong>{deleteTarget.groupKey}</strong> will no longer resolve
            approvers, and requests matching it will fail to start until you fix the rule.
          </Typography>
        </BaseDialog>
      )}
    </>
  );
}
