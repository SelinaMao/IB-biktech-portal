import type { AppToastData } from "@core/components/AppToast";

type ErrorEnvelope = {
  message?: string;
  detail?: string;
  referenceCode?: string;
};

/**
 * Turn an RTK Query error into dialog-ready fields. Core, the gateway and the BFF all send the same
 * envelope (`message` / `detail` / `referenceCode`), and the BFF passes it through unchanged, so the
 * user always sees a reference they can quote to support.
 */
export function toToastError(
  error: unknown,
  fallbackTitle: string,
): AppToastData {
  const queryError = error as { data?: unknown } | undefined;
  const raw = queryError?.data;
  const data = (raw !== null && typeof raw === "object" ? raw : {}) as ErrorEnvelope;

  return {
    title: data.message ?? fallbackTitle,
    message: data.detail ?? "Something went wrong. Please try again.",
    referenceCode: data.referenceCode,
  };
}
