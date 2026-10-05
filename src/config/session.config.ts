/**
 * Session cookie names — shared by the BFF route handlers (which set them)
 * and src/middleware.ts (which only checks presence). httpOnly cookies are
 * invisible to client JS by design; nothing in the browser bundle reads them.
 */
export const ACCESS_TOKEN_COOKIE = "corp_at";
export const REFRESH_TOKEN_COOKIE = "corp_rt";
/** When this sign-in began (epoch ms) — the clock `session.client.absolute-timeout-hours` runs on. */
export const SESSION_STARTED_COOKIE = "corp_ss";

/** Where the session-expiry prompt appears: this long before the access token runs out. */
export const TOKEN_EXPIRY_WARNING_MS = 5 * 60_000;

/** Why a session ended, carried to the login page as `?reason=` so it can say so. */
export type SessionEndReason = "idle" | "expired";
