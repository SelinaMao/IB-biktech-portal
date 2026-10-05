import type { SessionEndReason } from "@/config/session.config";

/**
 * Keeps every open tab of the portal on the same session. The session cookies are shared by all
 * tabs, so what one tab does to the session — using it, refreshing it, ending it, replacing it with
 * another user's — is true for the others too.
 */
export type SessionMessage =
  /** The user did something in another tab: they are not idle. */
  | { type: "activity"; at: number }
  /** Another tab refreshed the token. */
  | { type: "refreshed"; expiresAt: number }
  /** Another tab ended the session (logout, idle, expiry); the cookies are already gone. */
  | { type: "ended"; reason?: SessionEndReason }
  /** Someone signed in, in another tab — the cookies now belong to `userId`. */
  | { type: "signedIn"; userId: string };

const CHANNEL_NAME = "corp-session";

// One channel per tab: a BroadcastChannel never hears its own messages, so a tab posting and
// listening through the same instance never reacts to itself.
let channel: BroadcastChannel | null | undefined;

function getChannel(): BroadcastChannel | null {
  if (channel === undefined) {
    channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function postSessionMessage(message: SessionMessage) {
  getChannel()?.postMessage(message);
}

export function onSessionMessage(handler: (message: SessionMessage) => void): () => void {
  const target = getChannel();
  if (!target) return () => {};
  const listener = (event: MessageEvent<SessionMessage>) => handler(event.data);
  target.addEventListener("message", listener);
  return () => target.removeEventListener("message", listener);
}

export function loginPath(reason?: SessionEndReason) {
  return reason ? `/login?reason=${reason}` : "/login";
}

let leaving = false;

/**
 * Leave the portal with a full page load, never a client-side route change. The reload is what
 * guarantees nothing of this session — the RTK Query cache, slices, a dialog's local state, a
 * polling timer — is still in memory when the next user signs in on this browser.
 */
export function leaveToLogin(reason?: SessionEndReason) {
  // The first way out wins: a manual logout must not turn into "session expired" because a
  // request still in flight came back 401 while the page was unloading.
  if (leaving) return;
  leaving = true;
  window.location.replace(loginPath(reason));
}

/** True once this tab is on its way to /login — whatever else fails now is not worth reporting. */
export function isLeaving() {
  return leaving;
}
