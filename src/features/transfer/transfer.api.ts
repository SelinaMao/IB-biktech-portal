import { adminApi } from "@/config/api.config";
import { baseApi } from "@/store/baseApi";
import { transformResponse } from "@/utils/transform-response";
import type {
  BakongBank,
  BakongLocalBankTransferRequest,
  BakongWalletTransferRequest,
  BulkTransferRequest,
  BulkTransferResult,
  BulkValidationResult,
  CalculateTransferRequest,
  CalculateTransferResult,
  ExternalAccountInquiryRequest,
  ExternalAccountInquiryResult,
  OtherSmeAccountTransferRequest,
  OwnAccountTransferRequest,
  SmeAccountInquiryResult,
  TransferResult,
  TransferTemplate,
  TransferType,
} from "./transfer.types";

const bank = (path: string) => `bank/${path}`;
const withParam = (path: string, name: string, value: string) =>
  path.replace(`{${name}}`, encodeURIComponent(value));

/**
 * Money-movement POSTs are guarded by payment-service's `IdempotencyKeyFilter`
 * (ADR-004 / BR-26). Every submit attempt mints a UUID v4 (see
 * `useIdempotencyKey`) and threads it through here; the backend returns
 * 400 IDEMPOTENCY_KEY_MISSING without it, and the BFF forwards the header
 * untouched (`src/app/api/bank/[...path]/route.ts`).
 */
type Idempotent<T> = { body: T; idempotencyKey: string };
const idemHeader = (key: string) => ({ "Idempotency-Key": key });

export const transferApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Prices a transfer (amount, fee, rate). Not a money-movement POST — it writes nothing
     * — but it lives under `/payment/transfers/calculate`, which the server-side filter
     * guards via the `/api/v1/payment/transfers/**` path pattern (payment-service
     * `application.yml`). Without the header the filter 400s before the handler runs, so
     * every pricing call mints its own fresh UUID. Dedup intent doesn't apply: a stale
     * replay here would just return the earlier quote, which is wrong on retry anyway.
     *
     * Flagged for tech-lead: the ADR-004 wording is "every money-movement POST", so this
     * is a path-pattern side-effect, not a BR-26 requirement. Either narrow the server
     * pattern or accept this fresh-key-per-call pattern long-term.
     */
    calculateTransfer: build.mutation<CalculateTransferResult, CalculateTransferRequest>({
      query: (body) => ({
        url: bank(adminApi.TRANSFER.CALCULATE),
        method: "POST",
        body,
        headers: idemHeader(crypto.randomUUID()),
      }),
      transformResponse,
    }),

    /** Saves the transfer; nothing moves until the linked phone authorizes it, and the server then carries it out. */
    submitOwnAccountTransfer: build.mutation<TransferResult, Idempotent<OwnAccountTransferRequest>>({
      query: ({ body, idempotencyKey }) => ({
        url: bank(adminApi.TRANSFER.OWN_ACCOUNT),
        method: "POST",
        body,
        headers: idemHeader(idempotencyKey),
      }),
      transformResponse,
    }),

    /** Same as own-account, to another SME Bank customer's account. */
    submitOtherSmeAccountTransfer: build.mutation<TransferResult, Idempotent<OtherSmeAccountTransferRequest>>({
      query: ({ body, idempotencyKey }) => ({
        url: bank(adminApi.TRANSFER.OTHER_SME_ACCOUNT),
        method: "POST",
        body,
        headers: idemHeader(idempotencyKey),
      }),
      transformResponse,
    }),

    /** To an account at another local bank, through Bakong. */
    submitBakongLocalBankTransfer: build.mutation<TransferResult, Idempotent<BakongLocalBankTransferRequest>>({
      query: ({ body, idempotencyKey }) => ({
        url: bank(adminApi.TRANSFER.BAKONG_LOCAL_BANK),
        method: "POST",
        body,
        headers: idemHeader(idempotencyKey),
      }),
      transformResponse,
    }),

    /** To a Bakong wallet, by Bakong ID or phone number. */
    submitBakongWalletTransfer: build.mutation<TransferResult, Idempotent<BakongWalletTransferRequest>>({
      query: ({ body, idempotencyKey }) => ({
        url: bank(adminApi.TRANSFER.BAKONG_WALLET),
        method: "POST",
        body,
        headers: idemHeader(idempotencyKey),
      }),
      transformResponse,
    }),

    /** Bakong member banks, for the local bank picker. */
    listBakongBanks: build.query<BakongBank[], void>({
      query: () => bank(adminApi.TRANSFER.BANKS),
      transformResponse,
    }),

    /** Who an account at another bank, or a Bakong wallet, belongs to. */
    inquireExternalAccount: build.mutation<ExternalAccountInquiryResult, ExternalAccountInquiryRequest>({
      query: (body) => ({ url: bank(adminApi.PAYMENT_INQUIRY.EXTERNAL_ACCOUNT), method: "POST", body }),
      transformResponse,
    }),

    /** The receiver's name and currency; refused when the account cannot receive or is the company's own. */
    inquireSmeAccount: build.mutation<SmeAccountInquiryResult, string>({
      query: (accountNumber) => ({
        url: bank(adminApi.PAYMENT_INQUIRY.SME_ACCOUNT),
        method: "POST",
        body: { accountNumber },
      }),
      transformResponse,
    }),

    /** The company's saved receivers the caller may transfer to, most recently used first. */
    listTransferTemplates: build.query<TransferTemplate[], TransferType | void>({
      query: (transferType) => ({
        url: bank(adminApi.TRANSFER_TEMPLATE.LIST),
        params: transferType ? { transferType } : undefined,
      }),
      transformResponse,
      providesTags: ["TransferTemplate"],
    }),

    renameTransferTemplate: build.mutation<TransferTemplate, { id: string; templateName: string }>({
      query: ({ id, templateName }) => ({
        url: bank(withParam(adminApi.TRANSFER_TEMPLATE.ONE, "id", id)),
        method: "PUT",
        body: { templateName },
      }),
      transformResponse,
      invalidatesTags: ["TransferTemplate"],
    }),

    deleteTransferTemplate: build.mutation<void, string>({
      query: (id) => ({
        url: bank(withParam(adminApi.TRANSFER_TEMPLATE.ONE, "id", id)),
        method: "DELETE",
      }),
      invalidatesTags: ["TransferTemplate"],
    }),

    /**
     * A new authenticator QR for a transfer still waiting for authorization.
     * This POST lands on `/payment/transfers/{id}/authenticator`, which is
     * matched by `cbs.idempotency.paths: /api/v1/payment/transfers/**` on the
     * server — so it needs its own idempotency key.
     */
    requestTransferAuthenticator: build.mutation<TransferResult, Idempotent<string>>({
      query: ({ body: referenceId, idempotencyKey }) => ({
        url: bank(withParam(adminApi.TRANSFER.NEW_AUTHENTICATOR, "referenceId", referenceId)),
        method: "POST",
        headers: idemHeader(idempotencyKey),
      }),
      transformResponse,
    }),

    /** Checks the rows read from a bulk file, for Review; nothing is saved. */
    validateBulkTransfer: build.mutation<
      BulkValidationResult,
      Idempotent<Omit<BulkTransferRequest, "schedule">>
    >({
      query: ({ body, idempotencyKey }) => ({
        url: bank(adminApi.BULK_TRANSFER.VALIDATE),
        method: "POST",
        body,
        headers: idemHeader(idempotencyKey),
      }),
      transformResponse,
    }),

    /** Saves the bulk after checking every row again; nothing moves until the linked phone authorizes it. */
    submitBulkTransfer: build.mutation<BulkTransferResult, Idempotent<BulkTransferRequest>>({
      query: ({ body, idempotencyKey }) => ({
        url: bank(adminApi.BULK_TRANSFER.SUBMIT),
        method: "POST",
        body,
        headers: idemHeader(idempotencyKey),
      }),
      transformResponse,
    }),

    requestBulkTransferAuthenticator: build.mutation<BulkTransferResult, Idempotent<string>>({
      query: ({ body: referenceId, idempotencyKey }) => ({
        url: bank(withParam(adminApi.BULK_TRANSFER.NEW_AUTHENTICATOR, "referenceId", referenceId)),
        method: "POST",
        headers: idemHeader(idempotencyKey),
      }),
      transformResponse,
    }),

    /** A bulk and how each of its rows went. */
    getBulkTransfer: build.query<BulkTransferResult, string>({
      query: (referenceId) => ({ url: bank(withParam(adminApi.BULK_TRANSFER.ONE, "referenceId", referenceId)) }),
      transformResponse,
    }),
  }),
});

export const {
  useCalculateTransferMutation,
  useSubmitOwnAccountTransferMutation,
  useSubmitOtherSmeAccountTransferMutation,
  useSubmitBakongLocalBankTransferMutation,
  useSubmitBakongWalletTransferMutation,
  useListBakongBanksQuery,
  useInquireExternalAccountMutation,
  useInquireSmeAccountMutation,
  useListTransferTemplatesQuery,
  useRenameTransferTemplateMutation,
  useDeleteTransferTemplateMutation,
  useRequestTransferAuthenticatorMutation,
  useValidateBulkTransferMutation,
  useSubmitBulkTransferMutation,
  useRequestBulkTransferAuthenticatorMutation,
  useGetBulkTransferQuery,
} = transferApi;
