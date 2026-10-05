"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import { useMemo, useState } from "react";

import { useDebounce } from "@core/hooks/use-debounce";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import BaseButton from "@core/components/BaseButton";
import { BaseInput } from "@core/form";

import {
  DeleteRoleDialog,
  RolesTable,
  RoleFormDialog,
  RoleDetailForm,
  useListRolesQuery,
  type Role,
} from "@/features/rbac";
import BaseTitle from "@/@core/components/BaseTitle";
import BaseCard from "@/@core/components/BaseCard";
import BaseListSection from "@/@core/components/BaseListSection";
import BaseActionBar from "@/@core/components/BaseActionBar";

const PAGE_SIZE = 10;

export default function RolesPage() {
  // OrgRoleController enforces a different code per verb, so the screen asks the same way.
  // Nothing here was gated before: a corporate user holding only role.view saw Add, Edit and
  // Delete, and every one of them came back 403.
  const canView = useCan(CLIENT_PERMISSIONS.ROLE.VIEW);
  const canCreate = useCan(CLIENT_PERMISSIONS.ROLE.CREATE);
  const canEdit = useCan(CLIENT_PERMISSIONS.ROLE.UPDATE);
  const canDelete = useCan(CLIENT_PERMISSIONS.ROLE.DELETE);

  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 400);

  // Any filter change returns to the first page (server pages are zero-based).
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(0);
  };
  // The server matches the term; `org/roles` has no pagination envelope, so the
  // whole matching list comes back and the page slices it.
  const { data, isLoading, isFetching } = useListRolesQuery(
    { search: search || undefined },
    { skip: !canView },
  );

  const matches = useMemo(() => data ?? [], [data]);
  const roles = useMemo(
    () => matches.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [matches, page],
  );

  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [detailTarget, setDetailTarget] = useState<Role | null>(null);
  // Create and edit share the same drawer/stepper wizard — edit just seeds it
  // from the target role and submits a permission-replace instead of a create.
  const openCreate = () => setCreateOpen(true);
  const openEdit = (role: Role) => setEditTarget(role);
  const closeWizard = () => {
    setCreateOpen(false);
    setEditTarget(null);
  };

  if (!canView) {
    return <Alert severity="error">You do not have permission to view roles.</Alert>;
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <BaseTitle fontSize={24} fontWeight={600}>
          Manage Role
        </BaseTitle>
      </Box>
      <BaseCard >
        <BaseListSection>
          <BaseActionBar>
            <BaseInput
              placeholder="Search roles by name…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {canCreate && (
              <BaseButton
                title="Add Role"
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={openCreate}
              />
            )}
          </BaseActionBar>
          <RolesTable
            roles={roles}
            isLoading={isLoading || isFetching}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            canEdit={canEdit}
            canDelete={canDelete}
            onRowClick={setDetailTarget}
            pagination={{
              count: matches.length,
              page,
              rowsPerPage: PAGE_SIZE,
              onPageChange: setPage,
            }}
          />
        </BaseListSection>
      </BaseCard >
      <DeleteRoleDialog
        open={canDelete && Boolean(deleteTarget)}
        role={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
      <RoleFormDialog
        open={(canCreate && createOpen) || (canEdit && Boolean(editTarget))}
        role={editTarget}
        onClose={closeWizard}
      />
      <RoleDetailForm
        open={Boolean(detailTarget)}
        role={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </>
  );
}
