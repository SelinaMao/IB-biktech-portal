import { baseApi } from "@/store/baseApi";
import { adminApi } from "@/config/api.config";
import { transformResponse } from "@/utils/transform-response";

/** Prefix a registry path so it lands on the BFF passthrough route. */
const bank = (path: string) => `bank/${path}`;

/** Fill the `{id}` template in a registry path. */
const withId = (path: string, id: string) =>
  path.replace("{id}", encodeURIComponent(id));

export const otpApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    verifyOtp: build.mutation<any, any>({
      query: (body) => ({
        url: bank(adminApi.OTP.VERIFY_OTP),
        method: "POST",
        body,
      }),
      transformResponse,
    }),
  }),
  overrideExisting: true
});

export const {
  useVerifyOtpMutation
} = otpApi;
