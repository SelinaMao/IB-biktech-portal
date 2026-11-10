"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import BaseButton from "@core/components/BaseButton";
import BaseDialog from "@core/components/BaseDialog";
import BaseIconButton from "@core/components/BaseIconButton";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import { BaseInput } from "@core/form";
import { useDebounce } from "@core/hooks/use-debounce";
import { showToast } from "@core/components/AppToast";
import { font, palette } from "@/theme/palette";
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

const USERS_PAGE_SIZE = 200;
const PAGE_SIZE = 10;

export default function ApprovalApproversPage() {
  const canViewUsers = useCan(CLIENT_PERMISSIONS.USER.VIEW);
  const canViewGroups = useCan(CLIENT_PERMISSIONS.APPROVER_GROUP.VIEW);
  const canCreateGroups = useCan(CLIENT_PERMISSIONS.APPROVER_GROUP.CREATE);
  const canEditGroups = useCan(CLIENT_PERMISSIONS.APPROVER_GROUP.UPDATE);
  const canDeleteGroups = useCan(CLIENT_PERMISSIONS.APPROVER_GROUP.DELETE);

  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const search = useDebounce(searchInput, 400);

  const [membersTarget, setMembersTarget] = useState<ApproverGroup | null>(null);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ApproverGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApproverGroup | null>(null);
  const [deleteGroup, deleteState] = useDeleteApproverGroupMutation();

  // No function means the whole pool: everyone whose role grants Approve on anything.
  const approvers = useListEligibleApproversQuery({});
  const groups = useListApproverGroupsQuery(undefined, { skip: !canViewGroups });
  const users = useListUsersQuery({ page: 0, size: USERS_PAGE_SIZE }, { skip: !canViewUsers });

  const handleTabChange = (_event: React.SyntheticEvent, next: number) => {
    setTab(next);
    setPage(0);
    setSearchInput("");
    setSortAsc(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(0);
  };

  const handleToggleSort = () => {
    setSortAsc((prev) => (prev === null ? true : prev ? false : null));
    setPage(0);
  };

  /**
   * A group stores ids; the server does not send names with them. Anyone who has since lost the
   * Approve verb is no longer in the approver list, so the id is shown rather than dropping a
   * member silently — the count would otherwise disagree with what a rule will ask for.
   */
  const nameOf = useCallback(
    (userId: string) => {
      const person = (approvers.data ?? []).find((entry) => entry.userId === userId);
      return person ? person.fullName || person.username : userId;
    },
    [approvers.data],
  );

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

  // Filtered & sorted approvers
  const filteredApprovers = useMemo(() => {
    let list = approvers.data ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const name = (p.fullName || p.username).toLowerCase();
        const username = p.username.toLowerCase();
        const userRoles = roleByUserId.get(p.userId) ?? [];
        return (
          name.includes(q) ||
          username.includes(q) ||
          userRoles.some((r) => r.toLowerCase().includes(q))
        );
      });
    }
    if (sortAsc !== null) {
      list = [...list].sort((a, b) => {
        const nameA = a.fullName || a.username;
        const nameB = b.fullName || b.username;
        const cmp = nameA.localeCompare(nameB);
        return sortAsc ? cmp : -cmp;
      });
    }
    return list;
  }, [approvers.data, search, sortAsc, roleByUserId]);

  const paginatedApprovers = useMemo(
    () => filteredApprovers.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredApprovers, page],
  );

  // Filtered & sorted groups
  const filteredGroups = useMemo(() => {
    let list = groups.data ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((g) => {
        const name = g.name.toLowerCase();
        const key = g.groupKey.toLowerCase();
        const members = g.memberIds.some((id) => nameOf(id).toLowerCase().includes(q));
        return name.includes(q) || key.includes(q) || members;
      });
    }
    if (sortAsc !== null) {
      list = [...list].sort((a, b) => {
        const cmp = a.name.localeCompare(b.name);
        return sortAsc ? cmp : -cmp;
      });
    }
    return list;
  }, [groups.data, search, sortAsc, nameOf]);

  const paginatedGroups = useMemo(
    () => filteredGroups.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredGroups, page],
  );

  const headSx = {
    color: palette.slate[400],
    fontWeight: 400,
    fontSize: "14px",
  };

  const approverColumns: BaseTableColumn<EligibleApprover>[] = [
    {
      key: "person",
      header: "Approver",
      width: "35%",
      headSx: { ...headSx, pl: { xs: 2, sm: 2.5 } },
      cellSx: { pl: { xs: 2, sm: 2.5 }, py: 2.2 },
      render: (person) => (
        <Stack spacing={0.25}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, fontSize: "14px", color: "#0F172A" }}
          >
            {person.fullName || person.username}
          </Typography>
          {person.fullName && person.username && (
            <Typography
              variant="caption"
              sx={{ fontWeight: 400, fontSize: "13px", color: palette.slate[400] }}
            >
              {person.username}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      key: "roles",
      header: "Why they can approve",
      width: "65%",
      headSx: { ...headSx, pr: { xs: 2, sm: 2.5 } },
      cellSx: { pr: { xs: 2, sm: 2.5 }, py: 2.2 },
      render: (person) => {
        const roles = roleByUserId.get(person.userId) ?? [];
        return roles.length === 0 ? (
          <Typography variant="caption" sx={{ color: palette.slate[400], fontSize: "13px" }}>
            An approving role
          </Typography>
        ) : (
          <Stack direction="row" spacing={0.5} sx={{ gap: 0.5, flexWrap: "wrap" }}>
            {roles.map((role) => (
              <Box
                key={role}
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "6px",
                  bgcolor: palette.slate[100],
                  color: palette.slate[700],
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {role}
              </Box>
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
      width: "30%",
      headSx: { ...headSx, pl: { xs: 2, sm: 2.5 } },
      cellSx: { pl: { xs: 2, sm: 2.5 }, py: 2.2 },
      render: (group) => (
        <Stack sx={{ gap: 0.25 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, fontSize: "14px", color: "#0F172A" }}
          >
            {group.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontWeight: 400, fontSize: "12px", color: palette.slate[400], fontFamily: "monospace" }}
          >
            {group.groupKey}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "members",
      header: "Members",
      width: "45%",
      headSx,
      cellSx: { py: 2.2 },
      render: (group) =>
        group.memberIds.length === 0 ? (
          <Typography variant="body2" sx={{ color: palette.slate[400], fontSize: "13px" }}>
            Nobody yet — a rule asking for this group cannot start
          </Typography>
        ) : (
          <Stack direction="row" spacing={0.5} sx={{ gap: 0.5, flexWrap: "wrap" }}>
            {/* The list order IS the order approvers are asked in, so it is not re-sorted. */}
            {group.memberIds.map((userId, index) => (
              <Box
                key={userId}
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "6px",
                  bgcolor: palette.slate[100],
                  color: palette.slate[700],
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {index + 1}. {nameOf(userId)}
              </Box>
            ))}
          </Stack>
        ),
    },
    {
      key: "actions",
      header: "Action",
      width: "25%",
      align: "right",
      headSx: { ...headSx, pr: { xs: 2, sm: 2.5 } },
      cellSx: { pr: { xs: 2, sm: 2.5 }, py: 2.2 },
      render: (group) => (
        <Stack
          direction="row"
          spacing={1.5}
          onClick={(e) => e.stopPropagation()}
          sx={{ justifyContent: "flex-end", alignItems: "center" }}
        >
          {canEditGroups && (
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                setMembersTarget(group);
              }}
              sx={{
                height: 32,
                px: 1.5,
                borderRadius: "8px",
                borderColor: palette.slate[200],
                color: palette.slate[700],
                textTransform: "none",
                fontSize: "13px",
                fontWeight: 500,
                "&:hover": {
                  borderColor: palette.slate[300],
                  bgcolor: palette.slate[50],
                },
              }}
            >
              Set members
            </Button>
          )}

          {canEditGroups && (
            <BaseIconButton
              isBorder
              icon={<Pencil size={font.size.md} color={palette.icon.default} />}
              tooltip="Rename group"
              onClick={(e) => {
                e?.stopPropagation?.();
                openGroupForm(group);
              }}
              aria-label={`Rename ${group.name}`}
            />
          )}

          {canDeleteGroups && (
            <BaseIconButton
              isBorder
              icon={<Trash2 size={font.size.md} color={palette.danger.main} />}
              tooltip="Remove group"
              color="error"
              onClick={(e) => {
                e?.stopPropagation?.();
                setDeleteTarget(group);
              }}
              aria-label={`Remove ${group.name}`}
            />
          )}
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Card
        sx={{
          bgcolor: palette.white,
          borderRadius: "16px",
          border: `1px solid ${palette.slate[200]}`,
          p: { xs: 2.5, sm: 3, md: 3.5 },
          boxShadow: "none",
        }}
      >
        {/* Top Header: Title & New Group Button */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "20px", sm: "22px" },
                color: "#0F172A",
                lineHeight: 1.3,
              }}
            >
              Approver
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: palette.slate[500], mt: 0.5, maxWidth: "80ch" }}
            >
              Someone appears here when a role they hold ticks Approve on at least one function. The
              approval rule then decides which of them a request actually needs.
            </Typography>
          </Box>

          {tab === 1 && canCreateGroups && (
            <BaseButton
              title="New Group"
              variant="contained"
              startIcon={<AddRoundedIcon sx={{ fontSize: 20 }} />}
              onClick={() => openGroupForm(null)}
              sx={{
                bgcolor: "#1B5299",
                color: "#FFFFFF",
                borderRadius: "10px",
                height: 40,
                px: 2.5,
                fontSize: "14px",
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#15427C",
                  boxShadow: "none",
                },
              }}
            />
          )}
        </Stack>

        {/* Navigation Tabs */}
        <Tabs
          value={tab}
          onChange={handleTabChange}
          sx={{
            mb: 3,
            borderBottom: `1px solid ${palette.slate[200]}`,
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
              color: palette.slate[500],
              minHeight: 44,
              px: 2,
              "&.Mui-selected": {
                color: "#1B5299",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#1B5299",
              height: 2.5,
              borderRadius: "2px",
            },
          }}
        >
          <Tab
            label={`Approvers${approvers.data?.length ? ` (${approvers.data.length})` : ""}`}
          />
          <Tab
            label={`Approver groups${groups.data?.length ? ` (${groups.data.length})` : ""}`}
          />
        </Tabs>

        {/* Tab 0: Approvers */}
        {tab === 0 && (
          <>
            <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
              This list is read from roles. Tick or untick Approve on a function under
              <strong> Roles</strong>, or give the person a different role.
            </Alert>

            {/* Filter and Action Bar: Search & Sort Button */}
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <BaseInput
                placeholder="Search"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                size="small"
                fullWidth={false}
                sx={{
                  width: { xs: "100%", sm: 260 },
                  "& .MuiOutlinedInput-root": {
                    height: 40,
                    borderRadius: "10px",
                    bgcolor: palette.white,
                    fontSize: "14px",
                    "& fieldset": {
                      borderColor: palette.slate[200],
                    },
                    "&:hover fieldset": {
                      borderColor: palette.slate[300],
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#1B5299",
                    },
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: palette.slate[400], ml: 0.5 }}>
                        <SearchRoundedIcon sx={{ fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                variant="outlined"
                onClick={handleToggleSort}
                endIcon={<ArrowUpDown size={15} />}
                sx={{
                  height: 40,
                  px: 2,
                  borderRadius: "10px",
                  borderColor: palette.slate[200],
                  color: palette.slate[700],
                  bgcolor: palette.white,
                  textTransform: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  "&:hover": {
                    borderColor: palette.slate[300],
                    bgcolor: palette.slate[50],
                  },
                }}
              >
                Sort
              </Button>
            </Stack>

            <BaseTable
              columns={approverColumns}
              rows={paginatedApprovers}
              getRowKey={(person) => person.userId}
              isLoading={approvers.isLoading || approvers.isFetching}
              emptyTitle="Nobody can approve yet"
              emptyDescription="Tick Approve on a function in some role, then assign that role to a user."
              pagination={{
                count: filteredApprovers.length,
                page,
                rowsPerPage: PAGE_SIZE,
                onPageChange: setPage,
              }}
              paginationVariant="compact"
              rounded={false}
              headerBgColor="transparent"
              headerBorderColor={palette.slate[200]}
              headerTextColor={palette.slate[400]}
              headerBorderTop={false}
            />
          </>
        )}

        {/* Tab 1: Approver groups */}
        {tab === 1 && (
          <>
            {!canViewGroups ? (
              <Alert severity="info" variant="outlined">
                You do not have permission to see approver groups.
              </Alert>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: palette.slate[500], mb: 2 }}>
                  Your organization&apos;s groups. A rule can ask for one instead of naming people.
                </Typography>

                {/* Filter and Action Bar: Search & Sort Button */}
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <BaseInput
                    placeholder="Search"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    size="small"
                    fullWidth={false}
                    sx={{
                      width: { xs: "100%", sm: 260 },
                      "& .MuiOutlinedInput-root": {
                        height: 40,
                        borderRadius: "10px",
                        bgcolor: palette.white,
                        fontSize: "14px",
                        "& fieldset": {
                          borderColor: palette.slate[200],
                        },
                        "&:hover fieldset": {
                          borderColor: palette.slate[300],
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#1B5299",
                        },
                      },
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start" sx={{ color: palette.slate[400], ml: 0.5 }}>
                            <SearchRoundedIcon sx={{ fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Button
                    variant="outlined"
                    onClick={handleToggleSort}
                    endIcon={<ArrowUpDown size={15} />}
                    sx={{
                      height: 40,
                      px: 2,
                      borderRadius: "10px",
                      borderColor: palette.slate[200],
                      color: palette.slate[700],
                      bgcolor: palette.white,
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: 500,
                      "&:hover": {
                        borderColor: palette.slate[300],
                        bgcolor: palette.slate[50],
                      },
                    }}
                  >
                    Sort
                  </Button>
                </Stack>

                <BaseTable
                  columns={groupColumns}
                  rows={paginatedGroups}
                  getRowKey={(group) => group.id}
                  isLoading={groups.isLoading || groups.isFetching}
                  minWidth={860}
                  emptyTitle="No approver groups yet"
                  emptyDescription="Create one to reuse a set of people across rules, or leave it and pick people per rule."
                  pagination={{
                    count: filteredGroups.length,
                    page,
                    rowsPerPage: PAGE_SIZE,
                    onPageChange: setPage,
                  }}
                  paginationVariant="compact"
                  rounded={false}
                  headerBgColor="transparent"
                  headerBorderColor={palette.slate[200]}
                  headerTextColor={palette.slate[400]}
                  headerBorderTop={false}
                />
              </>
            )}
          </>
        )}
      </Card>

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
