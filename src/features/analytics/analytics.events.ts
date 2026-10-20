/**
 * Every event the portal sends to Google Analytics, in one place, so a name means the same thing
 * in every report. Add a new event here before calling `trackEvent` with it.
 *
 * Conventions:
 *  - `snake_case`, at most 40 characters, starting with a letter (GA4's rules).
 *  - A success is its own event, named for what happened. A failure is always `action_failed`
 *    with `action` set to the event that would have fired — see `trackFailure`.
 *  - Parameters describe the action (a type, a format, a decision), never the customer: no
 *    names, phones, emails, account numbers, amounts or reference numbers. `trackEvent` drops
 *    anything that looks like one, but don't rely on that.
 */
export const AnalyticsEvent = {
  // ── Session ───────────────────────────────────────────────────────────
  /** GA4 recommended event. `method`. */
  LOGIN: "login",
  /** Correct credentials, but the user must verify their phone and set a password first. */
  FIRST_LOGIN_STARTED: "first_login_started",
  /** First login finished: the new password is set. */
  PASSWORD_SET: "password_set",
  PASSWORD_RESET_REQUESTED: "password_reset_requested",
  PASSWORD_RESET: "password_reset",
  /** GA4 recommended event: the signup OTP was accepted. `method`. */
  SIGN_UP: "sign_up",
  /** `reason`: "user", "idle" or "expired". */
  LOGOUT: "logout",

  // ── Preferences ───────────────────────────────────────────────────────
  /** `from`, `to`. */
  LANGUAGE_CHANGED: "language_changed",

  // ── Transfers ─────────────────────────────────────────────────────────
  /** Saved and waiting for the phone to authorize it. `transfer_type`, `method`, `currency`, `scheduled`. */
  TRANSFER_SUBMITTED: "transfer_submitted",
  /** The phone authorized it and the server carried it out. Same params plus `status`. */
  TRANSFER_COMPLETED: "transfer_completed",
  /** The QR expired and the user asked for a new one. */
  TRANSFER_AUTHORIZATION_RENEWED: "transfer_authorization_renewed",
  TRANSFER_TEMPLATE_RENAMED: "transfer_template_renamed",
  TRANSFER_TEMPLATE_DELETED: "transfer_template_deleted",
  /** `action`: what was asked of a scheduled transfer. */
  SCHEDULE_ACTION_REQUESTED: "schedule_action_requested",

  // ── Accounts ──────────────────────────────────────────────────────────
  /** `document_type`: "statement", "certificate" or "receipt"; `file_extension`. */
  DOCUMENT_DOWNLOADED: "document_downloaded",

  // ── Approvals ─────────────────────────────────────────────────────────
  /** `decision`. */
  APPROVAL_DECIDED: "approval_decided",
  APPROVAL_CANCELLED: "approval_cancelled",

  // ── Mobile app binding ────────────────────────────────────────────────
  DEVICE_BINDING_STARTED: "device_binding_started",
  DEVICE_UNLINKED: "device_unlinked",

  // ── Administration ────────────────────────────────────────────────────
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_ACTIVATED: "user_activated",
  USER_DEACTIVATED: "user_deactivated",
  USER_UNLOCKED: "user_unlocked",
  ROLE_CREATED: "role_created",
  ROLE_PERMISSIONS_UPDATED: "role_permissions_updated",
  ROLE_APPROVER_UPDATED: "role_approver_updated",
  ROLE_DELETED: "role_deleted",
  USER_LIMITS_UPDATED: "user_limits_updated",
  USER_LIMIT_RESET: "user_limit_reset",
  APPROVAL_RULE_CREATED: "approval_rule_created",
  APPROVAL_RULE_UPDATED: "approval_rule_updated",
  APPROVAL_RULE_DELETED: "approval_rule_deleted",
  APPROVAL_TEMPLATE_CLONED: "approval_template_cloned",
  APPROVER_GROUP_CREATED: "approver_group_created",
  APPROVER_GROUP_UPDATED: "approver_group_updated",
  APPROVER_GROUP_DELETED: "approver_group_deleted",
  APPROVER_GROUP_MEMBERS_SET: "approver_group_members_set",
  ENTITLEMENT_ASSIGNED: "entitlement_assigned",
  ENTITLEMENT_REVOKED: "entitlement_revoked",

  // ── Failures ──────────────────────────────────────────────────────────
  /** `action`: the event that would have fired; `error_status`; `error_code`. */
  ACTION_FAILED: "action_failed",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

/** A parameter value GA4 accepts. `null` / `undefined` are dropped, so optional fields can be passed as-is. */
export type AnalyticsParamValue = string | number | boolean | null | undefined;
export type AnalyticsParams = Record<string, AnalyticsParamValue>;
