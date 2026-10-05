import { adminApi } from "@/config/api.config";
import { coreFetch, readEnvelope } from "../../_lib/core-client";
import type { LoginDataDto } from "../../_lib/core-contracts";
import { setSessionCookies } from "../../_lib/session-cookies";
import { toSessionUser } from "../../_lib/session-user";
import { badRequestResponse, badUpstreamResponse, upstreamFailure } from "../../_lib/error-response";

/**
 * BFF login. Forwards credentials to core, stores the returned tokens as
 * httpOnly cookies (the browser never sees them), and returns only the
 * SessionUser mirror to the client.
 *
 * Upstream contract: CoreEnvelope<LoginDataDto> — see _lib/core-contracts.ts.
 * TODO(themis): decrypt the client→BFF envelope here when session A is wired.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body) {
    return badRequestResponse();
  }

  const upstream = await coreFetch(adminApi.AUTH.LOGIN, {
    method: "POST",
    body,
  });
  const { envelope, raw } = await readEnvelope<LoginDataDto>(upstream);

  console.log("envelope response:", envelope);

  if (!upstream.ok || !envelope?.success) {
    // Pass the core error body through — auth.error.ts reads
    // message/detail/referenceCode from it.
    return Response.json(raw ?? upstreamFailure("Login Failed"), {
      status: upstream.ok ? 502 : upstream.status,
    });
  }


  const { accessToken, refreshToken, user } = envelope.data;
  if (!user) {
    return badUpstreamResponse("Unable to log in right now. Please try again later.");
  }

  if (!accessToken) {
    return Response.json({
      status: "first_login",
      success: envelope.success,
      message: envelope.message,
      data: envelope.data,
      timestamp: envelope.timestamp,
    });
  }

  await setSessionCookies({ accessToken, refreshToken });
  return Response.json({ status: "success", user: toSessionUser(user) });
}
