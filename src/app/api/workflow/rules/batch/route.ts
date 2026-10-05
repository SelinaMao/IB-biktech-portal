import { coreFetch } from "../../../_lib/core-client";
import { getAccessToken } from "../../../_lib/session-cookies";
import { getSessionOrgId, noOrgResponse } from "../../../_lib/session-org";
import { notAuthenticatedResponse } from "../../../_lib/error-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One policy for many of the organization's actions — "All financial", or a few picked by name.
 * See ../route.ts for why the org id is resolved here rather than taken from the browser.
 */
export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) {
    return notAuthenticatedResponse();
  }

  const orgId = await getSessionOrgId();
  if (!orgId) return noOrgResponse();

  let body: unknown = undefined;
  try {
    body = await request.json();
  } catch {
    // empty body — upstream refuses it with a proper message
  }

  return coreFetch(`workflow/orgs/${encodeURIComponent(orgId)}/rules/batch`, {
    method: "POST",
    body,
    accessToken: token,
  });
}
