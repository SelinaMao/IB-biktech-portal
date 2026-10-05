/**
 * RBAC domain types — mirrors the auth-service admin surface
 * (AdminRoleController / AdminPermissionController). Kept in one place so the
 * API layer (rbac.api.ts) and the UI share a single source of truth.
 *
 * Verified against the live `admin/roles` response (2026-07-20):
 *   data.content[] = Role, wrapped in a Spring `Page` (see PageResponse).
 */

/**
 * Channel a role governs. The permission tree exposes three channels — BOS
 * (back office), CORPORATE, and BOTH (shared/general). A role is scoped to a
 * single real channel; permissions from BOTH are always available on top.
 * Widened with `string` so an unknown upstream channel still renders.
 * ROLE_CHANNEL_OPTIONS drives the create form + list filter.
 */
export type RoleChannel = "BOS" | "CORPORATE" | "BOTH" | (string & {});

/** The shared channel whose permissions apply on top of any role channel. */
export const SHARED_CHANNEL = "BOTH";

export const ROLE_CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: "BOS", label: "Back Office (BOS)" },
  { value: "CORPORATE", label: "Corporate" },
];

/** A single role as returned by `admin/roles`. */
export type Role = {
  id: string;
  name: string;
  description: string;
  channel: RoleChannel;
  /** System roles are seeded by the platform — not editable or deletable. */
  isSystem: boolean;
  /** Holders of this role may satisfy an approval step; the matrix decides which ones must. */
  isApprover: boolean;
  /** Whether a holder may sign a request they raised themselves. Off is maker-checker. */
  allowSelfApproval: boolean;
  /** Flat list of permission codes granted, e.g. "TRANSACTION:RECORD:VIEW". */
  permissionCodes: string[];
  /** Workflow actions holders inherit authority to approve. */
  approvalAuthorities: ApprovalAuthority[];
};

export type ApprovalAuthority = {
  functionCode: string;
  capability: string;
};

/** POST `admin/roles` body. */
export type CreateRolePayload = {
  name: string;
  description: string;
  isApprover?: boolean;
  permissionCodes: string[];
  approvalAuthorities: ApprovalAuthority[];
  allowSelfApproval?: boolean;
};

/** PATCH `org/roles/{id}/approver` body. */
export type UpdateRoleApproverPayload = {
  id: string;
  isApprover: boolean;
};

/** PUT `admin/roles/{id}/permissions` body — REPLACES the whole set. */
export type UpdateRolePermissionsPayload = {
  id: string;
  permissionCodes: string[];
  approvalAuthorities: ApprovalAuthority[];
  /** Omitted leaves the role's current setting alone. */
  allowSelfApproval?: boolean;
};

/** Query args for the paginated role list. */
/** `org/roles` filters but does not page — it answers with the whole matching list. */
export type ListRolesArgs = {
  /** Free-text search over name and description; matched server-side. */
  search?: string;
  /** Filter by channel; omit for all. */
  channel?: string;
};

/**
 * A role as returned by `org/roles` — options for the Create/Edit User
 * wizard's Role select. Org-scoped, distinct from the RBAC `admin/roles`
 * list above. The endpoint returns a plain array (no `Page` envelope).
 */
export type OrgRole = {
  id: string;
  name: string;
  description: string;
  channel: RoleChannel;
  isSystem: boolean;
  orgId: string | null;
  orgName: string | null;
  permissionCodes: string[];
  approvalAuthorities: ApprovalAuthority[];
};

/** Query args for the paginated org role list. */
export type ListOrgRolesArgs = {
  page?: number;
  size?: number;
};

/** Spring `Page<T>` envelope — shared across admin lists. */
export type { PageResponse } from "@core/types/pagination";

/**
 * Permission tree from `org/roles/permissions/tree` (verified 2026-08-28).
 * Grouped channel → module → permission. `transformResponse` unwraps the
 * envelope to `{ channels }`.
 */
export type Permission = {
  code: string;
  description: string;
  /** Module name (null for the ungrouped "General" bucket). */
  module: string | null;
  /** Owning service, e.g. "auth", "payment". */
  serviceScope: string;
};

export type PermissionModule = {
  module: string;
  permissions: Permission[];
};

export type PermissionChannel = {
  channel: string;
  modules: PermissionModule[];
};

export type PermissionTree = {
  channels: PermissionChannel[];
};

/** Field values for the Create/Edit Role wizard form. */
export type RoleWizardValues = {
  name: string;
  description: string;
  allowSelfApproval: boolean;
};

export const DEFAULT_VALUES: RoleWizardValues = {
  name: "",
  description: "",
  allowSelfApproval: false,
};

export type RoleFormDialogProps = {
  open: boolean;
  onClose: () => void;
  role?: Role | null;
};

/* The function+verb model. Approve is a verb here, never a separate flag. */
export type FunctionVerb =
  | "INITIATE" | "CREATE" | "VIEW" | "EDIT" | "DISABLE" | "DELETE" | "CANCEL" | "APPROVE";

export type CatalogueVerb = {
  verb: FunctionVerb;
  approvalRequired: boolean;
  approvable: boolean;
  permissionCode: string | null;
};

export type BusinessFunction = {
  code: string;
  moduleCode: string;
  name: string;
  description?: string | null;
  channel: string;
  needsApproval: boolean;
  active: boolean;
  verbs: CatalogueVerb[];
};

export type GridVerb = {
  verb: FunctionVerb;
  granted: boolean;
  approvalRequired: boolean;
  permissionCode: string | null;
};

export type FunctionGridRow = {
  code: string;
  name: string;
  moduleCode: string;
  needsApproval: boolean;
  verbs: GridVerb[];
};

export type RoleGrid = {
  roleName: string;
  /** Derived: how many functions this role may sign. Never a stored flag. */
  functionsApprovable: number;
  functions: FunctionGridRow[];
};
