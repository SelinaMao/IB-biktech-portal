import { createApi } from "@reduxjs/toolkit/query/react";
import { themisBaseQuery } from "./baseQuery";

/**
 * Single root RTK Query API. Each feature/context extends it via
 * `baseApi.injectEndpoints(...)` (see src/features/<context>/api.ts) instead of
 * creating its own API — this keeps one cache, one middleware, one set of tags.
 *
 * `tagTypes` drives cache invalidation across contexts. Add a tag here when a
 * new server resource needs cache coordination.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: themisBaseQuery,
  tagTypes: ["Session", "Role", "Permission", "User", "DeviceBinding", "Account", "TransactionLimit", "Meta", "WorkflowRule", "WorkflowFunction", "WorkflowInstance", "WorkflowTask", "ApproverGroup", "Entitlement", "Capability"],
  endpoints: () => ({}),
});
