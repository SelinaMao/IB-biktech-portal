import { adminApi } from "@/config/api.config";
import { baseApi } from "@/store/baseApi";
import { transformResponse } from "@/utils/transform-response";
import type {
  PageScheduleRunResponse,
  ScheduleActionRequest,
  ScheduleDetailResponse,
  ScheduleResponse,
} from "./schedule.types";

const bank = (path: string) => `bank/${path}`;
const withParam = (path: string, name: string, value: string) =>
  path.replace(`{${name}}`, encodeURIComponent(value));

export const scheduleApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV !== "production",
  endpoints: (build) => ({
    /**
     * Lists the company's scheduled transfers.
     * Backed by `GET /api/v1/payment/schedules`
     */
    listSchedules: build.query<ScheduleResponse[], void>({
      query: () => bank(adminApi.SCHEDULE.LIST),
      transformResponse,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ referenceId }) => ({
                type: "Schedule" as const,
                id: referenceId,
              })),
              { type: "Schedule" as const, id: "LIST" },
            ]
          : [{ type: "Schedule" as const, id: "LIST" }],
    }),

    /**
     * Gets one scheduled transfer and its pending / history run counts.
     * Backed by `GET /api/v1/payment/schedules/{referenceId}`
     */
    getScheduleDetail: build.query<ScheduleDetailResponse, string>({
      query: (referenceId) =>
        bank(withParam(adminApi.SCHEDULE.ONE, "referenceId", referenceId)),
      transformResponse,
      providesTags: (_result, _error, referenceId) => [
        { type: "Schedule" as const, id: referenceId },
      ],
    }),

    /**
     * Lists a scheduled transfer's run transactions (pending or history).
     * Backed by `GET /api/v1/payment/schedules/{referenceId}/transactions`
     */
    listScheduleTransactions: build.query<
      PageScheduleRunResponse,
      {
        referenceId: string;
        view?: "PENDING" | "HISTORY";
        page?: number;
        size?: number;
      }
    >({
      query: ({ referenceId, view = "PENDING", page = 0, size = 20 }) => ({
        url: bank(withParam(adminApi.SCHEDULE.TRANSACTIONS, "referenceId", referenceId)),
        params: { view, page, size },
      }),
      transformResponse,
    }),

    /**
     * Requests a state change (PAUSE, RESUME, CANCEL) on a scheduled transfer.
     * Tries:
     * 1. POST /api/v1/payment/schedules/{referenceId}/actions
     * 2. POST /api/v1/payment/schedules/{referenceId}/{pause|resume|cancel}
     * 3. PUT /api/v1/payment/schedules/{referenceId} with status
     * 4. POST /api/v1/payment/schedules/transactions/{referenceId}/actions
     */
    requestScheduleAction: build.mutation<
      unknown,
      {
        referenceId: string;
        action: ScheduleActionRequest["action"];
        idempotencyKey?: string;
      }
    >({
      async queryFn(args, _api, _extraOptions, baseQuery) {
        const idemKey = args.idempotencyKey || crypto.randomUUID();
        const ref = encodeURIComponent(args.referenceId);
        const headers = {
          "Idempotency-Key": idemKey,
        };

        // 1. Try standard schedule action: POST payment/schedules/{referenceId}/actions
        let res = await baseQuery({
          url: bank(`payment/schedules/${ref}/actions`),
          method: "POST",
          headers,
          body: { action: args.action },
        });

        // 2. Try sub-path action: POST payment/schedules/{referenceId}/{pause|resume|cancel}
        if (res.error) {
          const subAction = args.action.toLowerCase();
          const subRes = await baseQuery({
            url: bank(`payment/schedules/${ref}/${subAction}`),
            method: "POST",
            headers,
            body: {},
          });
          if (!subRes.error) {
            res = subRes;
          }
        }

        // 3. Try status update: PUT payment/schedules/{referenceId}
        if (res.error) {
          const statusMap: Record<ScheduleActionRequest["action"], string> = {
            PAUSE: "PAUSED",
            RESUME: "ACTIVE",
            CANCEL: "CANCELLED",
          };
          const putRes = await baseQuery({
            url: bank(`payment/schedules/${ref}`),
            method: "PUT",
            headers,
            body: { status: statusMap[args.action] },
          });
          if (!putRes.error) {
            res = putRes;
          }
        }

        // 4. Fallback to transaction actions endpoint if present
        if (res.error) {
          const txRes = await baseQuery({
            url: bank(`payment/schedules/transactions/${ref}/actions`),
            method: "POST",
            headers,
            body: { action: args.action },
          });
          if (!txRes.error) {
            res = txRes;
          }
        }

        if (res.error) {
          return { error: res.error };
        }
        return { data: res.data };
      },
      invalidatesTags: (_result, _error, { referenceId }) => [
        { type: "Schedule" as const, id: referenceId },
        { type: "Schedule" as const, id: "LIST" },
      ],
    }),

    /**
     * Updates an existing scheduled transfer with new details.
     * Backed by `PUT /api/v1/payment/schedules/{referenceId}`
     */
    updateSchedule: build.mutation<
      unknown,
      {
        referenceId: string;
        body: Record<string, unknown>;
        method?: "PUT" | "POST" | "PATCH";
        idempotencyKey?: string;
      }
    >({
      query: ({ referenceId, body, method = "PUT", idempotencyKey }) => ({
        url: bank(withParam(adminApi.SCHEDULE.ONE, "referenceId", referenceId)),
        method,
        headers: {
          "Idempotency-Key": idempotencyKey || crypto.randomUUID(),
        },
        body,
      }),
      transformResponse,
      invalidatesTags: (_result, _error, { referenceId }) => [
        { type: "Schedule" as const, id: referenceId },
        { type: "Schedule" as const, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useListSchedulesQuery,
  useGetScheduleDetailQuery,
  useLazyGetScheduleDetailQuery,
  useListScheduleTransactionsQuery,
  useRequestScheduleActionMutation,
  useUpdateScheduleMutation,
} = scheduleApi;
