"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { font, palette } from "@/theme/palette";
import BaseIconButton from "@core/components/BaseIconButton";
import BaseToggleSwitch from "@core/components/BaseToggleSwitch";
import BaseTable, { type BaseTableColumn, type BaseTablePagination } from "@core/components/BaseTable";
import { userStatusMeta, type AdminUser, type AdminUserEntry } from "../user.types";

export type UsersTableProps = {
  entries: AdminUserEntry[];
  isLoading: boolean;
  onEdit: (user: AdminUser) => void;
  onActivate: (user: AdminUser) => void;
  onDeactivate: (user: AdminUser) => void;
  /** No delete-user API exists yet — wired for when the backend adds one. */
  onDelete?: (user: AdminUser) => void;
  /** No reset-password API exists yet — wired for when the backend adds one. */
  onReset?: (user: AdminUser) => void;
  pagination?: BaseTablePagination;
  /** Opens the read-only detail panel for the clicked row. */
  onRowClick?: (entry: AdminUserEntry) => void;
  /** Gates the Edit action. Defaults to true. */
  canEdit?: boolean;
  /** Gates the Activate action. Defaults to true. */
  canActivate?: boolean;
  /** Gates the Deactivate action. Defaults to true. */
  canDeactivate?: boolean;
  /** Gates the Delete action. Defaults to true. */
  canDelete?: boolean;
};

/** The row's "⋮" menu — styled with the same bordered rounded icon button. */
function RowActionsMenu({
  user,
  onView,
  onReset,
}: {
  user: AdminUser;
  onView?: () => void;
  onReset?: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
        aria-label={`More actions for ${user.username}`}
        sx={{
          borderRadius: "12px",
          border: `1px solid ${palette.slate[200]}`,
          padding: "8px",
          color: palette.icon.default,
          "&:hover": { backgroundColor: palette.primary[100] },
        }}
      >
        <MoreVertical size={font.size.md} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 160,
              borderRadius: "10px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              border: `1px solid ${palette.slate[200]}`,
              "& .MuiMenuItem-root": {
                fontSize: "14px",
                py: 1,
                px: 2,
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(null);
            onReset?.();
          }}
        >
          Reset
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(null);
            onView?.();
          }}
        >
          View
        </MenuItem>
      </Menu>
    </>
  );
}

export default function UsersTable({
  entries,
  isLoading,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  onReset,
  pagination,
  onRowClick,
  canEdit = true,
  canActivate = true,
  canDeactivate = true,
  canDelete = true,
}: UsersTableProps) {
  const headSx = {
    color: palette.slate[400],
    fontWeight: 400,
    fontSize: "14px",
  };

  const columns: BaseTableColumn<AdminUserEntry>[] = [
    {
      key: "username",
      header: "User Name",
      width: "25%",
      headSx: { ...headSx, pl: { xs: 2, sm: 2.5 } },
      cellSx: { pl: { xs: 2, sm: 2.5 }, py: 2.2 },
      render: ({ user }) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, fontSize: "14px", color: "#0F172A" }}
        >
          {user.fullName || user.username}
        </Typography>
      ),
    },
    {
      key: "userID",
      header: "User ID",
      width: "20%",
      headSx,
      cellSx: { py: 2.2 },
      render: ({ user }) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 400, fontSize: "14px", color: palette.slate[700] }}
        >
          {user.username}
        </Typography>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      width: "25%",
      headSx,
      cellSx: { py: 2.2 },
      render: ({ user }) =>
        user.roles.length ? (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            {user.roles.map((role, index) => (
              <Box
                key={role.id ?? `${role.name}-${index}`}
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 2,
                  py: 1,
                  borderRadius: "6px",
                  bgcolor: palette.slate[100],
                  color: palette.slate[700],
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {role.name}
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" sx={{ color: palette.slate[400], fontSize: "13px" }}>
            None
          </Typography>
        ),
    },
    {
      key: "status",
      header: "Status",
      width: "15%",
      headSx,
      cellSx: { py: 2.2 },
      render: ({ user }) => {
        const isActive = user.status === "ACTIVE";
        const meta = userStatusMeta(user.status);
        return (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              px: 1.5,
              py: 0.5,
              borderRadius: "6px",
              bgcolor: isActive
                ? "#0E7054"
                : user.status === "PENDING_ACTIVATION"
                  ? "#FEF3C7"
                  : user.status === "DEACTIVATED" || user.status === "LOCKED"
                    ? "#FEE2E2"
                    : "#F1F5F9",
              color: isActive
                ? "#FFFFFF"
                : user.status === "PENDING_ACTIVATION"
                  ? "#92400E"
                  : user.status === "DEACTIVATED" || user.status === "LOCKED"
                    ? "#991B1B"
                    : "#475569",
              fontSize: "13px",
              fontWeight: 600,
              lineHeight: 1.4,
              whiteSpace: "nowrap",
            }}
          >
            {meta.label}
          </Box>
        );
      },
    },
     {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (entry) => {
        const { user } = entry;
        const isActive = user.status === "ACTIVE";
        return (
          <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
            {canEdit && <BaseIconButton isBorder icon={<Pencil size={font.size.md} />} tooltip="Edit user" onClick={() => onEdit(user)} aria-label={`Edit ${user.username}`} />}

            {canDelete && (
              <BaseIconButton
                isBorder
                icon={<Trash2 size={font.size.md} />}
                tooltip="Delete user"
                color="error"
                onClick={() => onDelete?.(user)}
                aria-label={`Delete ${user.username}`}
              />
            )}

            {(isActive ? canDeactivate : canActivate) && (
              <BaseToggleSwitch
                checked={isActive}
                onClick={() => (isActive ? onDeactivate(user) : onActivate(user))}
                aria-label={isActive ? `Deactivate ${user.username}` : `Activate ${user.username}`}
                tooltip={isActive ? "Deactivate user" : "Activate user"}
              />
            )}

            <RowActionsMenu user={user} onView={() => onRowClick?.(entry)} onReset={() => onReset?.(user)} />
          </Stack>
        );
      },
    },
  ];

  return (
    <BaseTable
      columns={columns}
      rows={entries}
      getRowKey={(entry) => entry.user.id}
      isLoading={isLoading}
      minWidth={880}
      emptyTitle="No users found"
      emptyDescription="Try a different search, or create a new user."
      pagination={pagination}
      paginationVariant="compact"
      onRowClick={onRowClick}
      rounded={false}
      headerBgColor="transparent"
      headerBorderColor={palette.slate[200]}
      headerTextColor={palette.slate[400]}
      headerBorderTop={false}
    />
  );
}
