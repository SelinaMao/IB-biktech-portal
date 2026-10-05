import { bffErrorResponse } from "./error-response";
import { decodeJwtClaims } from "./jwt";
import { getAccessToken } from "./session-cookies";

/** The `orgId` claim of the session's access token. */
export async function getSessionOrgId(): Promise<string | undefined> {
  const token = await getAccessToken();
  if (!token) return undefined;

  const orgId = decodeJwtClaims<{ orgId: string }>(token)?.orgId;
  return typeof orgId === "string" && orgId ? orgId : undefined;
}

/** 409 response for a caller whose token carries no organization. */
export function noOrgResponse() {
  return bffErrorResponse({
    errorCode: "GTW-00-003",
    statusCode: 409,
    message: "No organization",
    detail: "Your account is not linked to an organization. Please contact your administrator.",
  });
}
