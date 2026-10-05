import { coreFetch } from "../../_lib/core-client";
import { getAccessToken } from "../../_lib/session-cookies";
import { getSessionOrgId, noOrgResponse } from "../../_lib/session-org";
import { notAuthenticatedResponse } from "../../_lib/error-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The organization's own approval rules.
 *
 * The org id comes from the session token here, never from the browser: the upstream
 * controller takes it as a path variable and does not check it against the caller.
 */
async function handler(request: Request) {
  const token = await getAccessToken();
  if (!token) {
    return notAuthenticatedResponse();
  }

  const orgId = await getSessionOrgId();
  if (!orgId) return noOrgResponse();

  let body: unknown = undefined;
  if (request.headers.get("content-type")?.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      // empty body
    }
  }

  return coreFetch(`workflow/orgs/${encodeURIComponent(orgId)}/rules`, {
    method: request.method,
    body,
    accessToken: token,
  });
}

export { handler as GET, handler as POST };
