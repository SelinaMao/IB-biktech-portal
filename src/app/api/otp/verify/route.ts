import { adminApi } from "@/config/api.config";
import { coreFetch, readEnvelope } from "../../_lib/core-client";
import type { VerifyOtpDataDto } from "../../_lib/core-contracts";
import { badRequestResponse, upstreamFailure } from "../../_lib/error-response";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body) {
    return badRequestResponse();
  }


  const upstream = await coreFetch(adminApi.OTP.VERIFY_OTP, {
    method: "POST",
    body,
  });
  const { envelope, raw } = await readEnvelope<VerifyOtpDataDto>(upstream);

  if (!upstream.ok || !envelope?.success) {
    console.log("[verify-otp] error response:", raw ?? envelope);
    return Response.json(raw ?? upstreamFailure("OTP Verification Failed"), {
      status: upstream.ok ? 502 : upstream.status,
    });
  }

  console.log("===================>[verify-otp] success response:", envelope);

  return Response.json({
    success: envelope.success,
    message: envelope.data?.message ?? envelope.message,
    resetToken: envelope.data?.resetToken,
    verificationToken: envelope.data?.verificationToken,
    data: envelope.data,
    error: envelope.error,
    timestamp: envelope.timestamp,
  });
}
