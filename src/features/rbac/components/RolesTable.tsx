"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Pencil, PenLine, Trash2 } from "lucide-react";

import BaseIconButton from "@core/components/BaseIconButton";
import BaseTable, { type BaseTableColumn, type BaseTablePagination } from "@core/components/BaseTable";
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
  /** ID of the currently selected role (e.g. when detail side panel is open). */
  selectedRoleId?: string;
};

/**
 * Roles list — styled BaseTable following the clean UI design.
 * Preserves the original event handling and true permission counts.
 */
export default function RolesTable({
  roles,
  isLoading,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  pagination,
  onRowClick,
  selectedRoleId,
}: RolesTableProps) {
  const headSx = {
    color: palette.slate[400],
    fontWeight: 400,
    fontSize: "14px",
  };

  const columns: BaseTableColumn<Role>[] = [
    {
      key: "role",
      header: "Role",
      width: "22%",
      headSx: { ...headSx, pl: { xs: 2, sm: 2.5 } },
      cellSx: { pl: { xs: 2, sm: 2.5 }, py: 2.2 },
      render: (role) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, fontSize: "14px", color: "#0F172A" }}
        >
          {role.name}
        </Typography>
      ),
    },
    {
      key: "permissions",
      header: "Access",
      width: "48%",
      headSx,
      cellSx: { py: 2.2 },
      render: (role) => {
        const codes = role.permissionCodes ?? [];
        const signs = codes.filter((code) => code.endsWith(":APPROVE")).length;
        return (
          <Stack spacing={0.25}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontSize: "14px", color: "#0F172A", lineHeight: 1.4 }}
            >
              {codes.length} {codes.length === 1 ? "permission" : "permissions"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontWeight: 400, fontSize: "13px", color: palette.slate[400], lineHeight: 1.4 }}
            >
              {signs === 0 ? "Signs nothing" : `Signs ${signs}`}
            </Typography>
          </Stack>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      width: "16%",
      headSx,
      cellSx: { py: 2.2 },
      render: (role) => {
        const isApproved = Boolean(role.isApprover);
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
              bgcolor: isApproved ? "#0E7054" : "#F1F5F9",
              color: isApproved ? "#FFFFFF" : "#475569",
              fontSize: "13px",
              fontWeight: 600,
              lineHeight: 1.4,
              whiteSpace: "nowrap",
            }}
          >
            {isApproved ? "Approve" : "Not Approve"}
          </Box>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      width: "14%",
      align: "right",
      headSx: { ...headSx, pr: { xs: 2, sm: 2.5 } },
      cellSx: { pr: { xs: 2, sm: 2.5 }, py: 2.2 },
      render: (role) => (
        <Stack
          direction="row"
          spacing={1.5}
          onClick={(e) => e.stopPropagation()}
          sx={{ justifyContent: "flex-end", alignItems: "center" }}
        >
          {canEdit && (
            <BaseIconButton
              isBorder
              icon={<Pencil size={font.size.md} color={palette.icon.default} />}
              tooltip={role.isSystem ? "System roles can't be edited" : "Edit role access"}
              disabled={role.isSystem}
              onClick={(e) => {
                e?.stopPropagation?.();
                onEdit(role);
              }}
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
              onClick={(e) => {
                e?.stopPropagation?.();
                onDelete(role);
              }}
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
      minWidth={720}
      emptyTitle="No roles found"
      emptyDescription="Try a different search, or create a new role."
      pagination={pagination}
      paginationVariant="compact"
      onRowClick={onRowClick}
      rounded={false}
      getRowSx={(role) =>
        selectedRoleId && role.id === selectedRoleId
          ? { bgcolor: "#F0F7FF", "&:hover": { bgcolor: "#E2EDF9" } }
          : {}
      }
      headerBgColor="transparent"
      headerBorderColor={palette.slate[200]}
      headerTextColor={palette.slate[400]}
      headerBorderTop={false}
    />
  );
}
