import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

/**
 * All client → server traffic goes through the BFF under `/api` (never directly
 * to core banking). `credentials: "include"` sends the httpOnly session cookie.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
});

/**
 * Themis Secure Session (A) integration point — see architecture.md D1.
 *
 * TODO(themis): wrap request bodies for the client→BFF leg and unwrap responses
 * so all payloads are encrypted above TLS. The BFF terminates session A and
 * re-encrypts to core (session B). Until Themis is wired, this is a pass-through
 * so the rest of the data layer can be built and tested.
 */
export const themisBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  return rawBaseQuery(args, api, extraOptions);
};
