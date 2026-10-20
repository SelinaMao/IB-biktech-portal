"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { font, palette } from "@/theme/palette";
import BaseIconButton from "@core/components/BaseIconButton";
import BaseToggleSwitch from "@core/components/BaseToggleSwitch";
import BaseTable, { type BaseTableColumn, type BaseTablePagination } from "@core/components/BaseTable";
import { baseTableHeaderTextSx } from "@core/components/BaseTableHeader";
import { formatDateTime, getCurrentDateFormat } from "@/utils/date-time";
import type { AdminUser, AdminUserEntry } from "../user.types";
import UserStatusChip from "./UserStatusChip";
import { MoreVertical, PenLine, Trash2 } from "lucide-react";

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

/** The row's "⋮" menu — needs its own anchor state, so it can't live inline in a column render. */
function RowActionsMenu({ user, onView, onReset }: { user: AdminUser; onView?: () => void; onReset?: () => void }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label={`More actions for ${user.username}`}
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
              "& .MuiMenuItem-root": {
                fontSize: font.size.md,
                py: 1.25,
                px: 2,
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onReset?.();
          }}
        >
          Reset----
        </MenuItem>
        <MenuItem
          onClick={() => {
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
  const columns: BaseTableColumn<AdminUserEntry>[] = [
    // {
    //   key: "user",
    //   header: "User",
    //   render: ({ user }) => (
    //     <>
    //       <Typography variant="body2" sx={baseTableHeaderTextSx}>
    //         {user.fullName || user.username}
    //       </Typography>
    //       <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
    //         {user.email}
    //       </Typography>
    //     </>
    //   ),
    // },
    {
      key: "username",
      header: "User Name",
      render: ({ user }) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {user.username}
        </Typography>
      ),
    },
    {
      key: "userID",
      header: "User ID",
      render: ({ user }) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {user.username}
        </Typography>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      render: ({ user }) =>
        user.roles.length ? (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            {user?.roles.map((role, index) => (
              <Typography key={role.id ?? `${role.name}-${index}`}>{role.name}</Typography>
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            None
          </Typography>
        ),
    },

    // {
    //   key: "lastLogin",
    //   header: "Last login",
    //   render: ({ user }) => (
    //     <Typography variant="body2" sx={{ color: "text.secondary" }}>
    //       {user.lastLogin ? formatDateTime(user.lastLogin) : getCurrentDateFormat("DD MMM YYYY, h:mm A")}
    //     </Typography>
    //   ),
    // },
    {
      key: "status",
      header: "Status",
      render: ({ user }) => <UserStatusChip status={user.status} />,
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
            {canEdit && <BaseIconButton isBorder icon={<PenLine size={font.size.md} />} tooltip="Edit user" onClick={() => onEdit(user)} aria-label={`Edit ${user.username}`} />}

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
      onRowClick={onRowClick}
      rounded={true}
      headerBgColor={palette.slate[50]}
      headerBorderColor={palette.slate[200]}
      headerTextColor={palette.slate[400]}
    />
  );
}
