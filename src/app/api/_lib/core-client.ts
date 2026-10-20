import { getServerEnv } from "./env";
import type { CoreEnvelope } from "./core-contracts";

/**
 * Server → core-banking call. This is the ONLY place client credentials are
 * attached; they never reach the browser (CLAUDE.md non-negotiable).
 *
 * TODO(themis): when E2E_ENCRYPTION_ENABLE=true, wrap the body in the
 * encrypted envelope here (session B, BFF → core).
 */
export async function coreFetch(
  path: string,
  init: {
    method?: string;
    body?: unknown;
    accessToken?: string;
    /** Portal locale, forwarded so services return their own wording in the right language. */
    acceptLanguage?: string;
    /**
     * ADR-004 Idempotency-Key, forwarded unchanged from the browser. The server's
     * `IdempotencyKeyFilter` reads it on money-movement POSTs
     * (`cbs.idempotency.paths` in payment-service `application.yml`).
     */
    idempotencyKey?: string;
  } = {},
): Promise<Response> {
  const env = getServerEnv();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Id": env.clientId,
    "X-Client-Secret": env.clientSecret,
    "X-Platform": "WEB",
  };
  if (init.accessToken) {
    headers.Authorization = `Bearer ${init.accessToken}`;
  }
  if (init.acceptLanguage) {
    headers["Accept-Language"] = init.acceptLanguage;
  }
  if (init.idempotencyKey) {
    headers["Idempotency-Key"] = init.idempotencyKey;
  }

  // Version is prepended here and ONLY here — endpoint paths stay unversioned.
  const url = `${env.coreBaseUrl}/${env.apiVersion}/${path}`;
  const serializedBody =
    init.body === undefined ? undefined : JSON.stringify(init.body);

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[BFF→core] ${init.method ?? "GET"} ${url} body: ${serializedBody ? `${serializedBody.length} bytes` : "<none>"
      }`,
    );
  }

  const upstream = await fetch(url, {
    method: init.method ?? "GET",
    headers,
    body: serializedBody,
    // Bank calls must never be cached by the framework.
    cache: "no-store",
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[BFF→core] ← ${upstream.status} ${url}`);
  }

  return upstream;
}

/**
 * Parse a core response into its typed envelope
 * (`{ success, message, data, timestamp }` — see core-contracts.ts).
 * `envelope` is null when the body isn't a recognizable envelope; `raw` is
 * always the parsed JSON (or null) for error passthrough.
 */
export async function readEnvelope<T>(
  upstream: Response,
): Promise<{ envelope: CoreEnvelope<T> | null; raw: unknown }> {
  const rawText = await upstream.text();
  let raw: unknown = null;
  try {
    raw = rawText ? JSON.parse(rawText) : null;
  } catch {
    raw = null;
  }
  // `data` is intentionally not required here — core omits the key entirely
  // on some success responses (e.g. reset-password) rather than sending
  // `data: null`.
  const isEnvelope =
    raw !== null && typeof raw === "object" && "success" in raw;

  if (process.env.NODE_ENV !== "production" && upstream.ok && !isEnvelope) {
    console.log(
      `[BFF→core] non-envelope 2xx body from ${upstream.url}: status=${upstream.status} raw=${rawText.slice(0, 500)}`,
    );
  }

  return { envelope: isEnvelope ? (raw as CoreEnvelope<T>) : null, raw };
}
