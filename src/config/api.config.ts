export const adminApi = {
  AUTH: {
    LOGIN: "auth/login", // Body: {usernameOrEmail, password}
    REFRESH: "auth/refresh", // Body: {refreshToken} — the BFF reads it from the cookie.
    // BFF-only: the access token's expiry + the bank's session policy (idle / warning / absolute).
    SESSION: "auth/session",
    LOGOUT: "auth/logout",
    ME: "users/me",
    FORGET_PASSWORD: "auth/forgot-password-otp", // Body: {userId, phone}
    CHANGE_PASSWORD: "auth/password/change",
    SIGNUP_REQUEST_CODE: "auth/signup/request-code", // Body: {accountNumber, nId, phone}
    SIGNUP_VERIFY_OTP: "auth/signup/confirm-code", // Body: {otpId, confirmCode}
    RESEND_OTP: "otp/resend",
    // Body: {token, newPassword} (forgot-password) or {challengeToken, verificationToken, newPassword} (first-login)
    FORCE_CHANGE_PASSWORD: "auth/login/set-password",
  },
  DASHBOARD: {
    SUMMARY: "admin/dashboard/summary",
    INFLOW_OUTFLOW: "admin/dashboard/inflow-outflow",
    PENDING_APPROVAL: "admin/dashboard/pending-approval",
    LATEST_TRANSACTION: "transaction",
  },
  // BOS RBAC — auth-service admin surface (AdminRoleController / AdminPermissionController).
  // `{id}` is filled at call time. Update only REPLACES a role's permission set.
  ROLE: {
    LIST: "org/roles",
    CREATE: "org/roles",
    UPDATE_PERMISSIONS: "org/roles/{id}/permissions",
    UPDATE_APPROVER: "org/roles/{id}/approver",
    DELETE: "org/roles/{id}",
    COMPARE: "org/roles/compare",
    DETAIL: "org/roles/{id}",
  },
  PERMISSION: {
    TREE: "org/roles/permissions/tree",
  },
  // Org-scoped role list (for assigning a role to an org user). Distinct
  // from ROLE above, which is the RBAC role-management surface.
  ORG_ROLE: {
    LIST: "org/roles",
  },
  // Backoffice user management (admin surface). `{id}` is filled at call time.
  // TODO(core): ACTIVATE/DEACTIVATE paths are assumed from the list response's
  // deactivation metadata — confirm against AdminUserController and adjust.
  USER: {
    LIST: "org/users",
    CREATE: "org/users",
    DETAIL: "org/users/{id}",
    UPDATE: "org/users/{id}",
    ACTIVATE: "org/users/{id}/reactivate",
    DEACTIVATE: "org/users/{id}/deactivate",
    UNLOCK: "org/users/{id}/unlock",
    ACCOUNT_SCOPE: "org/users/{id}/account-scope",
  },
  // `data` is an envelope `{ accounts: [...], summary: {...} }` with core
  // field names (accountNumber, availableBalance, ccy, ...) — see account.api.ts#listAccounts.
  ACCOUNT: {
    LIST: "accounts",
    DETAIL: "accounts/detail", // Body: {accountNumber}
    DOWNLOAD: "accounts/download", // Body: {accountNumber, type} — returns the file bytes.
    SUMMARY: "accounts/summary", // Body: {accountNumber, accountBranch, type, numberOfInstallment}
  },
  TRANSACTION: {
    // Body: {accountNumber, type, startedDate, endedDate, limit, offset}
    LIST: "transactions",
    // Body: {accountNumber, type, startedDate, endedDate, fileType} — returns the file bytes.
    // fileType: "PDF" | "CSV" | "EXCEL" picks the exported format.
    DOWNLOAD: "transactions/download",
    // Body: {transactionId, transactionDate, transactionCode, transactionDescription,
    // transactionCurrency, transactionType, transactionAmount, fromAccountName,
    // fromAccountNumber, toAccountName, toAccountNumber} — returns the file bytes.
    DOWNLOAD_DETAIL: "transactions/download-detail",
  },
  // Company + per-user limits. The company row is set by the bank and is read-only
  // here; the organization is always taken from the caller's token, never sent.
  TRANSACTION_LIMIT: {
    ME: "transaction-limits/me",
    ORGANIZATION: "transaction-limits/organization",
    USER: "transaction-limits/users/{userId}",
    USER_UPDATE: "transaction-limits/users/{userId}",
    // DELETE with ?functionCode=&method= — the row's identity never goes in the path.
    USER_RESET: "transaction-limits/users/{userId}/codes",
  },
  DEVICE_BINDING: {
    CREATE_SESSION: "bindings",
    SESSION_STATUS: "bindings/{id}",
    CURRENT_STATE: "bindings/current",
    UNLINK_CURRENT: "bindings/current",
  },
  // A transfer is submitted, authorized on the linked phone, then carried out.
  TRANSFER: {
    CALCULATE: "payment/transfers/calculate", // Body: {transferType, fromAccountNumber, fromAccountCurrency, toAccountNumber, toAccountCurrency, amount, currency}
    OWN_ACCOUNT: "payment/transfers/own-account", // Body: {fromAccountNumber, toAccountNumber, amount, currency, remark}
    AUTHORIZE: "payment/transfers/{referenceId}/authorize", // Body: {authenticatorRequestId}
    NEW_AUTHENTICATOR: "payment/transfers/{referenceId}/authenticator",
  },
  // Authenticator: phone authorization of an action, polled by the session that raised it.
  AUTHENTICATOR: {
    STATUS: "auth/authenticator/{id}",
  },

  OTP: {
    VERIFY_OTP: "otp/verify", // Body: {otpId, confirmCode}
    // Body: {otpId, confirmCode}
    RESEND_OTP: "/otp/resend",
  },
  // Approval workflow. RULES/RULE/CLONE/APPROVERS are BFF routes under /api/workflow
  // (no `bank/` prefix): they resolve the caller's organization from the session token,
  // because upstream takes orgId as a path variable and does not check it against the caller.
  // The rest are caller-scoped upstream and ride the `bank/` passthrough.
  WORKFLOW: {
    RULES: "workflow/rules",
    // One policy for many actions: "All financial", or a few picked by name.
    RULES_BATCH: "workflow/rules/batch",
    RULE: "workflow/rules/{ruleId}",
    CLONE_TEMPLATE: "workflow/config/clone",
    ELIGIBLE_APPROVERS: "workflow/approvers",
    // Who could sign one action, or every one of several — asked of the engine.
    FUNCTION_APPROVERS: "workflow/function-approvers",
    FUNCTIONS: "workflow/functions",
    INSTANCES: "workflow/instances",
    INSTANCE: "workflow/instances/{id}",
    ACT: "workflow/instances/{id}/act", // Body: {decision, reason, authenticatorRequestId} — APPROVE needs the phone's authorization
    AUTHENTICATOR: "workflow/instances/{id}/authenticator", // The QR an APPROVE is authorized with
    CANCEL: "workflow/instances/{id}/cancel",
    TASKS: "workflow/tasks",
  },
  APPROVER_GROUP: {
    LIST: "approver-groups",
    CREATE: "approver-groups",
    UPDATE: "approver-groups/{groupId}/name",
    DELETE: "approver-groups/{groupId}",
    MEMBERS: "approver-groups/{groupId}/members",
  },
  CAPABILITY: {
    LIST: "capabilities",
  },
  ENTITLEMENT: {
    LIST: "users/{userId}/entitlements",
    ASSIGN: "users/{userId}/entitlements",
    ASSIGN_BULK: "users/{userId}/entitlements/bulk",
    REVOKE: "users/{userId}/entitlements/{entitlementId}",
  },
  // system-settings parameters, read by key. The BFF reads only the session keys
  // (api/_lib/session-policy.ts); the browser never asks for parameters itself.
  PARAMETER: {
    GET: "parameters/{key}",
  },
  // Shared lookup data for dropdowns (province, gender, ...). One call
  // returns every category, keyed by category name — see features/meta.
  META: {
    GET: "meta",
    EXCHANGE_RATES: "meta/exchange-rates",
  },
};
