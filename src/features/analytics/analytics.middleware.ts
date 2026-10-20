import { isFulfilled, isRejected, type Middleware } from "@reduxjs/toolkit";
import { trackEvent, trackFailure } from "./analytics";
import { AnalyticsEvent, type AnalyticsEventName, type AnalyticsParams } from "./analytics.events";

type TrackedMutation = {
  event: AnalyticsEventName;
  /** The safe parts of the mutation's argument — enums only, never IDs or customer data. */
  params?: (arg: unknown) => AnalyticsParams;
};

/**
 * Feature usage measured where it happens: when the server answers the mutation behind it. A
 * screen needs no tracking code for these; to measure another one, add its endpoint here.
 *
 * Flows with steps beyond one request (sign-in, transfers, downloads) are tracked where they run
 * instead — useAuth, useTransferAuthorization, the account page.
 */
const TRACKED_MUTATIONS: Record<string, TrackedMutation> = {
  signUpVerifyOtp: { event: AnalyticsEvent.SIGN_UP, params: () => ({ method: "account_number" }) },

  renameTransferTemplate: { event: AnalyticsEvent.TRANSFER_TEMPLATE_RENAMED },
  deleteTransferTemplate: { event: AnalyticsEvent.TRANSFER_TEMPLATE_DELETED },
  requestTransferAuthenticator: { event: AnalyticsEvent.TRANSFER_AUTHORIZATION_RENEWED },
  requestScheduleAction: {
    event: AnalyticsEvent.SCHEDULE_ACTION_REQUESTED,
    params: (arg) => ({ action: (arg as { action?: string }).action }),
  },

  actOnInstance: {
    event: AnalyticsEvent.APPROVAL_DECIDED,
    params: (arg) => ({ decision: (arg as { decision?: string }).decision }),
  },
  cancelInstance: { event: AnalyticsEvent.APPROVAL_CANCELLED },

  createDeviceBindingSession: { event: AnalyticsEvent.DEVICE_BINDING_STARTED },
  unlinkCurrentDevice: { event: AnalyticsEvent.DEVICE_UNLINKED },

  createUser: { event: AnalyticsEvent.USER_CREATED },
  updateUser: { event: AnalyticsEvent.USER_UPDATED },
  activateUser: { event: AnalyticsEvent.USER_ACTIVATED },
  deactivateUser: { event: AnalyticsEvent.USER_DEACTIVATED },
  unlockUser: { event: AnalyticsEvent.USER_UNLOCKED },

  createRole: { event: AnalyticsEvent.ROLE_CREATED },
  updateRolePermissions: { event: AnalyticsEvent.ROLE_PERMISSIONS_UPDATED },
  updateRoleApprover: { event: AnalyticsEvent.ROLE_APPROVER_UPDATED },
  deleteRole: { event: AnalyticsEvent.ROLE_DELETED },

  updateUserLimits: { event: AnalyticsEvent.USER_LIMITS_UPDATED },
  resetUserLimitRow: { event: AnalyticsEvent.USER_LIMIT_RESET },

  createOrgRules: { event: AnalyticsEvent.APPROVAL_RULE_CREATED },
  updateOrgRule: { event: AnalyticsEvent.APPROVAL_RULE_UPDATED },
  deleteOrgRule: { event: AnalyticsEvent.APPROVAL_RULE_DELETED },
  cloneTemplate: { event: AnalyticsEvent.APPROVAL_TEMPLATE_CLONED },
  createApproverGroup: { event: AnalyticsEvent.APPROVER_GROUP_CREATED },
  updateApproverGroup: { event: AnalyticsEvent.APPROVER_GROUP_UPDATED },
  deleteApproverGroup: { event: AnalyticsEvent.APPROVER_GROUP_DELETED },
  setGroupMembers: { event: AnalyticsEvent.APPROVER_GROUP_MEMBERS_SET },
  assignEntitlement: { event: AnalyticsEvent.ENTITLEMENT_ASSIGNED },
  assignEntitlements: { event: AnalyticsEvent.ENTITLEMENT_ASSIGNED },
  revokeEntitlement: { event: AnalyticsEvent.ENTITLEMENT_REVOKED },
};

/** What RTK Query puts on a mutation thunk's `meta.arg`. */
type MutationArg = { type?: string; endpointName?: string; originalArgs?: unknown };

export const analyticsMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);
  if (!isFulfilled(action) && !isRejected(action)) return result;

  const arg = (action.meta as { arg?: MutationArg }).arg;
  if (arg?.type !== "mutation" || !arg.endpointName) return result;
  const tracked = TRACKED_MUTATIONS[arg.endpointName];
  if (!tracked) return result;

  const params = tracked.params?.(arg.originalArgs ?? {});
  if (isFulfilled(action)) {
    trackEvent(tracked.event, params);
  } else if (!action.meta.aborted) {
    // A rejected query carries the server's error envelope as `payload`; a thrown one only `error`.
    trackFailure(tracked.event, action.payload ?? action.error, params);
  }
  return result;
};
