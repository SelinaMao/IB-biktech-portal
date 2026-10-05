"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PenLine, Trash2 } from "lucide-react";

import BaseIconButton from "@core/components/BaseIconButton";
import BaseTable, { type BaseTableColumn, type BaseTablePagination } from "@core/components/BaseTable";
import { baseTableHeaderTextSx } from "@core/components/BaseTableHeader";
import { font, palette } from "@/theme/palette";
import type { Role } from "../rbac.types";

export type RolesTableProps = {
  roles: Role[];
  isLoading: boolean;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  /** Each action asks for the permission its own endpoint enforces, not one flag for all three. */
  canEdit?: boolean;
  canDelete?: boolean;
  pagination?: BaseTablePagination;
  /** Opens the read-only detail panel for the clicked row. */
  onRowClick?: (role: Role) => void;
};

/**
 * Roles list — thin column config over the shared BaseTable (no bespoke table
 * markup). System roles have their edit/delete actions disabled.
 */
export default function RolesTable({ roles, isLoading, onEdit, onDelete, canEdit = false, canDelete = false, pagination, onRowClick }: RolesTableProps) {
  const columns: BaseTableColumn<Role>[] = [
    {
      key: "role",
      header: "Role Name",
      render: (role) => (
        <>
          <Typography variant="body2" sx={baseTableHeaderTextSx}>
            {role.name}
          </Typography>
        </>
      ),
    },
    {
      key: "permissions",
      header: "Access",
      render: (role) => {
        // Approve is a verb, so what a role signs is counted from its grants — never a stored flag.
        const signs = role.permissionCodes.filter((code) => code.endsWith(":APPROVE")).length;
        return (
          <Stack>
            <Typography variant="body2">{role.permissionCodes.length} permissions</Typography>
            <Typography variant="caption" color="text.secondary">
              {signs === 0 ? "Signs nothing" : `Signs ${signs}`}
            </Typography>
          </Stack>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (role) => {
        return role.isApprover ? "Approve" : "Not Approve";
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (role) => (
        <Stack direction="row" spacing={2} onClick={(e) => e.stopPropagation()} sx={{ justifyContent: "flex-end" }}>
          {canEdit && (
            <BaseIconButton
              isBorder
              icon={<PenLine size={font.size.md} color={palette.icon.default} />}
              // The tooltip claimed system roles were uneditable while the button still fired.
              tooltip={role.isSystem ? "System roles can't be edited" : "Edit role access"}
              disabled={role.isSystem}
              onClick={() => onEdit(role)}
              aria-label={`Edit ${role.name}`}
            />
          )}

          {canDelete && (
            <BaseIconButton
              isBorder
              icon={<Trash2 size={font.size.md} color={palette.danger.main} />}
              tooltip={role.isSystem ? "System roles can't be deleted" : "Delete role"}
              color="error"
              disabled={role.isSystem}
              onClick={() => onDelete(role)}
              aria-label={`Delete ${role.name}`}
            />
          )}
        </Stack>
      ),
    },
  ];

  return (
    <BaseTable
      columns={columns}
      rows={roles}
      getRowKey={(role) => role.id}
      isLoading={isLoading}
      minWidth={1040}
      emptyTitle="No roles found"
      emptyDescription="Try a different search, or create a new role."
      pagination={pagination}
      onRowClick={onRowClick}
      rounded={true}
      headerBgColor={palette.slate[50]}
      headerBorderColor={palette.slate[200]}
      headerTextColor={palette.slate[400]}
    />
  );
}
