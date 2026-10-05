import { adminApi } from "@/config/api.config";
import { baseApi } from "@/store/baseApi";
import { transformResponse } from "@/utils/transform-response";
import type { AuthenticatorStatus } from "./authenticator.types";

export const authenticatorApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Polled by the session that raised the action until the phone authorizes it or it runs out. */
    authenticatorStatus: build.query<AuthenticatorStatus, string>({
      query: (requestId) =>
        `bank/${adminApi.AUTHENTICATOR.STATUS.replace("{id}", encodeURIComponent(requestId))}`,
      transformResponse,
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useLazyAuthenticatorStatusQuery } = authenticatorApi;
