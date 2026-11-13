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
import { useTopBarBreadcrumb } from "@core/layout";
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

const ROLE_CATEGORIES: { key: RoleCategory; label: string }[] = [
  { key: "viewer", label: "Viewer" },
  { key: "operator", label: "Operator" },
  { key: "authoriser", label: "Authoriser" },
];

const ROLE_INPUT_SX = {
  mt: -1.5,
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    bgcolor: palette.white,
    fontSize: "14px",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: palette.slate[300],
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: palette.slate[400],
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#1B5299",
    },
  },
  "& .MuiOutlinedInput-input": {
    py: "10px",
    px: "14px",
    fontSize: "14px",
    color: "#0F172A",
    "&::placeholder": {
      color: palette.slate[400],
      opacity: 1,
    },
  },
};

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
        width: 17,
        height: 17,
        borderRadius: "4px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.7 : 1,
        border: checked ? "1.5px solid #2EA07B" : `1.5px solid ${palette.slate[300]}`,
        bgcolor: checked ? "#2EA07B" : palette.white,
        transition: "all 120ms ease",
        p: 0,
        "&:hover": {
          borderColor: checked ? "#268A69" : disabled ? palette.slate[300] : palette.slate[400],
          bgcolor: checked ? "#268A69" : disabled ? palette.white : palette.slate[50],
        },
      }}
    >
      {checked && (
        <CheckRoundedIcon sx={{ fontSize: 12.5, color: "#ffffff", strokeWidth: 1.75 }} />
      )}
    </Box>
  );
}

/** Shared permission matrix rendered in both Create/Edit and Review steps. */
function PermissionMatrixTable({
  isChecked,
  onToggle,
  readOnly = false,
}: {
  isChecked: (fn: PermissionItem, category: RoleCategory) => boolean;
  onToggle?: (fn: PermissionItem, category: RoleCategory) => void;
  readOnly?: boolean;
}) {
  return (
    <TableContainer sx={{ mb: 3 }}>
      <Table size="small" sx={{ borderCollapse: "separate", borderSpacing: 0 }}>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                bgcolor: palette.white,
                color: palette.slate[500],
                fontSize: "12px",
                fontWeight: 500,
                py: 1.5,
                px: 2,
                borderBottom: `1px solid ${palette.slate[100]}`,
                width: "60%",
              }}
            >
              Module / function
            </TableCell>
            {ROLE_CATEGORIES.map((category) => (
              <TableCell
                key={category.key}
                align="center"
                sx={{
                  bgcolor: palette.white,
                  color: palette.slate[500],
                  fontSize: "12px",
                  fontWeight: 500,
                  py: 1.5,
                  px: 1,
                  borderBottom: `1px solid ${palette.slate[100]}`,
                  width: "13.33%",
                }}
              >
                {category.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {MODULE_GROUPS.map((group) => {
            const visibleFunctions = readOnly
              ? group.functions.filter((fn) =>
                  ROLE_CATEGORIES.some((cat) => isChecked(fn, cat.key)),
                )
              : group.functions;

            if (visibleFunctions.length === 0) return null;

            return (
              <Fragment key={`${readOnly ? "review" : "edit"}-${group.module}`}>
                <TableRow>
                  <TableCell
                    colSpan={4}
                    sx={{
                      bgcolor: "#F4F6FA",
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#0F172A",
                      py: 1.25,
                      px: 2,
                      borderBottom: "none",
                      borderRadius: "4px",
                    }}
                  >
                    {group.module}
                  </TableCell>
                </TableRow>

                {visibleFunctions.map((fn) => (
                  <TableRow
                    key={`${readOnly ? "review" : "edit"}-${fn.id}`}
                    sx={{
                      bgcolor: palette.white,
                      ...(readOnly ? {} : { "&:hover": { bgcolor: palette.slate[50] } }),
                    }}
                  >
                    <TableCell
                      sx={{
                        fontSize: "13.5px",
                        color: "#1E293B",
                        py: 1.5,
                        pl: 4,
                        pr: 2,
                        borderBottom: "none",
                      }}
                    >
                      {fn.name}
                    </TableCell>
                    {ROLE_CATEGORIES.map((category) => (
                      <TableCell
                        key={category.key}
                        align="center"
                        sx={{
                          py: 1.5,
                          px: 1,
                          borderBottom: "none",
                        }}
                      >
                        <PermissionCheckbox
                          checked={isChecked(fn, category.key)}
                          disabled={readOnly}
                          onChange={() => onToggle?.(fn, category.key)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
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

  useTopBarBreadcrumb({
    prefix: "Role",
    subPrefix: isEdit ? "Edit Role" : "Create Role",
    onBack: handleCancel,
  });

  return (
    <>
      <Card
        sx={{
          bgcolor: palette.white,
          borderRadius: "16px",
          border: `1px solid ${palette.slate[200]}`,
          p: { xs: 2.5, sm: 3, md: 3.5 },
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
                fontSize: { xs: "18px", sm: "20px" },
                color: "#0F172A",
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {isEdit ? "Edit Role" : "Create Role"}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: palette.slate[500], mb: 3 }}>
              Give the role a clear name and pick what it can do.
            </Typography>

            {/* Inputs: Role Name & Description Side-by-Side */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2.5,
                mb: 3,
              }}
            >
              <ControlledBaseInput
                name="name"
                control={control}
                label={
                  <Box component="span" sx={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                    Role name
                  </Box>
                }
                placeholder="Merchant Supervisor"
                disabled={isEdit}
                sx={ROLE_INPUT_SX}
              />
              <ControlledBaseInput
                name="description"
                control={control}
                label={
                  <Box component="span" sx={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>
                    Description{" "}
                    <Box component="span" sx={{ color: palette.slate[400], fontWeight: 400 }}>
                      (Optional)
                    </Box>
                  </Box>
                }
                placeholder="Manages merchant branches and consumer bills"
                disabled={isEdit}
                sx={ROLE_INPUT_SX}
              />
            </Box>

            {/* Access Header */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "16px", color: "#0F172A", mb: 0.5 }}>
                Access
              </Typography>
              <Typography sx={{ fontSize: "12.5px", color: palette.slate[500] }}>
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
            <PermissionMatrixTable isChecked={isChecked} onToggle={toggleCategory} />

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
                  minWidth: 88,
                  height: 38,
                  px: 2.5,
                  borderRadius: "8px",
                  borderColor: palette.slate[200],
                  color: "#0F172A",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13.5px",
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
                  minWidth: 92,
                  height: 38,
                  px: 3,
                  borderRadius: "8px",
                  bgcolor: "#1B5299",
                  color: "#FFFFFF",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13.5px",
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
                fontSize: { xs: "18px", sm: "20px" },
                color: "#0F172A",
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              Review Role
            </Typography>
            <Typography sx={{ fontSize: "13px", color: palette.slate[500], mb: 3 }}>
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

            <PermissionMatrixTable isChecked={isChecked} readOnly />

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
                  minWidth: 88,
                  height: 38,
                  px: 2.5,
                  borderRadius: "8px",
                  borderColor: palette.slate[200],
                  color: "#0F172A",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13.5px",
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
                  height: 38,
                  px: 3,
                  borderRadius: "8px",
                  bgcolor: "#1B5299",
                  color: "#FFFFFF",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13.5px",
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
