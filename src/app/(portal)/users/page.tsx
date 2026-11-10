"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import BaseButton from "@core/components/BaseButton";
import { BaseInput } from "@core/form";
import { useDebounce } from "@core/hooks/use-debounce";
import { palette } from "@/theme/palette";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";

import {
  UserFormDialog,
  ActivateUserDialog,
  DeactivateUserDialog,
  UserDetailForm,
  UsersTable,
  useListUsersQuery,
  type AdminUser,
} from "@/features/user";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const canView = useCan(CLIENT_PERMISSIONS.USER.VIEW);
  const canCreate = useCan(CLIENT_PERMISSIONS.USER.CREATE);
  const canEdit = useCan(CLIENT_PERMISSIONS.USER.UPDATE);
  const canActivate = useCan(CLIENT_PERMISSIONS.USER.UPDATE);
  const canDeactivate = useCan(CLIENT_PERMISSIONS.USER.UPDATE);
  const canUnlock = useCan(CLIENT_PERMISSIONS.USER.UPDATE);

  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
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

  const handleToggleSort = () => {
    setSortAsc((prev) => (prev === null ? true : prev ? false : null));
    setPage(0);
  };

  const { data, isLoading, isFetching } = useListUsersQuery({
    page,
    size: PAGE_SIZE,
    search: search || undefined,
    status: status || undefined,
  });

  const entries = useMemo(() => {
    const list = data?.content ?? [];
    if (sortAsc === null) return list;
    return [...list].sort((a, b) => {
      const nameA = a.user.fullName || a.user.username;
      const nameB = b.user.fullName || b.user.username;
      const cmp = nameA.localeCompare(nameB);
      return sortAsc ? cmp : -cmp;
    });
  }, [data, sortAsc]);

  const openEdit = (user: AdminUser) => {
    setActiveUser(user);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setTimeout(() => setActiveUser(null), 200);
  };

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
        {/* Top Header: Title & Add User Button */}
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
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "20px", sm: "22px" },
              color: "#0F172A",
              lineHeight: 1.3,
            }}
          >
            Users
          </Typography>

          {canCreate && (
            <BaseButton
              title="Add User"
              variant="contained"
              startIcon={<AddRoundedIcon sx={{ fontSize: 20 }} />}
              onClick={openCreate}
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

        {/* Users Table using BaseTable and BasePagination */}
        <UsersTable
          entries={entries}
          isLoading={isLoading || isFetching}
          onEdit={openEdit}
          onActivate={setActivateTarget}
          onDeactivate={setDeactivateTarget}
          canEdit={canEdit}
          canActivate={canActivate}
          canDeactivate={canDeactivate}
          selectedUserId={detailTarget?.id}
          pagination={{
            count: data?.totalElements ?? 0,
            page,
            rowsPerPage: PAGE_SIZE,
            onPageChange: setPage,
          }}
          onRowClick={(entry) => setDetailTarget(entry.user)}
        />
      </Card>

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
