"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";

import { showToast } from "@core/components/AppToast";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import { ControlledBaseInput, ControlledBaseTextArea } from "@core/form";
import { useTopBarBreadcrumb } from "@core/layout";
import type { AuthenticatorRequest } from "@/features/authenticator/authenticator.types";
import { useRequestOrgChangeAuthenticatorMutation } from "@/features/user";
import { toToastError } from "@/utils/api-error";

import {
  useCreateRoleMutation,
  useUpdateRolePermissionsMutation,
} from "../rbac.api";
import type { Role } from "../rbac.types";
import PermissionChecklist from "./PermissionChecklist";

export type RoleFormMode = "create" | "edit";

export type RoleFormProps = {
  mode?: RoleFormMode;
  role?: Role | null;
  onSuccess?: () => void;
  onCancel?: () => void;
};

type RoleFormValues = {
  name: string;
  description: string;
  allowSelfApproval: boolean;
};

export default function RoleForm({
  mode,
  role,
  onSuccess,
  onCancel,
}: RoleFormProps) {
  const isEdit = mode === "edit" || Boolean(role);
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updatePermissions, { isLoading: isUpdating }] = useUpdateRolePermissionsMutation();
  const [requestOrgChangeAuth] = useRequestOrgChangeAuthenticatorMutation();
  const isSubmitting = isCreating || isUpdating;

  const [permissionCodes, setPermissionCodes] = useState<string[]>(role?.permissionCodes ?? []);
  const [permissionError, setPermissionError] = useState(false);

  // Dual-control approval modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changeId, setChangeId] = useState<string | null>(null);
  const [authenticator, setAuthenticator] = useState<AuthenticatorRequest | null>(null);
  const [qrPayload, setQrPayload] = useState<string | undefined>(undefined);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);

  const schema = useMemo(
    () =>
      yup.object({
        name: yup
          .string()
          .trim()
          .required("Role name is required")
          .max(64, "Role name must be 64 characters or fewer"),
        description: yup
          .string()
          .trim()
          .max(255, "Description must be 255 characters or fewer")
          .default(""),
        allowSelfApproval: yup.boolean().default(false),
      }),
    [],
  );

  const { control, handleSubmit, reset } = useForm<RoleFormValues>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
      allowSelfApproval: role?.allowSelfApproval ?? false,
    },
  });

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description ?? "",
        allowSelfApproval: role?.allowSelfApproval ?? false,
      });
      setPermissionCodes(role.permissionCodes ?? []);
    } else {
      reset({
        name: "",
        description: "",
        allowSelfApproval: false,
      });
      setPermissionCodes([]);
    }
    setPermissionError(false);
  }, [role, reset]);

  useTopBarBreadcrumb({
    prefix: "Administrator",
    subPrefix: isEdit ? `Edit ${role?.name ?? "Role"}` : "Create New Role",
    onBack: onCancel,
  });

  const handlePermissionChange = (next: string[]) => {
    setPermissionCodes(next);
    if (next.length > 0) setPermissionError(false);
  };

  const submit = handleSubmit(async (values) => {
    if (permissionCodes.length === 0) {
      setPermissionError(true);
      return;
    }

    try {
      if (isEdit && role) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = (await updatePermissions({
          id: role.id,
          permissionCodes,
          approvalAuthorities: role.approvalAuthorities ?? [],
          allowSelfApproval: values.allowSelfApproval,
        }).unwrap()) as any;

        if (res?.authenticator || res?.status === "AWAITING_AUTHORIZATION" || res?.changeId) {
          const auth = res.authenticator ?? null;
          setChangeId(res.changeId ?? null);
          setAuthenticator(auth);
          setQrPayload(auth?.qrPayload ?? undefined);
        }
        setIsAwaitingApproval(true);
        setConfirmOpen(true);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = (await createRole({
          name: values.name.trim(),
          description: values.description.trim(),
          permissionCodes,
          approvalAuthorities: [],
          allowSelfApproval: values.allowSelfApproval,
        }).unwrap()) as any;

        if (res?.authenticator || res?.status === "AWAITING_AUTHORIZATION" || res?.changeId) {
          const auth = res.authenticator ?? null;
          setChangeId(res.changeId ?? null);
          setAuthenticator(auth);
          setQrPayload(auth?.qrPayload ?? undefined);
        }
        setIsAwaitingApproval(true);
        setConfirmOpen(true);
      }
    } catch (error) {
      showToast(
        "error",
        toToastError(error, isEdit ? "Couldn't update role access" : "Couldn't create role"),
      );
    }
  });

  const handleQrApprove = () => {
    setConfirmOpen(false);
    setAuthenticator(null);
    setQrPayload(undefined);
    setChangeId(null);
    showToast("success", {
      title: isEdit ? "Role access updated" : "Role created",
      message: isAwaitingApproval
        ? "Submitted for checker approval. It will take effect once approved."
        : isEdit
          ? `${role?.name} access policy updated.`
          : "Role created successfully and ready to assign.",
    });
    onSuccess?.();
  };

  const handleQrClose = () => {
    setConfirmOpen(false);
  };

  const handleRenew = async () => {
    if (!changeId) return;
    try {
      const result = await requestOrgChangeAuth(changeId).unwrap();
      setAuthenticator(result);
      setQrPayload(result.qrPayload ?? undefined);
      return result;
    } catch {
      // transient failure
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        {/* Breadcrumb & Page Heading matching demo */}
        <div className="flex flex-col gap-1">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[#676766]">
            <button
              type="button"
              onClick={onCancel}
              className="hover:text-[#363635] hover:underline transition-colors cursor-pointer bg-transparent border-0 p-0 text-sm text-[#676766]"
            >
              Roles & Permissions
            </button>
            <span>&gt;</span>
            <span className="text-[#363635] font-medium">
              {isEdit ? `Edit ${role?.name ?? "Role"}` : "Create New Role"}
            </span>
          </nav>
          <h1 className="mt-2 text-[28px] leading-9 font-semibold text-[#363635]">
            {isEdit ? `Edit ${role?.name ?? "Role"}` : "Create New Role"}
          </h1>
        </div>

        {role?.isSystem && (
          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-900">
            <strong>{role.name}</strong> is a predefined role. Saving a change here updates its access policy.
          </div>
        )}

        <form onSubmit={submit} noValidate className="w-full">
          <section className="rounded-2xl border border-[#ededec] bg-white p-6 sm:p-8 shadow-none">
            <h2 className="text-xl font-semibold text-[#363635]">Role Detail</h2>
            <div className="mt-6 flex flex-col gap-6">
              {isEdit ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-[#898987]">Role Name</p>
                    <p className="mt-1 text-sm font-medium text-[#363635]">{role?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#898987]">Role ID</p>
                    <p className="mt-1 font-mono text-sm text-[#363635]">{role?.code || role?.id || "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-[#898987]">Description</p>
                    <p className="mt-1 text-sm text-[#363635]">{role?.description || "—"}</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <ControlledBaseInput
                      name="name"
                      control={control}
                      label="Role Name"
                      isRequired
                      placeholder="e.g. Approver"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <ControlledBaseTextArea
                      name="description"
                      control={control}
                      label="Description"
                      placeholder="Enter description"
                      minRows={4}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {/* Self-approval toggle */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[#ededec] bg-[#fbfbfb] p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-[#363635]">Self-approval</span>
                  <span className="text-xs text-[#676766]">
                    Whether someone with this role may approve a request they raised themselves. Leave it off unless one person is the whole company.
                  </span>
                </div>
                <Controller
                  name="allowSelfApproval"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(field.value)}
                      disabled={isSubmitting}
                      onClick={() => field.onChange(!field.value)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f2b7a]/40 ${
                        field.value ? "bg-[#2f2b7a]" : "bg-[#dfdfde]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          field.value ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  )}
                />
              </div>

              <PermissionChecklist
                roleId={role?.id}
                value={permissionCodes}
                onChange={handlePermissionChange}
                channel="CORPORATE"
                disabled={isSubmitting}
              />
              {permissionError && (
                <p className="text-sm text-red-500 mt-1">Tick at least one permission before saving this role.</p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#ededec] pt-6">
              <span className="text-sm text-[#676766]">
                <span className="font-semibold text-[#363635]">{permissionCodes.length}</span> permissions granted
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center min-w-24 h-12 px-6 rounded-xl border border-[#ededec] bg-white text-sm font-semibold text-[#363635] hover:bg-[#f7f7f7] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 min-w-24 h-12 px-6 rounded-xl bg-[#2f2b7a] text-sm font-semibold text-white hover:bg-[#2f2b7a]/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  Save
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>

      <QrConfirmationDialog
        open={confirmOpen}
        authenticator={authenticator}
        qrPayload={qrPayload}
        requestId={authenticator?.requestId || (changeId ?? undefined)}
        onClose={handleQrClose}
        onApprove={handleQrApprove}
        onAuthorized={handleQrApprove}
        onConsumed={handleQrApprove}
        onRenew={handleRenew}
        title="Confirm on Mobile"
        subtitle="Scan this QR code with your Biktech Mobile App to submit for checker approval."
      />
    </>
  );
}
