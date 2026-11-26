import { adminApi } from "@/config/api.config";
import { baseApi } from "@/store/baseApi";
import { transformResponse } from "@/utils/transform-response";
import type { BulkTransferResult } from "@/features/transfer/transfer.types";

const bank = (path: string) => `bank/${path}`;
const withReference = (referenceId: string) =>
  adminApi.PAYROLL.ONE.replace("{referenceId}", encodeURIComponent(referenceId));

type IdempotentForm = { body: FormData; idempotencyKey: string };

export interface PayrollValidation {
  fromAccountNumber: string;
  fromAccountName: string;
  currency: string;
  fileName: string;
  rows: {
    rowNumber: number;
    employeeName: string;
    accountNumber: string;
    bank: string;
    amount: number;
    currency: string;
    remarks?: string | null;
    status: "VALID" | "DUPLICATE" | "INVALID";
    valid: boolean;
    receiverName?: string | null;
    duplicates: number;
    errors: string[];
  }[];
  summary: {
    records: number;
    validRecords: number;
    invalidRecords: number;
    duplicateRecords: number;
    transferAmount: number;
    currency: string;
  };
}

export const payrollApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    downloadPayrollTemplate: build.query<Blob, "CSV" | "EXCEL">({
      query: (format) => ({
        url: bank(adminApi.PAYROLL.TEMPLATE),
        params: { format },
        responseHandler: (response) => response.blob(),
      }),
    }),
    validatePayrollFile: build.mutation<PayrollValidation, { body: FormData; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({
        url: bank(adminApi.PAYROLL.VALIDATE),
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse,
    }),
    submitPayrollFile: build.mutation<BulkTransferResult, IdempotentForm>({
      query: ({ body, idempotencyKey }) => ({
        url: bank(adminApi.PAYROLL.SUBMIT),
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse,
      invalidatesTags: ["Account"],
    }),
    requestPayrollAuthenticator: build.mutation<BulkTransferResult, { referenceId: string; idempotencyKey: string }>({
      query: ({ referenceId, idempotencyKey }) => ({
        url: bank(adminApi.PAYROLL.NEW_AUTHENTICATOR.replace("{referenceId}", encodeURIComponent(referenceId))),
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse,
    }),
    getPayroll: build.query<BulkTransferResult, string>({
      query: (referenceId) => bank(withReference(referenceId)),
      transformResponse,
    }),
  }),
});

export const {
  useLazyDownloadPayrollTemplateQuery,
  useValidatePayrollFileMutation,
  useSubmitPayrollFileMutation,
  useRequestPayrollAuthenticatorMutation,
  useGetPayrollQuery,
  useLazyGetPayrollQuery,
} = payrollApi;

