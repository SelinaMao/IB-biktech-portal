import { adminApi } from "@/config/api.config";
import { baseApi } from "@/store/baseApi";
import { transformResponse, type TransformResponse } from "@/utils/transform-response";
import type { TransferResult } from "@/features/transfer";
import type {
  BillInquiryRequest,
  BillPaymentRequest,
  PhoneInquiryRequest,
  PhoneInquiryResult,
  PhoneTopUpTransferRequest,
} from "./payment.types";

const bank = (path: string) => `bank/${path}`;
type Idempotent<T> = { body: T; idempotencyKey: string };
const idemHeader = (key: string) => ({ "Idempotency-Key": key });

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Validates the biller/customer pair before the user submits a payment. */
    inquireBill: build.mutation<unknown, BillInquiryRequest>({
      query: (body) => ({
        url: bank(adminApi.PAYMENT.BILL_INQUIRY),
        method: "POST",
        body,
      }),
      transformResponse,
    }),

    /** Submits a bill payment request; workflow rules determine its checker approval chain. */
    submitBillPayment: build.mutation<TransferResult, Idempotent<BillPaymentRequest>>({
      query: ({ body, idempotencyKey }) => ({
        url: bank(adminApi.PAYMENT.BILL_UTILITY),
        method: "POST",
        body,
        headers: idemHeader(idempotencyKey),
      }),
      transformResponse,
      invalidatesTags: [
        "Account",
        "TransferTemplate",
        { type: "WorkflowInstance", id: "LIST" },
        { type: "WorkflowInstance", id: "SUMMARY" },
      ],
    }),

    /**
     * Submit PIN-less phone top-up.
     * Backed by `POST /api/v1/payment/bills/phone-topup/pinless`.
     * Returns a TransferResult with an authenticator challenge (qrPayload / qrConfirm).
     */
    submitPhoneTopUp: build.mutation<TransferResult, Idempotent<PhoneTopUpTransferRequest>>({
      query: ({ body, idempotencyKey }) => ({
        url: bank(adminApi.PAYMENT.PHONE_TOPUP_PINLESS),
        method: "POST",
        body,
        headers: idemHeader(idempotencyKey),
      }),
      invalidatesTags: ["Account", "TransferTemplate", "Schedule"],
      transformResponse: (
        response: TransformResponse<
          TransferResult & { qrConfirm?: string; qrPayload?: string; requestId?: string }
        >,
      ) => {
        const data = response?.data;
        if (!data) return data;

        const rawQr =
          data.authenticator?.qrPayload ||
          (data.authenticator as { qrConfirm?: string } | undefined)?.qrConfirm ||
          data.qrConfirm ||
          data.qrPayload;

        if (rawQr && !data.authenticator) {
          return {
            ...data,
            authenticator: {
              requestId: data.requestId || data.referenceId,
              qrPayload: rawQr,
              channel: "MOBILE",
              expiresAt: new Date(Date.now() + 120_000).toISOString(),
            },
          };
        } else if (data.authenticator && rawQr && !data.authenticator.qrPayload) {
          return {
            ...data,
            authenticator: {
              ...data.authenticator,
              qrPayload: rawQr,
            },
          };
        }
        return data;
      },
    }),

    /**
     * Submit PIN-code phone top-up (voucher / digital pin code).
     * Backed by `POST /api/v1/payment/bills/phone-topup/pincode`.
     */
    submitPhoneTopUpPincode: build.mutation<TransferResult, Idempotent<PhoneTopUpTransferRequest>>({
      query: ({ body, idempotencyKey }) => ({
        url: bank(adminApi.PAYMENT.PHONE_TOPUP_PINCODE),
        method: "POST",
        body,
        headers: idemHeader(idempotencyKey),
      }),
      invalidatesTags: ["Account", "TransferTemplate", "Schedule"],
      transformResponse: (
        response: TransformResponse<
          TransferResult & { qrConfirm?: string; qrPayload?: string; requestId?: string }
        >,
      ) => {
        const data = response?.data;
        if (!data) return data;

        const rawQr =
          data.authenticator?.qrPayload ||
          (data.authenticator as { qrConfirm?: string } | undefined)?.qrConfirm ||
          data.qrConfirm ||
          data.qrPayload;

        if (rawQr && !data.authenticator) {
          return {
            ...data,
            authenticator: {
              requestId: data.requestId || data.referenceId,
              qrPayload: rawQr,
              channel: "MOBILE",
              expiresAt: new Date(Date.now() + 120_000).toISOString(),
            },
          };
        } else if (data.authenticator && rawQr && !data.authenticator.qrPayload) {
          return {
            ...data,
            authenticator: {
              ...data.authenticator,
              qrPayload: rawQr,
            },
          };
        }
        return data;
      },
    }),

    /**
     * Inquires telco/provider details by phone number.
     * Backed by `POST /api/v1/payment/phone-topups/inquiry`.
     */
    inquirePhone: build.mutation<PhoneInquiryResult, PhoneInquiryRequest>({
      query: (body) => ({
        url: bank(adminApi.PAYMENT.PHONE_TOPUP_INQUIRY),
        method: "POST",
        body,
      }),
      transformResponse,
    }),
  }),
});

export const {
  useInquireBillMutation,
  useSubmitBillPaymentMutation,
  useSubmitPhoneTopUpMutation,
  useSubmitPhoneTopUpPincodeMutation,
  useInquirePhoneMutation,
} = paymentApi;
