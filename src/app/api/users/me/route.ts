import { adminApi } from "@/config/api.config";
import { coreFetch, readEnvelope } from "../../_lib/core-client";
import {
  normalizeMeData,
  type MeDataDto,
} from "../../_lib/core-contracts";
import {
  clearSessionCookies,
  getAccessToken,
} from "../../_lib/session-cookies";
import { toSessionUser } from "../../_lib/session-user";
import { notAuthenticatedResponse, upstreamFailure } from "../../_lib/error-response";

/**
 * Session restore endpoint. The client calls this on app load to rebuild its
 * Redux session mirror; auth comes from the httpOnly access-token cookie.
 *
 * Upstream contract: CoreEnvelope<MeDataDto> — see _lib/core-contracts.ts.
 */
export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return notAuthenticatedResponse();
  }

  const upstream = await coreFetch(adminApi.AUTH.ME, { accessToken });
  const { envelope, raw } = await readEnvelope<MeDataDto>(upstream);

  if (upstream.status === 401 || upstream.status === 403) {
    // Token expired/revoked — drop the dead cookies so the route guard sends
    // the user back to login instead of looping.
    await clearSessionCookies();
    return Response.json(raw ?? upstreamFailure("Session expired", { statusCode: 401, detail: "Please log in again." }), {
      status: 401,
    });
  }
  if (!upstream.ok || !envelope?.success) {
    return Response.json(raw ?? upstreamFailure("Unable to load session"), {
      status: upstream.ok ? 502 : upstream.status,
    });
  }

  return Response.json(toSessionUser(normalizeMeData(envelope.data)));
}
