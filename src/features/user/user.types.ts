import type { PageArgs } from "@core/types/pagination";

/**
 * Backoffice user domain types — mirrors the auth-service admin surface
 * (AdminUserController). Verified against the live `admin/users` response
 * (2026-07-20): each page item wraps a `user` plus deactivation metadata.
 */

/** A role as embedded on `AdminUser.roles` (verified against `admin/users` 2026-08-28). */
export type AdminUserRole = {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
};

/** The user object nested inside each list item. */
export type AdminUser = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Composed upstream from the two above; read-only. */
  fullName: string;
  phone: string | null;
  /** e.g. "ADMIN". */
  userType: string;
  status: UserStatus;
  organizationId: string | null;
  organizationName: string | null;
  /** Roles the user holds. */
  roles: AdminUserRole[];
  /** ISO timestamp, or null if never logged in. */
  lastLogin: string | null;
  createdAt: string;
};

/** One row from `admin/users` — the user plus its deactivation audit fields. */
export type AdminUserEntry = {
  user: AdminUser;
  deactivationReason: string | null;
  deactivatedBy: string | null;
  deactivatedAt: string | null;
};

/**
 * Observed + expected statuses. Widened with `string` so an unknown upstream
 * status still renders (falls back to a neutral chip).
 */
export type UserStatus =
  | "ACTIVE"
  | "PENDING_ACTIVATION"
  | "INACTIVE"
  | "DEACTIVATED"
  | "LOCKED"
  | (string & {});

type ChipColor = "success" | "warning" | "default" | "error" | "info";

/** Status → label + chip colour. Unknown statuses use the fallback. */
export const USER_STATUS_META: Record<
  string,
  { label: string; color: ChipColor }
> = {
  ACTIVE: { label: "Active", color: "success" },
  PENDING_ACTIVATION: { label: "Pending activation", color: "warning" },
  INACTIVE: { label: "Inactive", color: "default" },
  DEACTIVATED: { label: "Deactivated", color: "error" },
  LOCKED: { label: "Locked", color: "error" },
};

export const userStatusMeta = (status: UserStatus) =>
  USER_STATUS_META[status] ?? { label: status, color: "default" as const };

/** userType options for the create form. */
export const USER_TYPE_OPTIONS = [{ value: "ADMIN", label: "Admin" }];

/**
 * UI-only access-level options for the Create User wizard's Access step.
 * Not persisted — no accessLevel field exists on AdminUser/CreateUserPayload.
 */
export const ACCESS_LEVEL_OPTIONS = [
  { value: "Full Access", label: "Full Access" },
  { value: "CORP_APPROVER", label: "Approver" },
  { value: "Maker", label: "Maker" },
  { value: "Viewer", label: "Viewer" },
];

/**
 * UI-only "Manage Account" checklist for the Create User wizard — mirrors
 * the mockup's fixed account list. Not sourced from the live accounts API;
 * swap for useListAccountsQuery once account-assignment is wired to a real
 * endpoint.
 */
export type ManageAccountOption = { id: string; type: string; number: string };

export const MANAGE_ACCOUNT_OPTIONS: ManageAccountOption[] = [
  { id: "111022998", type: "Savings Account", number: "111 022 998" },
  { id: "222033889", type: "Savings Account", number: "222 033 889" },
  { id: "333044770", type: "Current Account", number: "333 044 770" },
  { id: "555066552", type: "Current Account", number: "555 066 552" },
  { id: "444055661", type: "Term Deposit Account", number: "444 055 661" },
];

/**
 * UI-only transaction categories for the Create User wizard's Limit
 * Parameters Configuration section. Not persisted against a confirmed
 * backend contract yet — mirrors ACCESS_LEVEL_OPTIONS above.
 */
export const LIMIT_CATEGORIES = [
  { key: "ownBankTransfer", label: "Own Bank Transfer" },
  { key: "transferToOtherSme", label: "Transfer to Other SME" },
  { key: "toLocalBankAccount", label: "To Local Bank- Account" },
  { key: "toLocalBankWallet", label: "To Local Bank- Wallet" },
  { key: "payrollUpload", label: "Payroll Upload" },
  { key: "billPayment", label: "Bill Payment" },
] as const;

export type LimitCategoryKey = (typeof LIMIT_CATEGORIES)[number]["key"];

/**
 * POST `admin/users` body.
 * TODO(core): field set assumed (no password — new users land in
 * PENDING_ACTIVATION and activate out-of-band). Confirm against the real
 * create contract, incl. whether roles are sent by name or id.
 */
export type CreateUserPayload = {
  username: string;
  email: string;
  fullName: string;
  userType: string;
  /** Role NAMES to assign. */
  roles: string[];
};

/** GET/PUT `org/users/{id}/account-scope`: which accounts the user may use. */
export type UserAccountScope = {
  scopeType: "ALL" | "SELECTED";
  accountNumbers: string[];
};

/** PATCH `org/users/{id}/deactivate` body. */
export type DeactivateUserPayload = {
  id: string;
  reason: string;
};

/** PATCH `org/users/{id}/reactivate` body. */
export type ActivateUserPayload = {
  id: string;
  reason: string;
};

/** Query args for the paginated user list. */
export type ListUsersArgs = PageArgs & {
  /** Filter by status; omit for all. */
  status?: string;
};
