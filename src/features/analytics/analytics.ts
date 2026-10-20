import type { SessionUser } from "@/features/auth/auth.slice";
import {
  AnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsParams,
} from "./analytics.events";

/**
 * Google Analytics 4 (gtag.js), behind a few functions any client code can call:
 *
 *   trackEvent(AnalyticsEvent.DOCUMENT_DOWNLOADED, { document_type: "statement" });
 *   trackFailure(AnalyticsEvent.LOGIN, error);
 *
 * Page views and the signed-in user are handled by AnalyticsProvider, so screens never send them.
 * Until the provider has started (or when no measurement ID is configured) calls are queued or
 * dropped, never thrown — tracking must not break a screen.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type GtagCommand = unknown[];

/** `undefined` until initAnalytics runs; `null` when analytics is off for this deployment. */
let measurementId: string | null | undefined;
let debug = false;
/** Calls made before initAnalytics — sent, or dropped, once it runs. */
const pending: GtagCommand[] = [];
const MAX_PENDING = 50;
/** The last page view's location — the next one's referrer. */
let lastPageLocation: string | undefined;
/** Who GA currently attributes events to, so signing out only clears an ID that was set. */
let identifiedUserId: string | null = null;

const EVENT_NAME = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
const MAX_PARAM_LENGTH = 100;
const MAX_USER_PROPERTY_LENGTH = 36;

/** Keys that name customer data or money (checked after camelCase → snake_case). */
const SENSITIVE_KEY =
  /(^|_)(e?mail|phone|mobile|password|pin|otp|token|secret|card|nid|username|name|address|remark|amount|balance)(_|$)|account_(number|no)/;
/** Values that carry an email address, or an account / phone / ID / reference number. */
const SENSITIVE_VALUE = /[^\s@]+@[^\s@]+\.|\d{8,}/;
/** Path segments that are record IDs: UUIDs, numbers, or long tokens with a digit in them. */
const ID_SEGMENT =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+|(?=[^/]*\d)[A-Za-z0-9_-]{16,})$/i;

function shouldLog() {
  return debug || process.env.NODE_ENV === "development";
}

function send(...command: GtagCommand) {
  if (typeof window === "undefined") return;
  if (measurementId === undefined) {
    if (pending.length < MAX_PENDING) pending.push(command);
    return;
  }
  if (shouldLog()) console.debug(`[analytics${measurementId ? "" : " off"}]`, ...command);
  if (measurementId) window.gtag?.(...command);
}

/**
 * Starts gtag. Called once, by AnalyticsProvider, with the measurement ID the server was deployed
 * with; without one, analytics stays off and every call becomes a no-op.
 */
export function initAnalytics(options: { measurementId?: string | null; debug?: boolean }) {
  if (typeof window === "undefined" || measurementId !== undefined) return;
  debug = Boolean(options.debug);
  measurementId = options.measurementId?.trim() || null;

  if (measurementId) {
    window.dataLayer = window.dataLayer || [];
    // gtag.js only treats an `arguments` object as a command — an array would be ignored.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    // A bank portal shows no ads: keep Google's advertising features off for good.
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      // AnalyticsProvider sends each page view itself, with IDs and query strings removed.
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      // GA treats any value here, even false, as "on" — only set it to turn DebugView on.
      ...(debug ? { debug_mode: true } : {}),
    });
  }

  pending.splice(0).forEach((command) => send(...command));
}

export function isAnalyticsEnabled() {
  return Boolean(measurementId);
}

/** `/limits/3f2a…-…` → `/limits/:id`, so reports group by screen, not by record. */
export function scrubPath(pathname: string) {
  return pathname
    .split("/")
    .map((segment) => (ID_SEGMENT.test(segment) ? ":id" : segment))
    .join("/");
}

/** A URL without its query string or hash, and with record IDs removed from same-origin paths. */
function scrubUrl(url: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const sameOrigin = parsed.origin === window.location.origin;
    return parsed.origin + (sameOrigin ? scrubPath(parsed.pathname) : parsed.pathname);
  } catch {
    return undefined;
  }
}

function currentPageLocation() {
  return window.location.origin + scrubPath(window.location.pathname);
}

function toSnakeCase(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

/** Drops empty values and anything that looks like customer data; trims the rest to GA's limits. */
function cleanParams(params: AnalyticsParams, maxLength: number) {
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (SENSITIVE_KEY.test(toSnakeCase(key)) || SENSITIVE_VALUE.test(String(value))) {
      if (shouldLog()) console.warn(`[analytics] dropped "${key}": it looks like customer data`);
      continue;
    }
    cleaned[key] = typeof value === "string" ? value.slice(0, maxLength) : value;
  }
  return cleaned;
}

/**
 * Sends one event. Use a name from `AnalyticsEvent` (add it there first if it's new); custom
 * strings are accepted but must follow GA4's naming rules.
 */
export function trackEvent(name: AnalyticsEventName | (string & {}), params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;
  if (!EVENT_NAME.test(name)) {
    if (shouldLog()) console.warn(`[analytics] "${name}" is not a valid GA4 event name`);
    return;
  }
  send("event", name, {
    ...cleanParams(params, MAX_PARAM_LENGTH),
    page_location: currentPageLocation(),
  });
}

/** What GA may know about an error: the HTTP status and the envelope's `errorCode` (e.g. GTW-00-003). */
function errorParams(error: unknown): AnalyticsParams {
  const source = (error !== null && typeof error === "object" ? error : {}) as {
    status?: unknown;
    data?: unknown;
  };
  const data = (source.data !== null && typeof source.data === "object" ? source.data : {}) as {
    errorCode?: unknown;
  };
  return {
    error_status:
      typeof source.status === "number" || typeof source.status === "string"
        ? source.status
        : undefined,
    error_code: typeof data.errorCode === "string" ? data.errorCode : undefined,
  };
}

/**
 * A failed attempt at `action` — sent as `action_failed`, so every failure in the portal lands in
 * one report. `error` is an RTK Query error, an AuthError, or anything else (then only `action` is sent).
 */
export function trackFailure(
  action: AnalyticsEventName | (string & {}),
  error?: unknown,
  params: AnalyticsParams = {},
) {
  trackEvent(AnalyticsEvent.ACTION_FAILED, { ...params, ...errorParams(error), action });
}

/** Sends a page view for the current URL. AnalyticsProvider calls this on every route change. */
export function trackPageView() {
  if (typeof window === "undefined") return;
  const location = currentPageLocation();
  // Strict Mode runs effects twice, and a query-only change is the same screen.
  if (location === lastPageLocation) return;
  send("event", "page_view", {
    page_location: location,
    page_referrer: lastPageLocation ?? scrubUrl(document.referrer),
    page_title: document.title,
  });
  lastPageLocation = location;
}

/** Sets user-scoped properties (register each as a user-scoped custom dimension in GA). */
export function setUserProperties(properties: AnalyticsParams) {
  const cleaned = cleanParams(properties, MAX_USER_PROPERTY_LENGTH);
  if (Object.keys(cleaned).length) send("set", "user_properties", cleaned);
}

/**
 * Ties what follows to the signed-in user — by the core user ID, never a name or username — or,
 * with `null`, stops doing so (sign-out).
 */
export function identifyUser(user: Pick<SessionUser, "id" | "roles"> | null) {
  if (!user) {
    if (identifiedUserId === null) return;
    identifiedUserId = null;
    send("set", { user_id: null });
    send("set", "user_properties", { user_role: null });
    return;
  }
  identifiedUserId = user.id;
  send("set", { user_id: user.id });
  setUserProperties({
    user_role: user.roles
      .map((role) => role.code)
      .sort()
      .join(","),
  });
}
