"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { useDebounce } from "@core/hooks/use-debounce";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import BaseButton from "@core/components/BaseButton";
import { BaseInput } from "@core/form";
import { palette } from "@/theme/palette";

import {
  DeleteRoleDialog,
  RolesTable,
  RoleFormDialog,
  RoleDetailForm,
  useListRolesQuery,
  type Role,
} from "@/features/rbac";

const PAGE_SIZE = 5;

export default function RolesPage() {
  const canView = useCan(CLIENT_PERMISSIONS.ROLE.VIEW);
  const canCreate = useCan(CLIENT_PERMISSIONS.ROLE.CREATE);
  const canEdit = useCan(CLIENT_PERMISSIONS.ROLE.UPDATE);
  const canDelete = useCan(CLIENT_PERMISSIONS.ROLE.DELETE);

  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const search = useDebounce(searchInput, 400);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(0);
  };

  const handleToggleSort = () => {
    setSortAsc((prev) => (prev === null ? true : prev ? false : null));
    setPage(0);
  };

  // Real backend query with search argument
  const { data, isLoading, isFetching } = useListRolesQuery(
    { search: search || undefined },
    { skip: !canView },
  );

  const matches = useMemo(() => {
    const list = data ?? [];
    if (sortAsc === null) return list;
    return [...list].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
  }, [data, sortAsc]);

  const roles = useMemo(
    () => matches.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [matches, page],
  );

  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [detailTarget, setDetailTarget] = useState<Role | null>(null);

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
      <Card
        sx={{
          bgcolor: palette.white,
          borderRadius: "16px",
          border: `1px solid ${palette.slate[200]}`,
          p: { xs: 2.5, sm: 3, md: 3.5 },
          boxShadow: "none",
        }}
      >
        {/* Top Header: Title & New Role Button */}
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
            Role &amp; Permission
          </Typography>

          {canCreate && (
            <BaseButton
              title="New Role"
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

        {/* Roles Table using BaseTable and BasePagination */}
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
      </Card>

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
