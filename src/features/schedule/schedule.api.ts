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
     * Backed by `POST /api/v1/payment/schedules/transactions/{referenceId}/actions`
     */
    requestScheduleAction: build.mutation<
      unknown,
      { referenceId: string; action: ScheduleActionRequest["action"] }
    >({
      query: ({ referenceId, action }) => ({
        url: bank(withParam(adminApi.SCHEDULE.ACTIONS, "referenceId", referenceId)),
        method: "POST",
        body: { action },
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
} = scheduleApi;
