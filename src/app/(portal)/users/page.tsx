"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import { useMemo, useState } from "react";

import BaseButton from "@core/components/BaseButton";
import BaseCard from "@core/components/BaseCard";
import BaseActionBar from "@core/components/BaseActionBar";
import BaseListSection from "@core/components/BaseListSection";
import BaseTitle from "@core/components/BaseTitle";
import { BaseInput, BaseSelect } from "@core/form";
import { useDebounce } from "@core/hooks/use-debounce";

import {
  UserFormDialog,
  ActivateUserDialog,
  DeactivateUserDialog,
  UserDetailForm,
  UsersTable,
  useListUsersQuery,
  type AdminUser,
} from "@/features/user";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { useRouter } from "next/navigation";
import Typography from "@mui/material/Typography";


const PAGE_SIZE = 20;
const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING_ACTIVATION", label: "Pending activation" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

export default function UsersPage() {

  const router = useRouter();
  const canView = useCan(CLIENT_PERMISSIONS.USER.VIEW);
  const canCreate = useCan(CLIENT_PERMISSIONS.USER.CREATE);
  const canEdit = useCan(CLIENT_PERMISSIONS.USER.UPDATE);
  const canActivate = useCan(CLIENT_PERMISSIONS.USER.UPDATE);
  const canDeactivate = useCan(CLIENT_PERMISSIONS.USER.UPDATE);
  const canUnlock = useCan(CLIENT_PERMISSIONS.USER.UPDATE);
  // Dialog state.
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const search = useDebounce(searchInput, 400);
  const [formOpen, setFormOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);
  const [activateTarget, setActivateTarget] = useState<AdminUser | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null);
  const [detailTarget, setDetailTarget] = useState<AdminUser | null>(null);
  const openCreate = () => {
    setActiveUser(null);
    setFormOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(0);
  };
  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(0);
  };

  const { data, isLoading, isFetching } = useListUsersQuery(
    { page, size: PAGE_SIZE, search: search || undefined, status: status || undefined },

  );

  const entries = useMemo(() => data?.content ?? [], [data]);
  const openEdit = (user: AdminUser) => {
    setActiveUser(user);
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    // Wait out the drawer's close transition before clearing the target.
    setTimeout(() => setActiveUser(null), 200);
  };

  // if (!canView) {
  //   return <Typography color="error">You do not have permission to view users.</Typography>;
  // }
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <BaseTitle fontSize={24} fontWeight={600}>
          Users
        </BaseTitle>
      </Box>

      <BaseCard >
        <BaseListSection>
          <BaseActionBar>
            <BaseInput
              placeholder="Search users by name, email, or role…"
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
            {/* <BaseSelect
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as string)}
              options={STATUS_FILTER_OPTIONS}
              sx={{ minWidth: { sm: 220 } }}
            /> */}
            {canCreate && <BaseButton
              title="Add User"
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={openCreate}
            />}
          </BaseActionBar>

          <UsersTable
            entries={entries}
            isLoading={isLoading || isFetching}
            onEdit={openEdit}
            onActivate={setActivateTarget}
            onDeactivate={setDeactivateTarget}
            canEdit={canEdit}
            canActivate={canActivate}
            canDeactivate={canDeactivate}
            pagination={{
              count: data?.totalElements ?? 0,
              page,
              rowsPerPage: PAGE_SIZE,
              onPageChange: setPage,
            }}
            onRowClick={(entry) => setDetailTarget(entry.user)}
          />
        </BaseListSection>
      </BaseCard>

      <UserFormDialog
        open={formOpen}
        user={activeUser}
        onClose={closeForm}
        canView={canView}
        canEdit={canEdit}
        canDeactivate={canDeactivate}
        canUnlock={canUnlock}
      />
      <UserDetailForm
        open={Boolean(detailTarget)}
        user={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      <ActivateUserDialog
        open={Boolean(activateTarget)}
        user={activateTarget}
        onClose={() => setActivateTarget(null)}
      />

      <DeactivateUserDialog
        open={Boolean(deactivateTarget)}
        user={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
      />

    </>
  );
}
