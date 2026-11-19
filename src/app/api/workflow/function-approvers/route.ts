import { coreFetch } from "../../_lib/core-client";
import { getAccessToken } from "../../_lib/session-cookies";
import { getSessionOrgId, noOrgResponse } from "../../_lib/session-org";
import { notAuthenticatedResponse } from "../../_lib/error-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Who in the caller's organization could sign these actions — asked of the engine, which resolves
 * people the same way it will when a request is raised, including the narrowing to a group.
 *
 * One action asks for its approvers; several ask for the people who can sign every one of them,
 * the only people a rule covering all of them may name. The org id comes from the session, never
 * from the browser, so one customer cannot list another's people.
 */
export async function GET(request: Request) {
  const token = await getAccessToken();
  if (!token) {
    return notAuthenticatedResponse();
  }

  const orgId = await getSessionOrgId();
  if (!orgId) return noOrgResponse();

  const incoming = new URL(request.url).searchParams;
  const codes = [...new Set(incoming.getAll("codes").filter(Boolean))];
  if (codes.length === 0) {
    return Response.json({ success: true, message: "No action chosen", data: [] });
  }

  const params = new URLSearchParams({ orgId });
  // Several groups are an "or": anyone in any of them counts.
  [...new Set(incoming.getAll("groupKey").filter(Boolean))].forEach((key) => params.append("groupKey", key));

  let upstreamRes: Response;
  if (codes.length === 1) {
    upstreamRes = await coreFetch(`workflow/functions/${encodeURIComponent(codes[0])}/approvers?${params}`, {
      accessToken: token,
    });
  } else {
    codes.forEach((code) => params.append("codes", code));
    upstreamRes = await coreFetch(`workflow/functions/approvers?${params}`, { accessToken: token });
  }

  const rawText = await upstreamRes.text();
  console.log(`[function-approvers codes=${codes.join(",")}] upstream status=${upstreamRes.status} body=${rawText}`);
  return new Response(rawText, {
    status: upstreamRes.status,
    headers: { "Content-Type": "application/json" },
  });
}
