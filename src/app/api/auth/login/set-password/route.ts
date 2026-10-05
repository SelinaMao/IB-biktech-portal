import { adminApi } from "@/config/api.config";
import { coreFetch, readEnvelope } from "../../../_lib/core-client";
import type { SetPasswordDataDto } from "../../../_lib/core-contracts";
import { setSessionCookies } from "../../../_lib/session-cookies";
import { toSessionUser } from "../../../_lib/session-user";
import { badRequestResponse, upstreamFailure } from "../../../_lib/error-response";

/**
 * BFF set-password — shared by both flows that end in a new password:
 *  - forgot-password: body `{token, newPassword}` (token is the resetToken
 *    from otp/verify).
 *  - first-login (forced change): body `{challengeToken, verificationToken,
 *    newPassword}` (challengeToken from login, verificationToken is the
 *    resetToken from otp/verify).
 * Core tells the two apart by which fields are present. See use-auth.ts
 * setPassword() for the client-side union.
 *
 * Upstream contract: CoreEnvelope<SetPasswordDataDto> — see _lib/core-contracts.ts.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body) {
    return badRequestResponse();
  }

  const upstream = await coreFetch(adminApi.AUTH.FORCE_CHANGE_PASSWORD, {
    method: "POST",
    body,
  });
  const { envelope, raw } = await readEnvelope<SetPasswordDataDto>(upstream);

  if (!upstream.ok || !envelope?.success) {
    return Response.json(raw ?? upstreamFailure("Set Password Failed"), {
      status: upstream.ok ? 502 : upstream.status,
    });
  }

  const { accessToken, refreshToken, user, message } = envelope.data ?? {};
  if (!accessToken || !user) {
    // Core set the password but did not complete the login — the client
    // falls back to a normal login with the new password.
    return Response.json({
      success: true,
      message: message ?? envelope.message,
      data: null,
      timestamp: envelope.timestamp,
    });
  }
  await setSessionCookies({ accessToken, refreshToken });
  return Response.json({
    success: true,
    message: message ?? envelope.message,
    data: { user: toSessionUser(user) },
    timestamp: envelope.timestamp,
  });
}
