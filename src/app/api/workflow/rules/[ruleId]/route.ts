import { coreFetch } from "../../../_lib/core-client";
import { getAccessToken } from "../../../_lib/session-cookies";
import { getSessionOrgId, noOrgResponse } from "../../../_lib/session-org";
import { notAuthenticatedResponse } from "../../../_lib/error-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One rule of the caller's own organization — see ../route.ts for why orgId is resolved here. */
async function handler(request: Request, ctx: { params: Promise<{ ruleId: string }> }) {
  const token = await getAccessToken();
  if (!token) {
    return notAuthenticatedResponse();
  }

  const orgId = await getSessionOrgId();
  if (!orgId) return noOrgResponse();

  const { ruleId } = await ctx.params;

  let body: unknown = undefined;
  if (request.headers.get("content-type")?.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      // empty body
    }
  }

  return coreFetch(
    `workflow/orgs/${encodeURIComponent(orgId)}/rules/${encodeURIComponent(ruleId)}`,
    { method: request.method, body, accessToken: token },
  );
}

export { handler as PUT, handler as DELETE };
