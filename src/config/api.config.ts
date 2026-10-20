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
  // User and role changes are saved, confirmed on the maker's phone (QR), then approved by checkers.
  // Every write above answers {changeId, type, status, authenticator}; nothing changes until approval.
  ORG_CHANGE: {
    LIST: "org/changes",
    AUTHENTICATOR: "org/changes/{id}/authenticator",
  },
  USER: {
    LIST: "org/users",
    CREATE: "org/users",
    DETAIL: "org/users/{id}",
    UPDATE: "org/users/{id}", // PUT: details, roles and accounts as one change
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
    // Body: {accountNumber, limit, offset} — transfers out of the account not yet posted.
    PENDING: "transactions/pending",
    // Body: {accountNumber, startedDate?, endedDate?} — cash in/out per day from the CBS statement; the last 30 days by default.
    CASH_FLOW: "transactions/dashboard",
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
    // DELETE with { functionCode, method } in the body — the row's identity never goes in the URL.
    USER_RESET: "transaction-limits/users/{userId}/codes",
    // AUTHENTICATOR
    USER_AUTHENTICATOR: "transaction-limits/users/{userId}/changes/{changeId}/authenticator",
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
    OTHER_SME_ACCOUNT: "payment/transfers/other-sme-account", // Body: {fromAccountNumber, toAccountNumber, amount, currency, remark}
    BAKONG_LOCAL_BANK: "payment/transfers/bakong-local-bank", // Body: {fromAccountNumber, bankCode, toAccountNumber, amount, currency, remark, isSaveTemplate, schedule}
    BAKONG_WALLET: "payment/transfers/bakong-wallet", // Body: {fromAccountNumber, bakongId, amount, currency, remark, isSaveTemplate, schedule}
    NEW_AUTHENTICATOR: "payment/transfers/{referenceId}/authenticator",
    BANKS: "payment/banks", // Bakong member banks a local bank transfer can pay
  },
  // Bulk transfer: the portal reads the file and sends its rows as JSON; no file is uploaded.
  BULK_TRANSFER: {
    VALIDATE: "payment/bulk-transfers/validate", // Body: {fromAccountNumber, fileName, rows}
    SUBMIT: "payment/bulk-transfers", // Body: {fromAccountNumber, fileName, rows, schedule}
    ONE: "payment/bulk-transfers/{referenceId}",
    NEW_AUTHENTICATOR: "payment/bulk-transfers/{referenceId}/authenticator",
  },
  // Scheduled transfers: listed, read, and paused, resumed or cancelled once the caller's phone authorizes it.
  SCHEDULE: {
    LIST: "payment/schedules",
    ONE: "payment/schedules/{referenceId}",
    TRANSACTIONS: "payment/schedules/{referenceId}/transactions", // Query: view=PENDING|HISTORY, page, size
    ACTIONS: "payment/schedules/transactions/{referenceId}/actions", // One transaction. Body: {action: PAUSE|RESUME|CANCEL}
  },
  // Saved receivers; one is saved when the maker authorizes a transfer that asked for it.
  TRANSFER_TEMPLATE: {
    LIST: "payment/templates", // Query: transferType (optional)
    ONE: "payment/templates/{id}", // PUT body: {templateName}; DELETE
  },
  // Who a transfer would pay, looked up before the payer submits it.
  PAYMENT_INQUIRY: {
    SME_ACCOUNT: "payment/inquiry/sme-account", // Body: {accountNumber}
    EXTERNAL_ACCOUNT: "payment/inquiry/external-bank-account", // Body: {accountNumber, transferPlatform: BANK|BAKONG, transferPlatformCode, boundType: LOCAL}
  },
  // The caller's own notification inbox (notification-service); the same endpoints serve the back office.
  NOTIFICATION: {
    // The bell's three tabs (FSD IB): Query category=TRANSACTION|ALERT|ANNOUNCEMENT, page, size
    INBOX: "notifications/me/inbox",
    UNREAD_COUNTS: "notifications/me/unread-counts", // {transaction, alert, total}; announcements have no read state
    READ_ALL: "notifications/me/read-all",
    READ: "notifications/{id}/read",
    SEEN_MANY: "notifications/seens", // Body: [id, ...]
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
    INSTANCES_SUMMARY: "workflow/instances/summary", // ?category= — the cards above the queue
    INSTANCE: "workflow/instances/{id}",
    ACT: "workflow/instances/{id}/act", // Body: {decision, reason} — REJECT; a corporate APPROVE is given on the phone
    AUTHENTICATOR: "workflow/instances/{id}/authenticator", // The QR an APPROVE is authorized with
    CANCEL: "workflow/instances/{id}/cancel",
    TASKS: "workflow/tasks",
  },
  APPROVER_GROUP: {
    LIST: "approver-groups",
    CREATE: "approver-groups", // POST {groupKey, name, memberIds}: confirmed on the phone, then approved
    UPDATE: "approver-groups/{groupId}", // PUT {name, memberIds}: name and members in order, as one change
    DELETE: "approver-groups/{groupId}",
    CHANGES: "approver-groups/changes", // changes with the approvers, or approved but not applied
    CHANGE_AUTHENTICATOR: "approver-groups/changes/{changeId}/authenticator", // a new QR for the same change
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
  // Channel-wide maintenance window beacon from system-settings-service: a
  // scheduled window when the whole channel (IB for this portal) is turned
  // off, with bilingual banner copy. Separate from per-service switches
  // (which come through meta.maintainerResponses).
  CHANNEL: {
    MAINTENANCE: "channels/{channel}/maintenance",
  },
  // product-fee-service client catalog: PUBLISHED loans and term deposits only, already in
  // sort order. Name/description come in the Accept-Language the BFF forwards (km | en).
  PRODUCT: {
    LIST: "products", // Query: type (optional) — LOAN | TERM_DEPOSIT
  },
  
 

};
