import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_STARTED_COOKIE,
} from "@/config/session.config";
import { getServerEnv } from "./env";

/**
 * A browser drops a cookie over roughly 4096 bytes (RFC 6265) without a word of complaint,
 * and this access token carries every permission the user holds — over 7 KB for a corporate
 * super admin. Split it well under the limit and reassemble on read.
 */
const CHUNK_SIZE = 3000;
const MAX_CHUNKS = 10;

/**
 * Token storage: httpOnly cookies set by the BFF, never readable by client
 * JS. `sameSite: "lax"` blocks CSRF on cross-site POSTs while still allowing
 * top-level navigation to carry the session.
 *
 * A sign-in starts the session's absolute-lifetime clock; a token refresh (`refreshed`) keeps it
 * running, so refreshing can never stretch a session past `session.client.absolute-timeout-hours`.
 */
export async function setSessionCookies(
  tokens: {
    accessToken: string;
    refreshToken?: string;
  },
  { refreshed = false }: { refreshed?: boolean } = {},
) {
  const env = getServerEnv();
  const store = await cookies();
  const base = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/",
  } as const;

  const write = (name: string, value: string, maxAge: number) => {
    if (value.length <= CHUNK_SIZE) {
      store.set(name, value, { ...base, maxAge });
      for (let i = 0; i < MAX_CHUNKS; i++) store.delete(`${name}.${i}`);
      return;
    }
    // Too big for one cookie: write `name.0`, `name.1`, … and drop the single form.
    store.delete(name);
    const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < chunkCount; i++) {
      store.set(`${name}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), {
        ...base,
        maxAge,
      });
    }
    // Clear any chunks left by a longer token, or the session reassembles into rubbish.
    for (let i = chunkCount; i < MAX_CHUNKS; i++) store.delete(`${name}.${i}`);
  };

  write(ACCESS_TOKEN_COOKIE, tokens.accessToken, env.accessTokenTtl);
  if (tokens.refreshToken) {
    write(REFRESH_TOKEN_COOKIE, tokens.refreshToken, env.refreshTokenTtl);
  }
  if (!refreshed) {
    store.set(SESSION_STARTED_COOKIE, String(Date.now()), { ...base, maxAge: env.refreshTokenTtl });
  }
}

export async function clearSessionCookies() {
  const store = await cookies();
  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) {
    store.delete(name);
    for (let i = 0; i < MAX_CHUNKS; i++) store.delete(`${name}.${i}`);
  }
  store.delete(SESSION_STARTED_COOKIE);
}

async function readChunkedCookie(name: string): Promise<string | undefined> {
  const store = await cookies();
  const single = store.get(name)?.value;
  if (single) return single;

  let joined = "";
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const chunk = store.get(`${name}.${i}`)?.value;
    if (!chunk) break;
    joined += chunk;
  }
  return joined.length > 0 ? joined : undefined;
}

export async function getAccessToken(): Promise<string | undefined> {
  return readChunkedCookie(ACCESS_TOKEN_COOKIE);
}

export async function getRefreshToken(): Promise<string | undefined> {
  return readChunkedCookie(REFRESH_TOKEN_COOKIE);
}

/** When this sign-in began (epoch ms); undefined for a session signed in before the cookie existed. */
export async function getSessionStartedAt(): Promise<number | undefined> {
  const store = await cookies();
  const startedAt = Number(store.get(SESSION_STARTED_COOKIE)?.value);
  return Number.isFinite(startedAt) && startedAt > 0 ? startedAt : undefined;
}
