"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { showToast } from "@core/components/AppToast";
import BaseButton from "@core/components/BaseButton";
import BaseSideDialog from "@core/components/BaseSideDialog";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import { ControlledBaseInput, ControlledBaseTextArea } from "@core/form";
import { palette } from "@/theme/palette";
import { toToastError } from "@/utils/api-error";

import {
  useCreateRoleMutation,
  useUpdateRolePermissionsMutation,
} from "../rbac.api";
import {
  DEFAULT_VALUES,
  type RoleFormDialogProps,
  type RoleWizardValues,
} from "../rbac.types";
import { roleFormSchema } from "../schema/rbac.schema";
import RoleSelfApprovalField from "./RoleSelfApprovalField";
import FunctionGrid from "./FunctionGrid";
import type { ApprovalAuthority } from "../rbac.types";

const STEPS = ["New", "Review", "Submit"];
const ROLE_FORM_ID = "role-wizard-form";

/** This portal only administers the Corporate channel (see AGENTS.md/CLAUDE.md
 * scope), so Create Role has no channel picker — every role created here is
 * scoped to CORPORATE. */
const ROLE_CHANNEL = "CORPORATE";

export default function RoleFormDialog({ open, onClose, role }: RoleFormDialogProps) {
  const isEdit = Boolean(role);

  const [step, setStep] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [permissionError, setPermissionError] = useState(false);
  const [approvalAuthorities, setApprovalAuthorities] = useState<ApprovalAuthority[]>([]);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updatePermissions, { isLoading: isUpdating }] =
    useUpdateRolePermissionsMutation();
  const isSubmitting = isCreating || isUpdating;

  const { control, handleSubmit, reset, getValues } = useForm<RoleWizardValues>({
    resolver: yupResolver(roleFormSchema),
    mode: "onSubmit",
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
    setPermissionCodes(role?.permissionCodes ?? []);
    setApprovalAuthorities(role?.approvalAuthorities ?? []);
    setPermissionError(false);
    setStep(0);
  }, [open, role, reset]);

  const permissionChannel = role?.channel ?? ROLE_CHANNEL;

  const handlePermissionChange = (next: string[]) => {
    setPermissionCodes(next);
    if (next.length > 0) setPermissionError(false);
  };

  const goToReview = () => {
    if (permissionCodes.length === 0) {
      setPermissionError(true);
      return;
    }
    setStep(1);
  };

  const handleReviewNext = () => {
    if (isEdit && role) {
      updatePermissions({
        id: role.id,
        permissionCodes,
        approvalAuthorities,
        allowSelfApproval: getValues().allowSelfApproval,
      })
        .unwrap()
        .then(() => {
          setConfirmOpen(true);
        })
        .catch((error) => {
          showToast("error", toToastError(error, "Couldn't update permissions"));
        });
      return;
    }

    const values = getValues();
    createRole({
      name: values.name.trim(),
      description: values.description.trim(),
      permissionCodes,
      // A new role grants through the grid; it carries no legacy authority rows.
      approvalAuthorities: [],
      allowSelfApproval: values.allowSelfApproval,
    })
      .unwrap()
      .then(() => {
        setConfirmOpen(true);
      })
      .catch((error) => {
        showToast("error", toToastError(error, "Couldn't create role"));
      });
  };

  // QR dialog now runs after creation, as a result acknowledgment rather
  // than a pre-creation dual-control gate.
  const handleApprove = () => {
    setConfirmOpen(false);
    setStep(2);
  };

  const handleClose = () => {
    onClose();
    // Wait out the drawer's close transition before wiping the form.
    setTimeout(() => {
      setStep(0);
      setConfirmOpen(false);
      reset(DEFAULT_VALUES);
      setPermissionCodes([]);
      setApprovalAuthorities([]);
      setPermissionError(false);
    }, 200);
  };

  const isSuccess = step === 2;

  return (
    <>
      <BaseSideDialog
        open={open}
        onClose={handleClose}
        confirmClose={!isSuccess}
        title={isEdit ? "Edit Role" : "Create Role"}
        width={700}
        steps={isSuccess ? undefined : STEPS}
        activeStep={step}
        footer={
          isSuccess ? undefined : step === 0 ? (
            <BaseButton title="Next" type="submit" form={ROLE_FORM_ID} variant="contained" fullWidth />
          ) : (
            <Stack direction="row" spacing={1.5} px={6}>
              <BaseButton
                title="Back"
                variant="outlined"
                fullWidth
                onClick={() => setStep(0)}
                disabled={isSubmitting}
                sx={{
                  backgroundColor: "#DFDFDE",
                  borderColor: "#DFDFDE",
                  color: palette.text.primary,
                  "&:hover": {
                    backgroundColor: "#DFDFDE",
                    borderColor: "#DFDFDE",
                  },
                }}
              />
              <BaseButton
                title="Next"
                variant="contained"
                fullWidth
                onClick={handleReviewNext}
                isLoading={isSubmitting}
              />
            </Stack>
          )
        }
      >
        {step === 0 && (
          <Box component="form" id={ROLE_FORM_ID} onSubmit={handleSubmit(goToReview)} noValidate>
            <Stack spacing={6}>
              <ControlledBaseInput
                name="name"
                control={control}
                label="Role Name"
                isRequired
                placeholder="Enter role name (e.g. Finance Auditor)"
                disabled={isEdit}
              />
              <ControlledBaseTextArea
                name="description"
                control={control}
                label="Description"
                placeholder="Briefly describe the responsibilities of this role"
                minRows={1}
                disabled={isEdit}
              />

              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>
                  What this role can do
                </Typography>
                <FunctionGrid
                  value={permissionCodes}
                  onChange={handlePermissionChange}
                  roleId={role?.id}
                  disabled={isSubmitting}
                />
                {permissionError && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                    Tick at least one verb.
                  </Typography>
                )}
              </Box>

              <RoleSelfApprovalField
                control={control}
                signsSomething={permissionCodes.some((code) => code.endsWith(":APPROVE"))}
              />

            </Stack>
          </Box>
        )}

        {step === 1 && (
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
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>What this role can do</Typography>
              <Typography sx={{ fontSize: 12, color: palette.slate[400], mb: 1.5 }}>
                One row per function, one tick per verb. Approve is a verb like any other.
              </Typography>
              <FunctionGrid value={permissionCodes} onChange={() => {}} roleId={role?.id} disabled />
            </Box>

            <RoleSelfApprovalField
              control={control}
              disabled
              signsSomething={permissionCodes.some((code) => code.endsWith(":APPROVE"))}
            />

          </Stack>
        )}

        {isSuccess && (
          <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", py: 3 }}>
            <Image src="/assets/icons/Ico.svg" alt="Success" width={40} height={40} />
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: palette.slate[500] }}>
              Submitted
            </Typography>
            <Typography variant="h6">
              {isEdit ? "Role access updated successfully" : "Role created successfully"}
            </Typography>
            <Typography variant="body2" sx={{ color: palette.slate[400] }}>
              {isEdit
                ? "Screen permissions and approval actions have been updated together."
                : "Assign this role to a user to grant all of its access."}
            </Typography>
            <BaseButton title="Done" variant="contained" fullWidth onClick={handleClose} />
          </Stack>
        )}
      </BaseSideDialog>

      <QrConfirmationDialog open={confirmOpen} onApprove={handleApprove} />
    </>
  );
}
