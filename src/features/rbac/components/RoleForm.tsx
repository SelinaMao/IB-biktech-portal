"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { yupResolver } from "@hookform/resolvers/yup";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { showToast } from "@core/components/AppToast";
import BaseButton from "@core/components/BaseButton";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import { ControlledBaseInput } from "@core/form";
import { palette } from "@/theme/palette";
import { toToastError } from "@/utils/api-error";

import {
  useCreateRoleMutation,
  useUpdateRolePermissionsMutation,
} from "../rbac.api";
import {
  DEFAULT_VALUES,
  type ApprovalAuthority,
  type Role,
  type RoleWizardValues,
} from "../rbac.types";
import { roleFormSchema } from "../schema/rbac.schema";
import RoleSelfApprovalField from "./RoleSelfApprovalField";

export type RoleCategory = "viewer" | "operator" | "authoriser";

export type PermissionItem = {
  id: string;
  name: string;
  permissions: {
    viewer: string[];
    operator: string[];
    authoriser: string[];
  };
};

export type ModuleGroup = {
  module: string;
  functions: PermissionItem[];
};

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    module: "Dashboard",
    functions: [
      {
        id: "dashboard-overview",
        name: "Overview",
        permissions: {
          viewer: ["DASHBOARD:VIEW", "TRANSACTION:RECORD:VIEW"],
          operator: ["DASHBOARD:CUSTOMIZE"],
          authoriser: ["DASHBOARD:APPROVE"],
        },
      },
    ],
  },
  {
    module: "Account",
    functions: [
      {
        id: "account-statements",
        name: "Accounts & statements",
        permissions: {
          viewer: ["ACCOUNT:RECORD:VIEW", "STATEMENT:DOCUMENT:VIEW"],
          operator: ["ACCOUNT:RECORD:EDIT"],
          authoriser: ["ACCOUNT:RECORD:APPROVE"],
        },
      },
    ],
  },
  {
    module: "Loan",
    functions: [
      {
        id: "loan-repayment",
        name: "Loans & repayment schedule",
        permissions: {
          viewer: ["LOAN:RECORD:VIEW"],
          operator: ["LOAN:RECORD:INITIATE"],
          authoriser: ["LOAN:RECORD:APPROVE"],
        },
      },
    ],
  },
  {
    module: "Transfers",
    functions: [
      {
        id: "transfer-own",
        name: "Own account",
        permissions: {
          viewer: ["TRANSFER:OWN_ACCOUNT:VIEW"],
          operator: ["TRANSFER:OWN_ACCOUNT:INITIATE"],
          authoriser: ["TRANSFER:OWN_ACCOUNT:APPROVE"],
        },
      },
      {
        id: "transfer-within-bank",
        name: "Within bank",
        permissions: {
          viewer: ["TRANSFER:OTHER_SME_ACCOUNT:VIEW"],
          operator: ["TRANSFER:OTHER_SME_ACCOUNT:INITIATE"],
          authoriser: ["TRANSFER:OTHER_SME_ACCOUNT:APPROVE"],
        },
      },
      {
        id: "transfer-other-bakong",
        name: "Other banks & Bakong",
        permissions: {
          viewer: [
            "TRANSFER:BAKONG_LOCAL_BANK:VIEW",
            "TRANSFER:BAKONG_WALLET:VIEW",
          ],
          operator: [
            "TRANSFER:BAKONG_LOCAL_BANK:INITIATE",
            "TRANSFER:BAKONG_WALLET:INITIATE",
          ],
          authoriser: [
            "TRANSFER:BAKONG_LOCAL_BANK:APPROVE",
            "TRANSFER:BAKONG_WALLET:APPROVE",
          ],
        },
      },
    ],
  },
  {
    module: "Payments",
    functions: [
      {
        id: "payment-bill",
        name: "Bill payment",
        permissions: {
          viewer: ["TRANSFER:BILL:VIEW"],
          operator: ["TRANSFER:BILL:INITIATE"],
          authoriser: ["TRANSFER:BILL:APPROVE"],
        },
      },
      {
        id: "payment-mobile-topup",
        name: "Mobile top-up",
        permissions: {
          viewer: ["TRANSFER:TOPUP:VIEW"],
          operator: [
            "TRANSFER:TOPUP_PINLESS:INITIATE",
            "TRANSFER:TOPUP_PINCODE:INITIATE",
          ],
          authoriser: ["TRANSFER:TOPUP:APPROVE"],
        },
      },
      {
        id: "payment-charity",
        name: "Charity & donation",
        permissions: {
          viewer: ["TRANSFER:DONATION:VIEW"],
          operator: ["TRANSFER:DONATION:INITIATE"],
          authoriser: ["TRANSFER:DONATION:APPROVE"],
        },
      },
    ],
  },
  {
    module: "Schedule",
    functions: [
      {
        id: "schedule-transfers",
        name: "Scheduled transfers & payments",
        permissions: {
          viewer: ["SCHEDULE:RECORD:VIEW"],
          operator: ["SCHEDULE:RECORD:INITIATE", "SCHEDULE:RECORD:EDIT"],
          authoriser: ["SCHEDULE:RECORD:APPROVE"],
        },
      },
    ],
  },
  {
    module: "Payroll",
    functions: [
      {
        id: "payroll-payroll",
        name: "Payroll",
        permissions: {
          viewer: ["TRANSFER:PAYROLL:VIEW"],
          operator: ["TRANSFER:PAYROLL:INITIATE", "TRANSFER:PAYROLL:CANCEL"],
          authoriser: ["TRANSFER:PAYROLL:APPROVE"],
        },
      },
    ],
  },
  {
    module: "Other services",
    functions: [
      {
        id: "other-cheque",
        name: "Cheque services",
        permissions: {
          viewer: ["CHEQUE:RECORD:VIEW"],
          operator: ["CHEQUE:RECORD:INITIATE"],
          authoriser: ["CHEQUE:RECORD:APPROVE"],
        },
      },
    ],
  },
  {
    module: "Merchant",
    functions: [
      {
        id: "merchant-payments-bills",
        name: "Payments & consumer bills",
        permissions: {
          viewer: ["MERCHANT:PAYMENT:VIEW"],
          operator: [
            "MERCHANT:PAYMENT:INITIATE",
            "MERCHANT:PAYMENT:EDIT",
          ],
          authoriser: ["MERCHANT:PAYMENT:APPROVE"],
        },
      },
      {
        id: "merchant-branches-users",
        name: "Branches & users",
        permissions: {
          viewer: ["MERCHANT:PROFILE:VIEW"],
          operator: [
            "MERCHANT:PROFILE:CREATE",
            "MERCHANT:PROFILE:EDIT",
          ],
          authoriser: ["MERCHANT:PROFILE:APPROVE"],
        },
      },
    ],
  },
  {
    module: "Administrator",
    functions: [
      {
        id: "admin-roles-users",
        name: "Roles & users",
        permissions: {
          viewer: ["ROLE:OWN_DEFINITION:VIEW", "USER:PROFILE:VIEW"],
          operator: [
            "ROLE:OWN_DEFINITION:CREATE",
            "ROLE:OWN_DEFINITION:EDIT",
            "USER:PROFILE:CREATE",
            "USER:PROFILE:EDIT",
          ],
          authoriser: [
            "ROLE:OWN_DEFINITION:APPROVE",
            "USER:PROFILE:APPROVE",
          ],
        },
      },
    ],
  },
];

const ROLE_FORM_ID = "role-page-form";

function PermissionCheckbox({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onChange}
      sx={{
        width: 18,
        height: 18,
        borderRadius: "5px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.7 : 1,
        border: checked ? "1.5px solid #36A17E" : `1.5px solid ${palette.slate[300]}`,
        bgcolor: checked ? "#36A17E" : palette.white,
        transition: "all 120ms ease",
        p: 0,
        "&:hover": {
          borderColor: checked ? "#2E8B6C" : disabled ? palette.slate[300] : palette.slate[400],
          bgcolor: checked ? "#2E8B6C" : disabled ? palette.white : palette.slate[50],
        },
      }}
    >
      {checked && (
        <CheckRoundedIcon sx={{ fontSize: 13, color: "#ffffff", strokeWidth: 1.5 }} />
      )}
    </Box>
  );
}

export type RoleFormProps = {
  role?: Role | null;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function RoleForm({ role, onSuccess, onCancel }: RoleFormProps) {
  const router = useRouter();
  const isEdit = Boolean(role);

  const [step, setStep] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [permissionError, setPermissionError] = useState(false);
  const [approvalAuthorities, setApprovalAuthorities] = useState<ApprovalAuthority[]>([]);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updatePermissions, { isLoading: isUpdating }] = useUpdateRolePermissionsMutation();
  const isSubmitting = isCreating || isUpdating;

  const { control, handleSubmit, reset, getValues } = useForm<RoleWizardValues>({
    resolver: yupResolver(roleFormSchema),
    mode: "onSubmit",
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description || "",
        allowSelfApproval: role.allowSelfApproval ?? false,
      });
      setPermissionCodes(role.permissionCodes ?? []);
      setApprovalAuthorities(role.approvalAuthorities ?? []);
    } else {
      reset(DEFAULT_VALUES);
      setPermissionCodes([]);
      setApprovalAuthorities([]);
    }
    setPermissionError(false);
    setStep(0);
  }, [role, reset]);

  const selectedSet = useMemo(() => new Set(permissionCodes), [permissionCodes]);

  const isChecked = (fn: PermissionItem, category: RoleCategory): boolean => {
    const codes = fn.permissions[category];
    if (codes.length === 0) return false;
    return codes.some((code) => selectedSet.has(code));
  };

  const toggleCategory = (fn: PermissionItem, category: RoleCategory, disabled?: boolean) => {
    if (disabled) return;
    const codes = fn.permissions[category];
    const currentlyChecked = isChecked(fn, category);
    let next: string[];
    if (currentlyChecked) {
      next = permissionCodes.filter((c) => !codes.includes(c));
    } else {
      next = Array.from(new Set([...permissionCodes, ...codes]));
    }
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
    // Derive companions so backend permission ceilings are respected
    const finalCodes = new Set(permissionCodes);
    const hasApproval = permissionCodes.some((c) => c.endsWith(":APPROVE"));
    const hasInitiate = permissionCodes.some(
      (c) => c.endsWith(":INITIATE") || c.endsWith(":CREATE") || c.endsWith(":EDIT"),
    );
    if (hasInitiate) {
      finalCodes.add("WORKFLOW:REQUEST:INITIATE");
    }
    if (hasApproval) {
      finalCodes.add("WORKFLOW:REQUEST:VIEW");
      finalCodes.add("WORKFLOW:TASK:VIEW");
      finalCodes.add("WORKFLOW:TASK:APPROVE");
    }
    const finalCodeArray = Array.from(finalCodes);

    if (isEdit && role) {
      updatePermissions({
        id: role.id,
        permissionCodes: finalCodeArray,
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
      permissionCodes: finalCodeArray,
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

  const handleApprove = () => {
    setConfirmOpen(false);
    setStep(2);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/rbac");
    }
  };

  const handleDone = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/rbac");
    }
  };

  return (
    <>
      <Card
        sx={{
          bgcolor: palette.white,
          borderRadius: "16px",
          border: `1px solid ${palette.slate[200]}`,
          p: { xs: 2.5, sm: 3, md: 4 },
          boxShadow: "none",
        }}
      >
        {step === 0 && (
          <Box component="form" id={ROLE_FORM_ID} onSubmit={handleSubmit(goToReview)} noValidate>
            {/* Header */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "20px", sm: "22px" },
                color: "#0F172A",
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {isEdit ? "Edit Role" : "Create Role"}
            </Typography>
            <Typography sx={{ fontSize: "14px", color: palette.slate[500], mb: 3 }}>
              Give the role a clear name and pick what it can do.
            </Typography>

            {/* Inputs: Role Name & Description Side-by-Side */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2.5,
                mb: 3.5,
              }}
            >
              <ControlledBaseInput
                name="name"
                control={control}
                label="Role name"
                isRequired
                placeholder="Merchant Supervisor"
                disabled={isEdit}
              />
              <ControlledBaseInput
                name="description"
                control={control}
                label={
                  <span>
                    Description{" "}
                    <span style={{ color: palette.slate[400], fontWeight: 400 }}>
                      (Optional)
                    </span>
                  </span>
                }
                placeholder="Manages merchant branches and consumer bills"
                disabled={isEdit}
              />
            </Box>

            {/* Access Header */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "16px", color: "#0F172A", mb: 0.5 }}>
                Access
              </Typography>
              <Typography sx={{ fontSize: "13px", color: palette.slate[500] }}>
                Viewer sees data. Operator creates transactions and requests. Authoriser approves
                them.
              </Typography>
            </Box>

            {permissionError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
                Please select at least one permission in the table below.
              </Alert>
            )}

            {/* Matrix Table */}
            <TableContainer
              sx={{
                border: `1px solid ${palette.slate[200]}`,
                borderRadius: "12px",
                overflow: "hidden",
                mb: 3,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: palette.white }}>
                    <TableCell
                      sx={{
                        color: palette.slate[500],
                        fontSize: "12px",
                        fontWeight: 500,
                        py: 1.5,
                        px: 2.5,
                        borderBottom: `1px solid ${palette.slate[200]}`,
                        width: "60%",
                      }}
                    >
                      Module / function
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: palette.slate[500],
                        fontSize: "12px",
                        fontWeight: 500,
                        py: 1.5,
                        px: 1,
                        borderBottom: `1px solid ${palette.slate[200]}`,
                        width: "13.33%",
                      }}
                    >
                      Viewer
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: palette.slate[500],
                        fontSize: "12px",
                        fontWeight: 500,
                        py: 1.5,
                        px: 1,
                        borderBottom: `1px solid ${palette.slate[200]}`,
                        width: "13.33%",
                      }}
                    >
                      Operator
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: palette.slate[500],
                        fontSize: "12px",
                        fontWeight: 500,
                        py: 1.5,
                        px: 1,
                        borderBottom: `1px solid ${palette.slate[200]}`,
                        width: "13.33%",
                      }}
                    >
                      Authoriser
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MODULE_GROUPS.map((group) => (
                    <Fragment key={group.module}>
                      {/* Module Title Row */}
                      <TableRow sx={{ bgcolor: palette.slate[50] }}>
                        <TableCell
                          colSpan={4}
                          sx={{
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "#0F172A",
                            py: 1.25,
                            px: 2.5,
                            borderBottom: `1px solid ${palette.slate[200]}`,
                          }}
                        >
                          {group.module}
                        </TableCell>
                      </TableRow>

                      {/* Functions */}
                      {group.functions.map((fn) => (
                        <TableRow
                          key={fn.id}
                          sx={{
                            bgcolor: palette.white,
                            "&:hover": { bgcolor: palette.slate[50] },
                          }}
                        >
                          <TableCell
                            sx={{
                              fontSize: "14px",
                              color: "#334155",
                              py: 1.5,
                              px: 2.5,
                              borderBottom: `1px solid ${palette.slate[100]}`,
                            }}
                          >
                            {fn.name}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              py: 1.5,
                              px: 1,
                              borderBottom: `1px solid ${palette.slate[100]}`,
                            }}
                          >
                            <PermissionCheckbox
                              checked={isChecked(fn, "viewer")}
                              onChange={() => toggleCategory(fn, "viewer")}
                            />
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              py: 1.5,
                              px: 1,
                              borderBottom: `1px solid ${palette.slate[100]}`,
                            }}
                          >
                            <PermissionCheckbox
                              checked={isChecked(fn, "operator")}
                              onChange={() => toggleCategory(fn, "operator")}
                            />
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              py: 1.5,
                              px: 1,
                              borderBottom: `1px solid ${palette.slate[100]}`,
                            }}
                          >
                            <PermissionCheckbox
                              checked={isChecked(fn, "authoriser")}
                              onChange={() => toggleCategory(fn, "authoriser")}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Self-approval toggle if authoriser verbs are granted */}
            <Box sx={{ mb: 3 }}>
              <RoleSelfApprovalField
                control={control}
                signsSomething={permissionCodes.some((code) => code.endsWith(":APPROVE"))}
              />
            </Box>

            {/* Bottom Actions */}
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ justifyContent: "flex-end", alignItems: "center", pt: 1 }}
            >
              <BaseButton
                title="Cancel"
                variant="outlined"
                onClick={handleCancel}
                sx={{
                  minWidth: 90,
                  height: 40,
                  px: 3,
                  borderRadius: "10px",
                  borderColor: palette.slate[200],
                  color: "#0F172A",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                  bgcolor: palette.white,
                  "&:hover": {
                    borderColor: palette.slate[300],
                    bgcolor: palette.slate[50],
                  },
                }}
              />
              <BaseButton
                title="Review"
                variant="contained"
                type="submit"
                form={ROLE_FORM_ID}
                sx={{
                  minWidth: 90,
                  height: 40,
                  px: 3,
                  borderRadius: "10px",
                  bgcolor: "#1B5299",
                  color: "#FFFFFF",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#15427C",
                    boxShadow: "none",
                  },
                }}
              />
            </Stack>
          </Box>
        )}

        {/* Step 1: Review */}
        {step === 1 && (
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
              <BaseButton
                title="Back"
                variant="text"
                startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={() => setStep(0)}
                disabled={isSubmitting}
                sx={{
                  // color: palette.slate[700],
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                  minWidth: 0,  
                  "&:hover": { bgcolor: "transparent", color: "#1B5299" },
                }}
              />
            </Stack>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "20px", sm: "22px" },
                color: "#0F172A",
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              Review Role
            </Typography>
            <Typography sx={{ fontSize: "14px", color: palette.slate[500], mb: 3 }}>
              Confirm role name, description, and granted access permissions before submitting.
            </Typography>

            <Box
              sx={{
                p: 2.5,
                borderRadius: "12px",
                border: `1px solid ${palette.slate[200]}`,
                bgcolor: palette.slate[50],
                mb: 3.5,
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: palette.slate[400], fontWeight: 500 }}>
                    Role name
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "15px", color: "#0F172A", mt: 0.5 }}>
                    {getValues().name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: palette.slate[400], fontWeight: 500 }}>
                    Description
                  </Typography>
                  <Typography sx={{ fontSize: "14px", color: "#334155", mt: 0.5 }}>
                    {getValues().description || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Read-only Matrix Preview */}
            <Typography sx={{ fontWeight: 700, fontSize: "15px", color: "#0F172A", mb: 1.5 }}>
              Assigned Access
            </Typography>

            <TableContainer
              sx={{
                border: `1px solid ${palette.slate[200]}`,
                borderRadius: "12px",
                overflow: "hidden",
                mb: 3,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: palette.white }}>
                    <TableCell
                      sx={{
                        color: palette.slate[500],
                        fontSize: "12px",
                        fontWeight: 500,
                        py: 1.5,
                        px: 2.5,
                        borderBottom: `1px solid ${palette.slate[200]}`,
                        width: "60%",
                      }}
                    >
                      Module / function
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: palette.slate[500],
                        fontSize: "12px",
                        fontWeight: 500,
                        py: 1.5,
                        px: 1,
                        borderBottom: `1px solid ${palette.slate[200]}`,
                        width: "13.33%",
                      }}
                    >
                      Viewer
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: palette.slate[500],
                        fontSize: "12px",
                        fontWeight: 500,
                        py: 1.5,
                        px: 1,
                        borderBottom: `1px solid ${palette.slate[200]}`,
                        width: "13.33%",
                      }}
                    >
                      Operator
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: palette.slate[500],
                        fontSize: "12px",
                        fontWeight: 500,
                        py: 1.5,
                        px: 1,
                        borderBottom: `1px solid ${palette.slate[200]}`,
                        width: "13.33%",
                      }}
                    >
                      Authoriser
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MODULE_GROUPS.map((group) => {
                    const hasAnyCheckedInGroup = group.functions.some(
                      (fn) =>
                        isChecked(fn, "viewer") ||
                        isChecked(fn, "operator") ||
                        isChecked(fn, "authoriser"),
                    );
                    if (!hasAnyCheckedInGroup) return null;

                    return (
                      <Fragment key={`review-${group.module}`}>
                        <TableRow sx={{ bgcolor: palette.slate[50] }}>
                          <TableCell
                            colSpan={4}
                            sx={{
                              fontWeight: 700,
                              fontSize: "14px",
                              color: "#0F172A",
                              py: 1.25,
                              px: 2.5,
                              borderBottom: `1px solid ${palette.slate[200]}`,
                            }}
                          >
                            {group.module}
                          </TableCell>
                        </TableRow>

                        {group.functions.map((fn) => {
                          const v = isChecked(fn, "viewer");
                          const o = isChecked(fn, "operator");
                          const a = isChecked(fn, "authoriser");
                          if (!v && !o && !a) return null;

                          return (
                            <TableRow key={`review-${fn.id}`} sx={{ bgcolor: palette.white }}>
                              <TableCell
                                sx={{
                                  fontSize: "14px",
                                  color: "#334155",
                                  py: 1.5,
                                  px: 2.5,
                                  borderBottom: `1px solid ${palette.slate[100]}`,
                                }}
                              >
                                {fn.name}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  py: 1.5,
                                  px: 1,
                                  borderBottom: `1px solid ${palette.slate[100]}`,
                                }}
                              >
                                <PermissionCheckbox checked={v} disabled onChange={() => {}} />
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  py: 1.5,
                                  px: 1,
                                  borderBottom: `1px solid ${palette.slate[100]}`,
                                }}
                              >
                                <PermissionCheckbox checked={o} disabled onChange={() => {}} />
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  py: 1.5,
                                  px: 1,
                                  borderBottom: `1px solid ${palette.slate[100]}`,
                                }}
                              >
                                <PermissionCheckbox checked={a} disabled onChange={() => {}} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Bottom Actions for Review */}
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ justifyContent: "flex-end", alignItems: "center", pt: 1 }}
            >
              <BaseButton
                title="Back"
                variant="outlined"
                onClick={() => setStep(0)}
                disabled={isSubmitting}
                sx={{
                  minWidth: 90,
                  height: 40,
                  px: 3,
                  borderRadius: "10px",
                  borderColor: palette.slate[200],
                  color: "#0F172A",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                  bgcolor: palette.white,
                  "&:hover": {
                    borderColor: palette.slate[300],
                    bgcolor: palette.slate[50],
                  },
                }}
              />
              <BaseButton
                title={isEdit ? "Update Role" : "Create Role"}
                variant="contained"
                onClick={handleReviewNext}
                isLoading={isSubmitting}
                sx={{
                  minWidth: 120,
                  height: 40,
                  px: 3,
                  borderRadius: "10px",
                  bgcolor: "#1B5299",
                  color: "#FFFFFF",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#15427C",
                    boxShadow: "none",
                  },
                }}
              />
            </Stack>
          </Box>
        )}

        {/* Step 2: Success State */}
        {step === 2 && (
          <Stack
            spacing={2}
            sx={{
              alignItems: "center",
              textAlign: "center",
              py: 6,
              maxWidth: 480,
              mx: "auto",
            }}
          >
            <Image src="/assets/icons/Ico.svg" alt="Success" width={56} height={56} />
            <Typography sx={{ fontWeight: 600, fontSize: "14px", color: palette.slate[500] }}>
              Submitted
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#0F172A" }}>
              {isEdit ? "Role access updated successfully" : "Role created successfully"}
            </Typography>
            <Typography variant="body2" sx={{ color: palette.slate[400], mb: 2 }}>
              {isEdit
                ? "Screen permissions and approval actions have been updated together."
                : "Assign this role to a user to grant all of its access."}
            </Typography>
            <BaseButton
              title="Done"
              variant="contained"
              onClick={handleDone}
              sx={{
                minWidth: 140,
                height: 40,
                borderRadius: "10px",
                bgcolor: "#1B5299",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "14px",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#15427C",
                  boxShadow: "none",
                },
              }}
            />
          </Stack>
        )}
      </Card>

      <QrConfirmationDialog open={confirmOpen} onApprove={handleApprove} />
    </>
  );
}
