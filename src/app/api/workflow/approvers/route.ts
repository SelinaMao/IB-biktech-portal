import { coreFetch } from "../../_lib/core-client";
import { getAccessToken } from "../../_lib/session-cookies";
import { notAuthenticatedResponse } from "../../_lib/error-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Who may sign, inside the caller's own organization.
 *
 * An approver is anyone whose role grants the Approve verb, so there is no capability to pass and
 * no approver flag to read. Without a function the whole pool comes back; with one, only the
 * people who may sign that function.
 *
 * The organization is deliberately not sent: upstream takes it from the token, so a tampered
 * request cannot reach another customer's people.
 */
export async function GET(request: Request) {
  const token = await getAccessToken();
  if (!token) {
    return notAuthenticatedResponse();
  }

  const functionCode = new URL(request.url).searchParams.get("function");
  const path =
    functionCode && functionCode !== "*"
      ? `org/functions/${encodeURIComponent(functionCode)}/approvers`
      : "org/approvers";

  return coreFetch(path, { accessToken: token });
}
