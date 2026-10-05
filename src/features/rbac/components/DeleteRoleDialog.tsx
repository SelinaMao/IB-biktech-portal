"use client";

import Typography from "@mui/material/Typography";

import { showToast } from "@core/components/AppToast";
import BaseDialog from "@core/components/BaseDialog";

import { useDeleteRoleMutation } from "../rbac.api";
import { toToastError } from "@/utils/api-error";
import type { Role } from "../rbac.types";

export type DeleteRoleDialogProps = {
  open: boolean;
  role: Role | null;
  onClose: () => void;
};

/**
 * Destructive confirm for deleting a role. System roles never reach here — the
 * table hides the delete action for them.
 */
export default function DeleteRoleDialog({
  open,
  role,
  onClose,
}: DeleteRoleDialogProps) {
  const [deleteRole, { isLoading }] = useDeleteRoleMutation();

  const handleConfirm = async () => {
    if (!role) return;
    try {
      await deleteRole(role.id).unwrap();
      showToast("success", {
        title: "Role deleted",
        message: `${role.name} has been removed.`,
      });
      onClose();
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't delete role"));
    }
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Delete role"
      confirmTitle="Delete"
      confirmColor="error"
      onConfirm={handleConfirm}
      isLoading={isLoading}
      disableBackdropClick
    >
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Are you sure you want to delete{" "}
        <Typography component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
          {role?.name}
        </Typography>
        ? Any users assigned this role will lose the permissions it grants. This
        action cannot be undone.
      </Typography>
    </BaseDialog>
  );
}
