import { adminApi } from "@/config/api.config";
import { baseApi } from "@/store/baseApi";
import { transformResponse } from "@/utils/transform-response";
import type {
  DeviceBindingSession,
  DeviceBindingSessionStatus,
  DeviceBindingState,
  DeviceUnlinkRequest,
  DeviceUnlinkResult,
} from "./bind.types";

const bank = (path: string) => `bank/${path}`;
const withId = (path: string, id: string) =>
  path.replace("{id}", encodeURIComponent(id));

export const bindApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createDeviceBindingSession: build.mutation<DeviceBindingSession, void>({
      query: () => ({
        url: bank(adminApi.DEVICE_BINDING.CREATE_SESSION),
        method: "POST",
      }),
      transformResponse,
      invalidatesTags: [{ type: "DeviceBinding", id: "CURRENT" }],
    }),

    deviceBindingSessionStatus: build.query<
      DeviceBindingSessionStatus,
      string
    >({
      query: (bindingSessionId) =>
        bank(
          withId(
            adminApi.DEVICE_BINDING.SESSION_STATUS,
            bindingSessionId,
          ),
        ),
      transformResponse,
      providesTags: (_result, _error, id) => [
        { type: "DeviceBinding", id },
      ],
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.status === "CONSUMED") {
            dispatch(
              baseApi.util.invalidateTags([
                { type: "DeviceBinding", id: "CURRENT" },
              ]),
            );
          }
        } catch {
          // Status request errors are handled by the binding dialog.
        }
      },
    }),

    currentDeviceBinding: build.query<DeviceBindingState, void>({
      query: () => bank(adminApi.DEVICE_BINDING.CURRENT_STATE),
      transformResponse,
      providesTags: [{ type: "DeviceBinding", id: "CURRENT" }],
    }),

    unlinkCurrentDevice: build.mutation<DeviceUnlinkResult, DeviceUnlinkRequest>({
      query: (body) => ({
        url: bank(adminApi.DEVICE_BINDING.UNLINK_CURRENT),
        method: "DELETE",
        body,
      }),
      transformResponse,
      invalidatesTags: [{ type: "DeviceBinding", id: "CURRENT" }],
    }),
  }),
});

export const {
  useCreateDeviceBindingSessionMutation,
  useCurrentDeviceBindingQuery,
  useLazyCurrentDeviceBindingQuery,
  useDeviceBindingSessionStatusQuery,
  useLazyDeviceBindingSessionStatusQuery,
  useUnlinkCurrentDeviceMutation,
} = bindApi;
