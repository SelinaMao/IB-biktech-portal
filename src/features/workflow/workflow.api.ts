import { adminApi } from "@/config/api.config";
import { baseApi } from "@/store/baseApi";
import { transformResponse } from "@/utils/transform-response";
import type { PageResponse } from "@core/types/pagination";
import type { AuthenticatorRequest } from "@/features/authenticator";

import type {
  ApproverGroup,
  AssignEntitlementPayload,
  EligibleApprover,
  Entitlement,
  FunctionApprover,
  InstanceDetail,
  InstanceStatus,
  InstanceSummary,
  OrgRuleBatchPayload,
  OrgRuleBatchResult,
  OrgWorkflowRule,
  OrgWorkflowRulePayload,
  SaveApproverGroupPayload,
  TaskDecision,
  TaskInboxRow,
  TaskStatus,
  WorkflowFunction,
} from "./workflow.types";

/** Caller-scoped upstream endpoints ride the transparent passthrough. */
const bank = (path: string) => `bank/${path}`;
const fill = (path: string, key: string, value: string) =>
  path.replace(`{${key}}`, encodeURIComponent(value));

export const workflowApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** The actions this organization can put behind approval. */
    listWorkflowFunctions: build.query<WorkflowFunction[], void>({
      query: () => bank(`${adminApi.WORKFLOW.FUNCTIONS}?scope=ORGANIZATION`),
      transformResponse,
      providesTags: [{ type: "WorkflowFunction" as const, id: "LIST" }],
    }),

    listOrgRules: build.query<OrgWorkflowRule[], void>({
      query: () => adminApi.WORKFLOW.RULES,
      transformResponse,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "WorkflowRule" as const, id })),
              { type: "WorkflowRule" as const, id: "LIST" },
            ]
          : [{ type: "WorkflowRule" as const, id: "LIST" }],
    }),

    /**
     * A new rule: one per chosen action, each holding every slab, saved together. "All" leaves an
     * action's own rule alone; naming an action replaces what it had.
     */
    createOrgRules: build.mutation<OrgRuleBatchResult, OrgRuleBatchPayload>({
      query: (body) => ({ url: adminApi.WORKFLOW.RULES_BATCH, method: "POST", body }),
      transformResponse,
      invalidatesTags: [{ type: "WorkflowRule", id: "LIST" }],
    }),

    updateOrgRule: build.mutation<
      OrgWorkflowRule,
      { ruleId: string; body: OrgWorkflowRulePayload }
    >({
      query: ({ ruleId, body }) => ({
        url: fill(adminApi.WORKFLOW.RULE, "ruleId", ruleId),
        method: "PUT",
        body,
      }),
      transformResponse,
      invalidatesTags: (_result, _error, { ruleId }) => [
        { type: "WorkflowRule", id: ruleId },
        { type: "WorkflowRule", id: "LIST" },
      ],
    }),

    deleteOrgRule: build.mutation<void, string>({
      query: (ruleId) => ({
        url: fill(adminApi.WORKFLOW.RULE, "ruleId", ruleId),
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "WorkflowRule", id: "LIST" }],
    }),

    /** Seeds the matrix from the bank's template. Refused once a config already exists. */
    cloneTemplate: build.mutation<void, void>({
      query: () => ({ url: adminApi.WORKFLOW.CLONE_TEMPLATE, method: "POST" }),
      invalidatesTags: [{ type: "WorkflowRule", id: "LIST" }],
    }),

    /**
     * Who can satisfy a requirement right now — asked while a rule is being written, so an
     * impossible chain is visible before saving rather than refused after.
     */
    /**
     * Colleagues who may sign. Omit the function for the whole pool, before one is chosen.
     *
     * Approve is a verb, so eligibility is read from what a role grants — there is no capability
     * to ask for and no approver flag anywhere.
     */
    listEligibleApprovers: build.query<EligibleApprover[], { function?: string } | void>({
      query: (args) => {
        const fn = args?.function;
        return fn && fn !== "*"
          ? `${adminApi.WORKFLOW.ELIGIBLE_APPROVERS}?function=${encodeURIComponent(fn)}`
          : adminApi.WORKFLOW.ELIGIBLE_APPROVERS;
      },
      transformResponse,
    }),

    /**
     * Who could sign these actions, resolved by the engine the way it will when a request is
     * raised — narrowed to anyone in the groups given, where an empty group counts everyone. With
     * several actions, only the people who can sign every one of them: the only people a rule
     * covering all of them may name.
     */
    listFunctionApprovers: build.query<
      FunctionApprover[],
      { functionCodes: string[]; groupKeys?: string[] }
    >({
      query: ({ functionCodes, groupKeys }) => {
        const params = new URLSearchParams();
        functionCodes.forEach((code) => params.append("codes", code));
        (groupKeys ?? []).forEach((key) => params.append("groupKey", key));
        return `${adminApi.WORKFLOW.FUNCTION_APPROVERS}?${params.toString()}`;
      },
      transformResponse,
    }),

    listApproverGroups: build.query<ApproverGroup[], void>({
      query: () => bank(adminApi.APPROVER_GROUP.LIST),
      transformResponse,
      providesTags: [{ type: "ApproverGroup" as const, id: "LIST" }],
    }),

    /** The organization's own group. Its key is what a rule references, so it never changes. */
    createApproverGroup: build.mutation<ApproverGroup, SaveApproverGroupPayload>({
      query: (body) => ({ url: bank(adminApi.APPROVER_GROUP.CREATE), method: "POST", body }),
      transformResponse,
      invalidatesTags: [{ type: "ApproverGroup", id: "LIST" }],
    }),

    /** Only the name is editable; the key a mandate names never changes. */
    updateApproverGroup: build.mutation<ApproverGroup, { groupId: string; name: string }>({
      query: ({ groupId, name }) => ({
        url: `${bank(fill(adminApi.APPROVER_GROUP.UPDATE, "groupId", groupId))}?name=${encodeURIComponent(name)}`,
        method: "PATCH",
      }),
      transformResponse,
      invalidatesTags: [{ type: "ApproverGroup", id: "LIST" }],
    }),

    deleteApproverGroup: build.mutation<void, string>({
      query: (groupId) => ({
        url: bank(fill(adminApi.APPROVER_GROUP.DELETE, "groupId", groupId)),
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ApproverGroup", id: "LIST" }],
    }),

    /** List order is the order approvers are asked in under a sequential level. */
    setGroupMembers: build.mutation<ApproverGroup, { groupId: string; userIds: string[] }>({
      query: ({ groupId, userIds }) => ({
        url: bank(fill(adminApi.APPROVER_GROUP.MEMBERS, "groupId", groupId)),
        method: "PUT",
        // SetMembersRequest binds `memberIds`. Sending `userIds` bound to nothing, so the
        // @NotNull refused the request before it reached the handler.
        body: { memberIds: userIds },
      }),
      transformResponse,
      invalidatesTags: [{ type: "ApproverGroup", id: "LIST" }],
    }),

    listUserEntitlements: build.query<Entitlement[], string>({
      query: (userId) => bank(fill(adminApi.ENTITLEMENT.LIST, "userId", userId)),
      transformResponse,
      providesTags: (_result, _error, userId) => [{ type: "Entitlement" as const, id: userId }],
    }),

    assignEntitlement: build.mutation<
      Entitlement,
      { userId: string; body: AssignEntitlementPayload }
    >({
      query: ({ userId, body }) => ({
        url: bank(fill(adminApi.ENTITLEMENT.ASSIGN, "userId", userId)),
        method: "POST",
        body,
      }),
      transformResponse,
      invalidatesTags: (_result, _error, { userId }) => [{ type: "Entitlement", id: userId }],
    }),

    /** Grants several at once, all or nothing — used when a user is created. */
    assignEntitlements: build.mutation<
      Entitlement[],
      { userId: string; entitlements: AssignEntitlementPayload[] }
    >({
      query: ({ userId, entitlements }) => ({
        url: bank(fill(adminApi.ENTITLEMENT.ASSIGN_BULK, "userId", userId)),
        method: "POST",
        body: { entitlements },
      }),
      transformResponse,
      invalidatesTags: (_result, _error, { userId }) => [{ type: "Entitlement", id: userId }],
    }),

    revokeEntitlement: build.mutation<void, { userId: string; entitlementId: string }>({
      query: ({ userId, entitlementId }) => ({
        url: bank(
          fill(fill(adminApi.ENTITLEMENT.REVOKE, "userId", userId), "entitlementId", entitlementId),
        ),
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: "Entitlement", id: userId }],
    }),

    /** The organization's approval queue. */
    listInstances: build.query<
      PageResponse<InstanceSummary>,
      { status?: InstanceStatus; page?: number; size?: number } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && args.status) params.set("status", args.status);
        params.set("page", String((args && args.page) ?? 0));
        params.set("size", String((args && args.size) ?? 20));
        return bank(`${adminApi.WORKFLOW.INSTANCES}?${params.toString()}`);
      },
      transformResponse,
      providesTags: [{ type: "WorkflowInstance" as const, id: "LIST" }],
    }),

    getInstance: build.query<InstanceDetail, string>({
      query: (id) => bank(fill(adminApi.WORKFLOW.INSTANCE, "id", id)),
      transformResponse,
      providesTags: (_result, _error, id) => [{ type: "WorkflowInstance" as const, id }],
    }),

    /** The caller's own inbox. */
    listMyTasks: build.query<PageResponse<TaskInboxRow>, { status?: TaskStatus } | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && args.status) params.set("status", args.status);
        params.set("size", "50");
        return bank(`${adminApi.WORKFLOW.TASKS}?${params.toString()}`);
      },
      transformResponse,
      providesTags: [{ type: "WorkflowTask" as const, id: "LIST" }],
    }),

    /** The authenticator request an APPROVE needs; scanning its QR authorizes the approval. */
    raiseApprovalAuthenticator: build.mutation<AuthenticatorRequest, string>({
      query: (id) => ({
        url: bank(fill(adminApi.WORKFLOW.AUTHENTICATOR, "id", id)),
        method: "POST",
      }),
      transformResponse,
    }),

    actOnInstance: build.mutation<
      void,
      { id: string; decision: TaskDecision; reason?: string; authenticatorRequestId?: string }
    >({
      query: ({ id, decision, reason, authenticatorRequestId }) => ({
        url: bank(fill(adminApi.WORKFLOW.ACT, "id", id)),
        method: "POST",
        body: { decision, reason: reason ?? null, authenticatorRequestId: authenticatorRequestId ?? null },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "WorkflowInstance", id },
        { type: "WorkflowInstance", id: "LIST" },
        { type: "WorkflowTask", id: "LIST" },
      ],
    }),

    cancelInstance: build.mutation<void, string>({
      query: (id) => ({ url: bank(fill(adminApi.WORKFLOW.CANCEL, "id", id)), method: "POST" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "WorkflowInstance", id },
        { type: "WorkflowInstance", id: "LIST" },
        { type: "WorkflowTask", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: process.env.NODE_ENV !== "production",
});

export const {
  useCreateApproverGroupMutation,
  useUpdateApproverGroupMutation,
  useDeleteApproverGroupMutation,
  useAssignEntitlementsMutation,
  useListWorkflowFunctionsQuery,
  useListOrgRulesQuery,
  useCreateOrgRulesMutation,
  useUpdateOrgRuleMutation,
  useDeleteOrgRuleMutation,
  useCloneTemplateMutation,
  useListEligibleApproversQuery,
  useListFunctionApproversQuery,
  useListApproverGroupsQuery,
  useSetGroupMembersMutation,
  useListUserEntitlementsQuery,
  useAssignEntitlementMutation,
  useRevokeEntitlementMutation,
  useListInstancesQuery,
  useGetInstanceQuery,
  useListMyTasksQuery,
  useActOnInstanceMutation,
  useRaiseApprovalAuthenticatorMutation,
  useCancelInstanceMutation,
} = workflowApi;
