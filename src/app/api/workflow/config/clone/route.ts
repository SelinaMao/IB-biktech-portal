import { coreFetch } from "../../../_lib/core-client";
import { getAccessToken } from "../../../_lib/session-cookies";
import { getSessionOrgId, noOrgResponse } from "../../../_lib/session-org";
import { notAuthenticatedResponse } from "../../../_lib/error-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Seeds the organization's matrix from the bank's active template. */
export async function POST() {
  const token = await getAccessToken();
  if (!token) {
    return notAuthenticatedResponse();
  }

  const orgId = await getSessionOrgId();
  if (!orgId) return noOrgResponse();

  return coreFetch(`workflow/orgs/${encodeURIComponent(orgId)}/config/clone`, {
    method: "POST",
    accessToken: token,
  });
}
