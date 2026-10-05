import "server-only";

import { adminApi } from "@/config/api.config";
import { coreFetch, readEnvelope } from "./core-client";

/**
 * The front-client (IB + MB) session limits, as the bank sets them under Security parameters in the
 * back office. auth-service reads the same keys (SecurityPolicyProvider), with the same defaults.
 */
export type SessionPolicy = {
  /** Idle this long and the session ends. */
  idleTimeoutMinutes: number;
  /** The inactivity warning appears this long before the idle timeout. */
  warningMinutes: number;
  /** No session outlives this, active or not. */
  absoluteTimeoutHours: number;
};

const KEYS = {
  idleTimeoutMinutes: "session.client.timeout.minutes",
  warningMinutes: "session.client.timeout.warning-minutes",
  absoluteTimeoutHours: "session.client.absolute-timeout-hours",
} as const satisfies Record<keyof SessionPolicy, string>;

const DEFAULTS: SessionPolicy = { idleTimeoutMinutes: 15, warningMinutes: 2, absoluteTimeoutHours: 8 };

// auth-service caches the same parameters for 60s; a bank-side change reaches both within a minute.
const CACHE_MS = 60_000;

let cached: { policy: SessionPolicy; until: number } | null = null;
let pending: Promise<SessionPolicy> | null = null;

async function readParameter(key: string, accessToken: string): Promise<number | undefined> {
  try {
    const upstream = await coreFetch(
      adminApi.PARAMETER.GET.replace("{key}", encodeURIComponent(key)),
      { accessToken },
    );
    const { envelope } = await readEnvelope<{ value?: string | null }>(upstream);
    if (!upstream.ok || !envelope?.success) return undefined;
    const value = Number.parseInt(envelope.data?.value?.trim() ?? "", 10);
    return Number.isFinite(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** A missing, unreadable or nonsensical value falls back to its default, one key at a time. */
function normalize(values: Partial<Record<keyof SessionPolicy, number>>): SessionPolicy {
  const positive = (value: number | undefined, fallback: number) =>
    value !== undefined && value > 0 ? value : fallback;

  const idleTimeoutMinutes = positive(values.idleTimeoutMinutes, DEFAULTS.idleTimeoutMinutes);
  const warning = values.warningMinutes;
  // A warning as long as the timeout itself would pop up the moment the user stopped moving.
  const warningMinutes = Math.min(
    warning !== undefined && warning >= 0 ? warning : DEFAULTS.warningMinutes,
    Math.max(idleTimeoutMinutes - 1, 0),
  );
  return {
    idleTimeoutMinutes,
    warningMinutes,
    absoluteTimeoutHours: positive(values.absoluteTimeoutHours, DEFAULTS.absoluteTimeoutHours),
  };
}

/**
 * The current session policy — cached, refreshed at most once a minute, and never throws: when
 * system-settings can't be reached the defaults apply until the next attempt. Reading the
 * parameters needs a signed-in caller; without one, the last policy read (or the defaults) stands.
 */
export async function getSessionPolicy(accessToken: string | undefined): Promise<SessionPolicy> {
  if (cached && Date.now() < cached.until) return cached.policy;
  if (!accessToken) return cached?.policy ?? DEFAULTS;
  if (pending) return pending;

  pending = (async () => {
    const entries = await Promise.all(
      (Object.keys(KEYS) as (keyof SessionPolicy)[]).map(
        async (field) => [field, await readParameter(KEYS[field], accessToken)] as const,
      ),
    );
    const policy = normalize(Object.fromEntries(entries));
    cached = { policy, until: Date.now() + CACHE_MS };
    return policy;
  })().finally(() => {
    pending = null;
  });
  return pending;
}
