import { adminApi } from "@/config/api.config";
import { coreFetch, readEnvelope } from "../../_lib/core-client";
import type { ForgotPasswordDataDto } from "../../_lib/core-contracts";
import { badRequestResponse, upstreamFailure } from "../../_lib/error-response";

/**
 * BFF forgot-password request. Forwards {usernameOrEmail, phone} to core,
 * which validates the pair and sends an OTP to `phone`. No session is
 * created here — the client steps into the OTP dialog on success.
 *
 * Upstream contract: CoreEnvelope<ForgotPasswordDataDto> — see
 * _lib/core-contracts.ts.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body) {
    return badRequestResponse();
  }

  const upstream = await coreFetch(adminApi.AUTH.FORGET_PASSWORD, {
    method: "POST",
    body,
  });
  const { envelope, raw } = await readEnvelope<ForgotPasswordDataDto>(upstream);

  if (!upstream.ok || !envelope?.success) {
    if (process.env.NODE_ENV !== "production") {

    }
    return Response.json(raw ?? upstreamFailure("Forgot Password Request Failed"), {
      status: upstream.ok ? 502 : upstream.status,
    });
  }

  if (process.env.NODE_ENV !== "production") {
  }
  return Response.json({
    success: envelope.success,
    message: envelope.message,
    data: envelope.data,
    timestamp: envelope.timestamp,
  });
}
