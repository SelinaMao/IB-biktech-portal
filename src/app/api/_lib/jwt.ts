/**
 * The claims of a JWT, decoded but NOT verified. Only for reading what core already signed into a
 * token this BFF holds (org, expiry) — never for deciding whether a token is genuine; core does that.
 */
export function decodeJwtClaims<T extends object>(token: string): Partial<T> | undefined {
  const payload = token.split(".")[1];
  if (!payload) return undefined;

  try {
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
      "utf8",
    );
    const claims: unknown = JSON.parse(json);
    return claims !== null && typeof claims === "object" ? (claims as Partial<T>) : undefined;
  } catch {
    return undefined;
  }
}

/** When the token stops being accepted (epoch ms), from its `exp` claim. */
export function tokenExpiresAt(token: string): number | undefined {
  const exp = decodeJwtClaims<{ exp: number }>(token)?.exp;
  return typeof exp === "number" ? exp * 1000 : undefined;
}
