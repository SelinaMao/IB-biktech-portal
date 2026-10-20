import { coreFetch } from ".././_lib/core-client";
import { getAccessToken } from ".././_lib/session-cookies";
import { badUpstreamResponse, notAuthenticatedResponse } from ".././_lib/error-response";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale } from "@/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_PATHS = ["otp/verify", "otp/resend"];

/**
 * Transparent bank-API passthrough — the data layer's base URL is `/api/bank`.
 *
 * Every browser data call lands here. We read the bearer token from the
 * httpOnly cookie (server-side), attach the gateway client credentials, and
 * forward upstream. This is what keeps tokens + secrets out of the browser
 * while requiring zero per-endpoint changes in the app.
 */
async function handler(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const token = await getAccessToken();

  // Public paths (OTP verify/resend during login/signup) don't need a token.
  const isPublicPath = PUBLIC_PATHS.includes((path ?? []).join("/"));

  if (!token && !isPublicPath) {
    return notAuthenticatedResponse();
  }

  // The portal's own locale, not the browser's: the switcher writes it to this cookie.
  const locale = (await cookies()).get(LOCALE_COOKIE)?.value ?? defaultLocale;

  // Preserve any query parameters (pagination, search, filter)
  const { search } = new URL(request.url);
  const pathString = (path ?? []).join("/") + search;

  // Safely extract request body if JSON content is expected
  let body: unknown = undefined;
  const contentType = request.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      // Ignore if body is empty or malformed
    }
  }

  // ADR-004: forward the browser's `Idempotency-Key` header to core unchanged.
  // payment-service's IdempotencyKeyFilter reads this and returns
  // 400 IDEMPOTENCY_KEY_MISSING when a guarded path is called without it. The
  // header is per-submit (minted by `useIdempotencyKey` on the client); the BFF
  // adds no retry logic of its own, so it only needs to pass the key through.
  const idempotencyKey = request.headers.get("idempotency-key") ?? undefined;

  try {
    console.error("[BFF] Upstream proxy coming from request:");
    return await coreFetch(pathString, {
      method: request.method,
      body,
      accessToken: token,
      acceptLanguage: locale,
      idempotencyKey,
    });
  } catch (error) {
    console.error("[BFF] Upstream proxy error:", error);
    return badUpstreamResponse();
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
