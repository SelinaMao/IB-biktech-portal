/**
 * Server-only env access for the BFF layer. Read lazily (not at module load)
 * so builds don't require secrets, and fail loudly at request time when a
 * required variable is missing.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required server env var: ${name}`);
  }
  return value;
}

export function getServerEnv() {
  return {
    coreBaseUrl: required("BANK_API_BASE_URL").replace(/\/$/, ""),
    // Core API version — applied ONCE when forwarding upstream (core-client),
    // never hardcoded in endpoint paths.
    apiVersion: process.env.NEXT_PUBLIC_API_VERSION ?? "v1",
    clientId: required("BANK_API_CLIENT_ID"),
    clientSecret: required("BANK_API_CLIENT_SECRET"),
    cookieSecure: process.env.AUTH_COOKIE_SECURE === "true",
    accessTokenTtl: Number(process.env.ACCESS_TOKEN_TTL ?? 3600),
    refreshTokenTtl: Number(process.env.REFRESH_TOKEN_TTL ?? 2592000),
  };
}
