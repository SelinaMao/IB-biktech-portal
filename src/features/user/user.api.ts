import { baseApi } from "@/store/baseApi";
import { adminApi } from "@/config/api.config";
import { toIntlPhone } from "@/utils/phone";
import { transformResponse } from "@/utils/transform-response";
import type { PageResponse } from "@core/types/pagination";
import type {
  ActivateUserPayload,
  AdminUser,
  AdminUserEntry,
  CreateUserPayload,
  DeactivateUserPayload,
  ListUsersArgs,
  UserAccountScope,
} from "./user.types";
import { UserInfoValues } from "./schema/user.schema";

/**
 * Backoffice user endpoints, injected into the single root `baseApi`. Like RBAC,
 * these have no dedicated BFF route, so they ride the passthrough at
 * `/api/bank/[...path]` — hence the `bank/` prefix. The core envelope is
 * unwrapped to `data` by `transformResponse`.
 */

const bank = (path: string) => `bank/${path}`;
const withId = (path: string, id: string) =>
  path.replace("{id}", encodeURIComponent(id));

/**
 * The person, as the server describes one.
 *
 * The form also carries screen-only state (status, limit rows); sending it upstream would only
 * invite a validation error over fields nobody reads. Chosen accounts travel separately. Email is
 * left out entirely when blank — an empty string is not a valid address.
 *
 * The phone field holds only the local part beside its +855 prefix. It goes out as `855…`: the
 * server stores it as sent, and forgot-password looks the user up by that form.
 */
const personOf = (values: UserInfoValues) => ({
  firstName: values.firstName.trim(),
  lastName: values.lastName.trim(),
  username: values.username.trim(),
  email: values.email?.trim() || undefined,
  phone: toIntlPhone(values.phone) || undefined,
  roleId: values.roleId,
});

/** No account chosen means every account. */
const accountScopeOf = (accountIds: string[] | undefined): UserAccountScope =>
  accountIds?.length
    ? { scopeType: "SELECTED", accountNumbers: accountIds }
    : { scopeType: "ALL", accountNumbers: [] };

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listUsers: build.query<PageResponse<AdminUserEntry>, ListUsersArgs | void>({
      query: (args) => {
        const { page = 0, size = 20, search, status } = args ?? {};
        const params = new URLSearchParams({
          page: String(page),
          size: String(size),
        });
        // OrgUserController reads `q`. Sending `search` binds to nothing and Spring
        // drops it silently, so every keystroke re-fetched the same unfiltered page.
        if (search?.trim()) params.set("q", search.trim());
        if (status) params.set("status", status);
        return `${bank(adminApi.USER.LIST)}?${params.toString()}`;
      },
      transformResponse,
      providesTags: (result) =>
        result
          ? [
            ...result.content.map((entry) => ({
              type: "User" as const,
              id: entry.user.id,
            })),
            { type: "User" as const, id: "LIST" },
          ]
          : [{ type: "User" as const, id: "LIST" }],
    }),

    /** GET admin/users/{id} — same envelope shape as a list row: `{ user, deactivation* }`. */
    getUserDetail: build.query<AdminUserEntry, string>({
      query: (id) => bank(withId(adminApi.USER.DETAIL, id)),
      transformResponse,
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),

    /** GET org/users/{id}/account-scope — the accounts this user may use. */
    getUserAccountScope: build.query<UserAccountScope, string>({
      query: (id) => bank(withId(adminApi.USER.ACCOUNT_SCOPE, id)),
      transformResponse,
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),

    createUser: build.mutation<AdminUser, UserInfoValues>({
      query: (values) => ({
        url: bank(adminApi.USER.CREATE),
        method: "POST",
        body: { ...personOf(values), accountNumbers: accountScopeOf(values.accountIds).accountNumbers },
      }),
      transformResponse,
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    /**
     * Details, roles and accounts are separate upstream calls, so this makes each one needed.
     *
     * Roles were being sent in the PATCH body, which only carries a person's details — so
     * changing someone's role in the dialog did nothing at all, silently. Accounts are sent only
     * when they changed, so saving a name never touches what the user may use.
     */
    updateUser: build.mutation<AdminUser, UserInfoValues & { id: string; accountsChanged?: boolean }>({
      async queryFn({ id, accountsChanged, ...values }, _api, _extra, baseQuery) {
        const { username, ...person } = personOf(values);
        void username; // Permanent, and the details endpoint does not accept it.

        const detail = await baseQuery({
          url: bank(withId(adminApi.USER.UPDATE, id)),
          method: "PATCH",
          body: person,
        });
        if (detail.error) return { error: detail.error };

        if (values.roleId) {
          const roles = await baseQuery({
            url: bank(`${withId(adminApi.USER.DETAIL, id)}/roles`),
            method: "PUT",
            body: { roleIds: [values.roleId] },
          });
          if (roles.error) return { error: roles.error };
        }

        if (accountsChanged) {
          const accounts = await baseQuery({
            url: bank(withId(adminApi.USER.ACCOUNT_SCOPE, id)),
            method: "PUT",
            body: accountScopeOf(values.accountIds),
          });
          if (accounts.error) return { error: accounts.error };
        }
        return { data: transformResponse(detail.data as never) as AdminUser };
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    unlockUser: build.mutation<AdminUserEntry, string>({
      query: (id) => ({ url: bank(withId(adminApi.USER.UNLOCK, id)), method: "PATCH" }),
      transformResponse,
      invalidatesTags: (_r, _e, id) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),

    activateUser: build.mutation<AdminUser, ActivateUserPayload>({
      query: ({ id, reason }) => ({
        url: bank(withId(adminApi.USER.ACTIVATE, id)),
        method: "PATCH",
        body: { reason },
      }),
      transformResponse,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    deactivateUser: build.mutation<AdminUser, DeactivateUserPayload>({
      query: ({ id, reason }) => ({
        url: bank(withId(adminApi.USER.DEACTIVATE, id)),
        method: "PATCH",
        body: { reason },
      }),
      transformResponse,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useListUsersQuery,
  useGetUserDetailQuery,
  useGetUserAccountScopeQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useUnlockUserMutation
} = userApi;
