"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { showToast } from "@core/components/AppToast";
import BaseButton from "@core/components/BaseButton";
import BaseSideDialog from "@core/components/BaseSideDialog";
import { palette, radius } from "@/theme/palette";
import { toToastError } from "@/utils/api-error";

import {
  getUserInfoDefaultValues,
  getUserInfoValuesFromUser,
  userInfoSchema,
  type UserInfoValues,
} from "../schema/user.schema";
import {
  useCreateUserMutation,
  useGetUserAccountScopeQuery,
  useGetUserDetailQuery,
  useUnlockUserMutation,
  useUpdateUserMutation,
} from "../user.api";
import type { AdminUser, UserAccountScope } from "../user.types";

import UserFormAction from "./UserFormAction";

const STEPS = ["Details", "Review", "Done"];
const USER_FORM_ID = "user-form-dialog";

/** The chosen accounts as the form holds them: empty means every account. */
const accountsOf = (scope?: UserAccountScope) =>
  scope?.scopeType === "SELECTED" ? scope.accountNumbers : [];

const sameAccounts = (left: string[] = [], right: string[] = []) =>
  left.length === right.length && left.every((account) => right.includes(account));

export type UserFormDialogProps = {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog edits this user instead of creating a new one. */
  user?: AdminUser | null;
  /** Defaults to true — dialog doesn't close on outside click unless explicitly opted out. */
  disableBackdropClick?: boolean;
  /** Whether the caller may open this dialog at all. Defaults to true. */
  canView?: boolean;
  /** Whether an existing user's fields may be edited/saved. Defaults to true. Ignored when creating. */
  canEdit?: boolean;
  /** Gates the Active/Inactive status switch. Defaults to true. */
  canDeactivate?: boolean;
  /** Whether the Unlock action is shown for a LOCKED user. Defaults to true. */
  canUnlock?: boolean;
};

/**
 * Create/Edit user wizard (User Info → Review → Submit), built on
 * BaseSideDialog. Role options come from `org/roles` (see
 * useListOrgRolesQuery in user.api.ts); Access Level is still a UI-only,
 * mockup-driven list — see ACCESS_LEVEL_OPTIONS in user.types.ts.
 */
export default function UserFormDialog({
  open,
  onClose,
  user = null,
  disableBackdropClick = true,
  canView = true,
  canEdit = true,
  canDeactivate = true,
  canUnlock = true,
}: UserFormDialogProps) {
  const [step, setStep] = useState(0);
  const isEdit = Boolean(user);
  // Create is gated by the caller (e.g. the "Add User" button) — canEdit only
  // restricts editing of an existing user.
  const readOnly = isEdit && !canEdit;

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [unlockUser, { isLoading: isUnlocking }] = useUnlockUserMutation();
  // Row data from the table is partial (no phone/access level) — fetch the
  // full record by id so the edit form opens pre-filled with real data.
  const { data: userDetail, isFetching: isLoadingDetail } = useGetUserDetailQuery(
    user?.id ?? "",
    { skip: !open || !user?.id },
  );
  const { data: accountScope } = useGetUserAccountScopeQuery(user?.id ?? "", {
    skip: !open || !user?.id,
  });
  const isSubmitting = isCreating || isUpdating;
  const currentStatus = userDetail?.user?.status ?? user?.status;
  const showUnlock = isEdit && canUnlock && currentStatus === "LOCKED";

  const provider = useForm<UserInfoValues>({
    resolver: yupResolver(userInfoSchema),
    mode: "onSubmit",
    defaultValues: getUserInfoDefaultValues(),
  });
  const { control, handleSubmit, reset, getValues } = provider;

  // Re-seed the form whenever the dialog opens or the fetched detail lands,
  // so edit prefills the selected user's data and create starts blank.
  useEffect(() => {
    if (!open) return;
    if (user) {
      reset({ ...getUserInfoValuesFromUser(userDetail?.user ?? user), accountIds: accountsOf(accountScope) });
    } else {
      reset(getUserInfoDefaultValues());
    }
  }, [open, user, userDetail, accountScope, reset]);

  const onSubmit = () => {
    setStep(1);
  };

  const handleSaveUser = async () => {
    const values = getValues();
    try {
      if (isEdit && user) {
        const accountsChanged = !sameAccounts(values.accountIds, accountsOf(accountScope));
        await updateUser({ id: user.id, ...values, accountsChanged }).unwrap();
        setStep(2);
        return;
      }

      await createUser(values).unwrap();
      setStep(2);
    } catch (error) {
      showToast("error", toToastError(error, isEdit ? "Couldn't update user" : "Couldn't create user"));
    }
  };
  const handleUnlock = () => {
    if (!user) return;
    unlockUser(user.id)
      .unwrap()
      .then(() => {
        showToast("success", { title: "User unlocked", message: `${user.email} can try signing in again.` });
        handleClose();
      })
      .catch((error) => {
        showToast("error", toToastError(error, "Couldn't unlock user"));
      });
  };
  const handleClose = () => {
    onClose();
    // Wait out the drawer's close transition before wiping the form.
    setTimeout(() => {
      setStep(0);
      reset(getUserInfoDefaultValues());
    }, 200);
  };

  const isSuccess = step === 2;

  const unlockButton = showUnlock && !isSuccess ? (
    <BaseButton
      title="Unlock User"
      variant="outlined"
      fullWidth
      onClick={handleUnlock}
      isLoading={isUnlocking}
    />
  ) : null;

  return (
    <FormProvider {...provider}>
      <BaseSideDialog
        open={open}
        onClose={handleClose}
        disableBackdropClick={disableBackdropClick}
        confirmClose={canView && !isSuccess && !readOnly}
        title={
          !canView ? "Access denied" : isSuccess ? "Done" : isEdit ? "Edit User" : "Create User"
        }
        width={700}
        icon={
          isSuccess ? (
            <Image src="/assets/icons/Ico.svg" alt="Success" width={20} height={20} />
          ) : isEdit ? (
            <PersonRoundedIcon fontSize="small" />
          ) : (
            <PersonAddAlt1RoundedIcon fontSize="small" />
          )
        }
        steps={!canView || readOnly || isSuccess ? undefined : STEPS}
        activeStep={step}
        footer={
          !canView || isSuccess ? (
            undefined
          ) : readOnly ? (
            unlockButton ?? undefined
          ) : step === 0 ? (
            <Stack spacing={1.5}>
              {unlockButton}
              <BaseButton title="Next" type="submit" form={USER_FORM_ID} variant="contained" fullWidth />
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              {unlockButton}
              <Stack direction="row" spacing={1.5}>
                <BaseButton
                  title="Back"
                  variant="outlined"
                  fullWidth
                  onClick={() => setStep(0)}
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
                  title="Save"
                  variant="contained"
                  fullWidth
                  onClick={handleSaveUser}
                  isLoading={isSubmitting}
                />
              </Stack>
            </Stack>
          )
        }
      >
        {!canView && (
          <Typography sx={{ color: palette.slate[400], textAlign: "center", py: 4 }}>
            You do not have permission to view this user.
          </Typography>
        )}

        {canView && readOnly && (
          <UserFormAction
            isSubmitting={false}
            control={control}
            disabled
            canDeactivate={false}
            open={open}
            isEdit={isEdit}
          />
        )}

        {canView && !readOnly && step === 0 && (

          <Box component="form" id={USER_FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate>
            <UserFormAction
              isSubmitting={isSubmitting}
              control={control}
              disabled={isLoadingDetail}
              canDeactivate={canDeactivate}
              open={open}
              isEdit={isEdit}
            />
          </Box>
        )}

        {canView && !readOnly && step === 1 && (
          <UserFormAction
            isSubmitting={isSubmitting}
            control={control}
            disabled
            canDeactivate={canDeactivate}
            open={open}
            isEdit={isEdit}
          />
        )}

        {canView && isSuccess && (
          <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", py: 3 }}>
            <Image src="/assets/icons/Ico.svg" alt="Success" width={40} height={40} />
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: palette.slate[500] }}>
              {isEdit ? "Saved" : "Created"}
            </Typography>

            <Stack
              direction="row"
              sx={{ alignItems: "center", justifyContent: "center", width: "100%", py: 1 }}
            >
              <IconChip
                icon={<Image src="/assets/icons/send-to-mobile.svg" alt="" width={28} height={28} />}
              />
              <Box sx={{ position: "relative", flex: 1, maxWidth: 72, mx: 1.5 }}>
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    borderTopWidth: 2,
                    borderTopStyle: "dashed",
                    borderTopColor: palette.navy[800],
                    transform: "translateY(-50%)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    right: -1,
                    transform: "translateY(-50%)",
                    width: 0,
                    height: 0,
                    borderTop: "4px solid transparent",
                    borderBottom: "4px solid transparent",
                    borderLeft: `6px solid ${palette.navy[800]}`,
                  }}
                />
              </Box>
              <IconChip
                icon={<Image src="/assets/icons/wallet-cards.svg" alt="" width={28} height={28} />}
              />
            </Stack>

            <Typography variant="h6">{isEdit ? "Changes saved" : "User created"}</Typography>
            <Typography variant="body2" sx={{ color: palette.slate[400] }}>
              {isEdit
                ? "Their details and role are up to date."
                : "They are waiting on activation. Their login ID and password are sent to them separately — the password always by text message."}
            </Typography>
          </Stack>
        )}
      </BaseSideDialog>
    </FormProvider>
  );
}

function IconChip({ icon }: { icon: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: `${radius.lg}px`,
        bgcolor: palette.info[50],
        color: palette.primary[50],
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
  );
}
