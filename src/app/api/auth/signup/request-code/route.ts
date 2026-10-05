import { adminApi } from "@/config/api.config";
import { coreFetch, readEnvelope } from "../../../_lib/core-client";
import type { SignupRequestCodeDataDto } from "../../../_lib/core-contracts";
import { badRequestResponse, upstreamFailure } from "../../../_lib/error-response";

/**
 * BFF signup OTP request. Forwards {accountNumber, nId, phone} to core, which
 * validates the account/ID pair and sends an OTP to `phone`. No session is
 * created here — the client steps into the OTP dialog on success.
 *
 * Upstream contract: CoreEnvelope<SignupRequestCodeDataDto> — see
 * _lib/core-contracts.ts.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body) {
    return badRequestResponse();
  }

  const upstream = await coreFetch(adminApi.AUTH.SIGNUP_REQUEST_CODE, {
    method: "POST",
    body,
  });
  const { envelope, raw } = await readEnvelope<SignupRequestCodeDataDto>(upstream);

  if (!upstream.ok || !envelope?.success) {
    return Response.json(raw ?? upstreamFailure("Signup Request Failed"), {
      status: upstream.ok ? 502 : upstream.status,
    });
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[signup-request-code] success response:", envelope);
  }

  return Response.json({
    success: envelope.success,
    message: envelope.message,
    data: envelope.data,
    timestamp: envelope.timestamp,
  });
}
