/**
 * Client-side view of the core response envelope, for endpoints the BFF
 * passes through unchanged. Must stay in sync with the server-side contract
 * in src/app/api/_lib/core-contracts.ts (verified 2026-07-18):
 * `{ success, message, data, timestamp }`.
 */
export type TransformResponse<T = unknown> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

/** RTK Query `transformResponse` helper — unwraps the envelope to its data. */
export const transformResponse = <T>(response: TransformResponse<T>): T => {
  return response.data;
};
