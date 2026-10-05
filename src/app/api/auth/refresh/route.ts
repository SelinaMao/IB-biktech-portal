import { adminApi } from "@/config/api.config";
import type { RefreshSessionResult } from "@core/types/auth";
import { coreFetch, readEnvelope } from "../../_lib/core-client";
import type { LoginDataDto } from "../../_lib/core-contracts";
import { tokenExpiresAt } from "../../_lib/jwt";
import {
  clearSessionCookies,
  getAccessToken,
  getRefreshToken,
  getSessionStartedAt,
  setSessionCookies,
} from "../../_lib/session-cookies";
import { getSessionPolicy } from "../../_lib/session-policy";
import { badUpstreamResponse, notAuthenticatedResponse, upstreamFailure } from "../../_lib/error-response";

/**
 * BFF token refresh — what "Stay signed in" on the expiry prompt calls. Trades the httpOnly refresh
 * token for a new pair (core rotates both) and rewrites the cookies. The browser never sees either
 * token.
 *
 * Refused once the session has reached `session.client.absolute-timeout-hours`: a refresh extends
 * the token, never the sign-in.
 */
export async function POST() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearSessionCookies();
    return notAuthenticatedResponse();
  }

  const [accessToken, startedAt] = await Promise.all([getAccessToken(), getSessionStartedAt()]);
  if (startedAt) {
    const policy = await getSessionPolicy(accessToken);
    if (Date.now() >= startedAt + policy.absoluteTimeoutHours * 3_600_000) {
      await clearSessionCookies();
      return notAuthenticatedResponse("Your session has reached its maximum length. Please log in again.");
    }
  }

  let upstream: Response;
  try {
    upstream = await coreFetch(adminApi.AUTH.REFRESH, {
      method: "POST",
      body: { refreshToken },
    });
  } catch {
    // Unreachable core says nothing about the session — keep it, the user can try again.
    return badUpstreamResponse();
  }
  const { envelope, raw } = await readEnvelope<LoginDataDto>(upstream);

  if (upstream.status >= 400 && upstream.status < 500) {
    // Rejected refresh token (expired, revoked, reused): the session is over.
    await clearSessionCookies();
    return Response.json(raw ?? upstreamFailure("Session expired", { statusCode: 401, detail: "Please log in again." }), { status: 401 });
  }
  const newAccessToken = envelope?.success ? envelope.data?.accessToken : undefined;
  if (!upstream.ok || !newAccessToken) {
    return Response.json(raw ?? upstreamFailure("Unable to refresh session"), {
      status: upstream.ok ? 502 : upstream.status,
    });
  }

  await setSessionCookies(
    { accessToken: newAccessToken, refreshToken: envelope?.data.refreshToken },
    { refreshed: true },
  );
  const body: RefreshSessionResult = {
    expiresAt:
      tokenExpiresAt(newAccessToken) ?? Date.now() + (envelope?.data.expiresIn ?? 0) * 1000,
  };
  return Response.json(body);
}
