import { adminApi } from "@/config/api.config";
import { coreFetch, readEnvelope } from "../../_lib/core-client";
import type { ResendOtpDataDto } from "../../_lib/core-contracts";
import { badRequestResponse, upstreamFailure } from "../../_lib/error-response";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body) {
    return badRequestResponse();
  }

  const upstream = await coreFetch(adminApi.OTP.RESEND_OTP, {
    method: "POST",
    body,
  });
  const { envelope, raw } = await readEnvelope<ResendOtpDataDto>(upstream);

  if (!upstream.ok || !envelope?.success) {
    return Response.json(raw ?? upstreamFailure("Resend OTP Failed"), {
      status: upstream.ok ? 502 : upstream.status,
    });
  }
  console.log('------------------------>log Envenlope', envelope)

  return Response.json({
    success: envelope.success,
    message: envelope.data?.message ?? envelope.message,
    data: envelope.data,
    timestamp: envelope.timestamp,
  });
}
