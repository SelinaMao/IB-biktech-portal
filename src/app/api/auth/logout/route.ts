import { adminApi } from "@/config/api.config";
import { coreFetch } from "../../_lib/core-client";
import {
  clearSessionCookies,
  getAccessToken,
} from "../../_lib/session-cookies";

/**
 * BFF logout. Best-effort revoke upstream, then ALWAYS clear the local
 * session cookies — a failed core call must not leave the browser logged in.
 */
export async function POST() {
  const accessToken = await getAccessToken();

  if (accessToken) {
    try {
      await coreFetch(adminApi.AUTH.LOGOUT, { method: "POST", accessToken });
    } catch {
      // Ignore — audit trail lives server-side; the cookie clear below is
      // what ends the browser session.
    }
  }

  await clearSessionCookies();
  return Response.json({ success: true });
}
