"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import BaseSideDialog from "@core/components/BaseSideDialog";
import { ControlledBaseInput, ControlledBaseTextArea } from "@core/form";
import { palette } from "@/theme/palette";

import { DEFAULT_VALUES, type Role, type RoleWizardValues } from "../rbac.types";
import FunctionGrid from "./FunctionGrid";
import RoleSelfApprovalField from "./RoleSelfApprovalField";

export type RoleDetailFormProps = {
  open: boolean;
  onClose: () => void;
  role: Role | null;
};

/**
 * Read-only role profile, opened by clicking a row in RolesTable. Reuses the
 * same fields/layout as RoleFormDialog's review step, all disabled, so the
 * view stays in sync with the edit form.
 */
export default function RoleDetailForm({ open, onClose, role }: RoleDetailFormProps) {
  const { control, reset } = useForm<RoleWizardValues>({
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      role
        ? {
            name: role.name,
            description: role.description,
            allowSelfApproval: role.allowSelfApproval ?? false,
          }
        : DEFAULT_VALUES,
    );
  }, [open, role, reset]);

  return (
    <BaseSideDialog open={open} onClose={onClose} title={role?.name ?? "Role"} width={650}>
      <Stack spacing={3}>
        <ControlledBaseInput name="name" control={control} label="Role Name" disabled />
        <ControlledBaseTextArea
          name="description"
          control={control}
          label="Description"
          disabled
          minRows={1}
        />

        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>What this role grants</Typography>
          <Typography sx={{ fontSize: 12, color: palette.slate[400], mb: 1.5 }}>
            One row per function, one tick per verb. Approve sits among them, so what this role
            signs is simply what is ticked.
          </Typography>
          <FunctionGrid
            value={role?.permissionCodes ?? []}
            onChange={() => {}}
            roleId={role?.id}
            disabled
          />
        </Box>

        <RoleSelfApprovalField
          control={control}
          disabled
          signsSomething={(role?.permissionCodes ?? []).some((code) => code.endsWith(":APPROVE"))}
        />
      </Stack>
    </BaseSideDialog>
  );
}
