import { adminApi } from "@/config/api.config";
import { baseApi } from "@/store/baseApi";
import { transformResponse } from "@/utils/transform-response";
import type {
  CalculateTransferRequest,
  CalculateTransferResult,
  OwnAccountTransferRequest,
  TransferResult,
} from "./transfer.types";

const bank = (path: string) => `bank/${path}`;
const withParam = (path: string, name: string, value: string) =>
  path.replace(`{${name}}`, encodeURIComponent(value));

export const transferApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    calculateTransfer: build.mutation<CalculateTransferResult, CalculateTransferRequest>({
      query: (body) => ({ url: bank(adminApi.TRANSFER.CALCULATE), method: "POST", body }),
      transformResponse,
    }),

    /** Saves the transfer; nothing moves until the linked phone authorizes it. */
    submitOwnAccountTransfer: build.mutation<TransferResult, OwnAccountTransferRequest>({
      query: (body) => ({ url: bank(adminApi.TRANSFER.OWN_ACCOUNT), method: "POST", body }),
      transformResponse,
    }),

    /** Carries out a submitted transfer once the maker's phone has AUTHORIZED its authenticator request. */
    authorizeTransfer: build.mutation<TransferResult, { referenceId: string; authenticatorRequestId: string }>({
      query: ({ referenceId, authenticatorRequestId }) => ({
        url: bank(withParam(adminApi.TRANSFER.AUTHORIZE, "referenceId", referenceId)),
        method: "POST",
        body: { authenticatorRequestId },
      }),
      transformResponse,
    }),

    /** A new authenticator QR for a transfer still waiting for authorization. */
    requestTransferAuthenticator: build.mutation<TransferResult, string>({
      query: (referenceId) => ({
        url: bank(withParam(adminApi.TRANSFER.NEW_AUTHENTICATOR, "referenceId", referenceId)),
        method: "POST",
      }),
      transformResponse,
    }),
  }),
});

export const {
  useCalculateTransferMutation,
  useSubmitOwnAccountTransferMutation,
  useAuthorizeTransferMutation,
  useRequestTransferAuthenticatorMutation,
} = transferApi;
