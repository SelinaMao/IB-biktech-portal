import { baseApi } from "@/store/baseApi";
import { adminApi } from "@/config/api.config";
import { transformResponse } from "@/utils/transform-response";
import type {
  BusinessFunction,
  CreateRolePayload,
  ListOrgRolesArgs,
  ListRolesArgs,
  OrgRole,
  PermissionTree,
  Role,
  RoleGrid,
  UpdateRoleApproverPayload,
  UpdateRolePermissionsPayload,
} from "./rbac.types";

/**
 * RBAC endpoints, injected into the single root `baseApi` (one cache, one
 * middleware — see src/store/baseApi.ts). Follows the feature pattern:
 * src/features/<feature>/<feature>.api.ts + injectEndpoints.
 *
 * These endpoints have no hand-written BFF route, so they ride the transparent
 * passthrough at `/api/bank/[...path]` — hence the `bank/` prefix on every URL.
 * The core response envelope (`{ success, data, ... }`) is unwrapped to its
 * `data` by `transformResponse`.
 */

/** Prefix a registry path so it lands on the BFF passthrough route. */
const bank = (path: string) => `bank/${path}`;

/** Fill the `{id}` template in a registry path. */
const withId = (path: string, id: string) =>
  path.replace("{id}", encodeURIComponent(id));

export const rbacApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** `org/roles` returns a plain array — no `Page` envelope, no total count. */
    listRoles: build.query<Role[], ListRolesArgs | void>({
      query: (args) => {
        // org/roles filters server-side on `search` (name and description) and answers
        // with the whole matching list — there is no pagination envelope, so the page
        // slices what comes back.
        const { search, channel } = args ?? {};
        const params = new URLSearchParams();
        if (search?.trim()) params.set("search", search.trim());
        if (channel) params.set("channel", channel);
        const query = params.toString();
        return query ? `${bank(adminApi.ROLE.LIST)}?${query}` : bank(adminApi.ROLE.LIST);
      },
      transformResponse,
      providesTags: (result) =>
        result
          ? [
              ...result.map((role) => ({
                type: "Role" as const,
                id: role.id,
              })),
              { type: "Role" as const, id: "LIST" },
            ]
          : [{ type: "Role" as const, id: "LIST" }],
    }),

    /**
     * GET org/roles — role options for the Create/Edit User wizard's Role
     * select. Returns a plain array under `data`, not a `Page` envelope.
     */
    listOrgRoles: build.query<OrgRole[], ListOrgRolesArgs | void>({
      query: (args) => {
        const { page = 0, size = 200 } = args ?? {};
        const params = new URLSearchParams({
          page: String(page),
          size: String(size),
        });
        return `${bank(adminApi.ORG_ROLE.LIST)}?${params.toString()}`;
      },
      transformResponse,
      providesTags: [{ type: "Role" as const, id: "ORG_LIST" }],
    }),

    /** GET org/roles/{id} — single role, same shape as a `listRoles` row. */
    getRoleDetail: build.query<Role, string>({
      query: (id) => bank(withId(adminApi.ROLE.DETAIL, id)),
      transformResponse,
      providesTags: (_result, _error, id) => [{ type: "Role", id }],
    }),

    createRole: build.mutation<Role, CreateRolePayload>({
      query: (body) => ({
        url: bank(adminApi.ROLE.CREATE),
        method: "POST",
        body,
      }),
      transformResponse,
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),

    updateRolePermissions: build.mutation<Role, UpdateRolePermissionsPayload>({
      query: ({ id, permissionCodes, approvalAuthorities, allowSelfApproval }) => ({
        url: bank(withId(adminApi.ROLE.UPDATE_PERMISSIONS, id)),
        method: "PUT",
        body: { permissionCodes, approvalAuthorities, allowSelfApproval },
      }),
      transformResponse,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),

    /** Whether holders of this role may approve. Eligibility is the role, not a per-action grant. */
    updateRoleApprover: build.mutation<Role, UpdateRoleApproverPayload>({
      query: ({ id, isApprover }) => ({
        url: bank(withId(adminApi.ROLE.UPDATE_APPROVER, id)),
        method: "PATCH",
        body: { isApprover },
      }),
      transformResponse,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Role" as const, id },
        { type: "Role" as const, id: "LIST" },
      ],
    }),

    deleteRole: build.mutation<void, string>({
      query: (id) => ({
        url: bank(withId(adminApi.ROLE.DELETE, id)),
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),

    /** The catalogue, for a role that does not exist yet. */
    businessFunctions: build.query<BusinessFunction[], void>({
      query: () => bank("functions"),
      transformResponse,
      providesTags: [{ type: "Permission", id: "FUNCTIONS" }],
    }),

    /** What one of this organization's roles grants, function by function and verb by verb. */
    roleGrid: build.query<RoleGrid, string>({
      query: (roleId) => bank(`org/roles/${roleId}/functions`),
      transformResponse,
      providesTags: (_r, _e, roleId) => [{ type: "Role", id: roleId }],
    }),

    permissionTree: build.query<PermissionTree, void>({
      query: () => bank(adminApi.PERMISSION.TREE),
      transformResponse,
      providesTags: [{ type: "Permission", id: "TREE" }],
    }),
  }),
});

export const {
  useListRolesQuery,
  useListOrgRolesQuery,
  useGetRoleDetailQuery,
  useCreateRoleMutation,
  useUpdateRoleApproverMutation,
  useUpdateRolePermissionsMutation,
  useDeleteRoleMutation,
  useBusinessFunctionsQuery,
  useRoleGridQuery,
  usePermissionTreeQuery,
} = rbacApi;
