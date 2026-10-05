import type { SessionInfo } from "@core/types/auth";
import { tokenExpiresAt } from "../../_lib/jwt";
import { getAccessToken, getSessionStartedAt } from "../../_lib/session-cookies";
import { getSessionPolicy } from "../../_lib/session-policy";
import { notAuthenticatedResponse } from "../../_lib/error-response";

/**
 * Session timing for the browser. The tokens are httpOnly, so the client can't see when its access
 * token runs out; this tells it, along with the bank's idle / warning / absolute limits, so the
 * portal can warn before either one ends the session.
 */
export async function GET() {
  const accessToken = await getAccessToken();
  const expiresAt = accessToken ? tokenExpiresAt(accessToken) : undefined;
  if (!accessToken || !expiresAt || expiresAt <= Date.now()) {
    return notAuthenticatedResponse();
  }

  const [policy, startedAt] = await Promise.all([
    getSessionPolicy(accessToken),
    getSessionStartedAt(),
  ]);

  const body: SessionInfo = {
    expiresAt,
    endsAt: startedAt ? startedAt + policy.absoluteTimeoutHours * 3_600_000 : null,
    policy,
  };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
