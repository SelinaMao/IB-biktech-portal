"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { TOKEN_EXPIRY_WARNING_MS, type SessionEndReason } from "@/config/session.config";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRefreshSessionMutation, useSessionInfoQuery, type SessionInfo } from "./auth.api";
import { clearSession } from "./auth.slice";
import { leaveToLogin, onSessionMessage, postSessionMessage } from "./session-sync";
import { useAuth } from "./use-auth";

/**
 * What the timeout prompt is warning about:
 *  - "idle"  — no activity for (idle timeout − warning); staying resets the idle clock.
 *  - "token" — the access token runs out within TOKEN_EXPIRY_WARNING_MS; staying refreshes it.
 *  - "limit" — the session reaches its absolute limit soon; nothing can extend it, only acknowledge.
 */
export type SessionWarning = "idle" | "token" | "limit";

// Counts as the user being present. pointermove included: reading a statement is activity too.
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"];
const ACTIVITY_BROADCAST_MS = 5_000;
const TICK_MS = 1_000;
// Picks up a bank-side policy change, or a token another tab refreshed while this one slept.
const SESSION_INFO_POLL_MS = 5 * 60_000;

type Timing = {
  lastActivity: number;
  expiresAt: number;
  endsAt: number | null;
  policy: SessionInfo["policy"];
  limitAcknowledged: boolean;
};

type Evaluation =
  | { ended: SessionEndReason }
  | { ended?: undefined; warning: SessionWarning | null; deadline: number };

function evaluate(now: number, t: Timing): Evaluation {
  const idleDeadline = t.lastActivity + t.policy.idleTimeoutMinutes * 60_000;
  const hardDeadline = Math.min(t.expiresAt, t.endsAt ?? Infinity);
  const deadline = Math.min(idleDeadline, hardDeadline);
  if (now >= deadline) return { ended: idleDeadline <= hardDeadline ? "idle" : "expired" };

  // A refresh only helps while the token, not the absolute limit, is what ends the session first.
  const refreshHelps = t.endsAt === null || t.endsAt > t.expiresAt;

  let warning: SessionWarning | null = null;
  if (now >= idleDeadline - t.policy.warningMinutes * 60_000) warning = "idle";
  else if (refreshHelps && now >= t.expiresAt - TOKEN_EXPIRY_WARNING_MS) warning = "token";
  else if (
    !refreshHelps &&
    !t.limitAcknowledged &&
    t.endsAt !== null &&
    now >= t.endsAt - TOKEN_EXPIRY_WARNING_MS
  )
    warning = "limit";

  return { warning, deadline };
}

/**
 * Times the signed-in session against the bank's policy and the access token, and ends it when
 * either runs out. Returns what the timeout prompt needs to render.
 *
 * Activity and refreshes are shared across tabs (session-sync.ts): working in one tab keeps the
 * others alive, and whichever tab ends the session takes the rest with it.
 */
export function useSessionTimeout() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { logout } = useAuth();
  const { data: info, refetch } = useSessionInfoQuery(undefined, {
    pollingInterval: SESSION_INFO_POLL_MS,
  });
  const [refreshSession] = useRefreshSessionMutation();

  // The last timing evaluated — what "Stay signed in" decides on.
  const timingRef = useRef<Timing | null>(null);
  // Newer than `info` for a moment after a refresh here or in another tab, until the refetch lands.
  const expiresAtRef = useRef<number | null>(null);
  // Null until the first tick: the portal opening counts as activity.
  const lastActivityRef = useRef<number | null>(null);
  const limitAcknowledgedRef = useRef(false);
  const warningRef = useRef<SessionWarning | null>(null);
  const endingRef = useRef(false);
  const [prompt, setPrompt] = useState<{ warning: SessionWarning; remainingMs: number } | null>(
    null,
  );
  const [isExtending, setIsExtending] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const endSession = useCallback(
    (reason?: SessionEndReason) => {
      if (endingRef.current) return;
      endingRef.current = true;
      logout(reason).catch(() => {
        // The cookies are cleared and the page is leaving either way.
      });
    },
    [logout],
  );

  const tick = useCallback(() => {
    if (!info || endingRef.current) return;
    const now = Date.now();
    lastActivityRef.current ??= now;
    const timing: Timing = {
      lastActivity: lastActivityRef.current,
      expiresAt: expiresAtRef.current ?? info.expiresAt,
      endsAt: info.endsAt,
      policy: info.policy,
      limitAcknowledged: limitAcknowledgedRef.current,
    };
    timingRef.current = timing;

    const result = evaluate(now, timing);
    if (result.ended) {
      endSession(result.ended);
      return;
    }
    warningRef.current = result.warning;
    // An error from an earlier attempt belongs to that prompt, not the next one.
    if (!result.warning) setRefreshFailed(false);
    setPrompt((current) => {
      if (!result.warning) return current === null ? current : null;
      const remainingMs = result.deadline - now;
      // Re-render once a second at most: only when the shown countdown actually changes.
      if (
        current?.warning === result.warning &&
        Math.ceil(current.remainingMs / 1000) === Math.ceil(remainingMs / 1000)
      ) {
        return current;
      }
      return { warning: result.warning, remainingMs };
    });
  }, [endSession, info]);

  // A fresh session info (poll, refresh, another tab) is the source of truth for the token expiry.
  useEffect(() => {
    if (!info) return;
    expiresAtRef.current = info.expiresAt;
    tick();
  }, [info, tick]);

  useEffect(() => {
    const timer = window.setInterval(tick, TICK_MS);
    // Timers stall while the machine sleeps; check the moment the tab is looked at again.
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [tick]);

  useEffect(() => {
    let lastBroadcast = 0;
    const onActivity = () => {
      // Once the prompt is up it waits for an answer; drifting the mouse over it is not one.
      if (warningRef.current) return;
      const now = Date.now();
      lastActivityRef.current = now;
      if (now - lastBroadcast >= ACTIVITY_BROADCAST_MS) {
        lastBroadcast = now;
        postSessionMessage({ type: "activity", at: now });
      }
    };
    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, onActivity, { passive: true, capture: true });
    }
    return () => {
      for (const name of ACTIVITY_EVENTS) {
        window.removeEventListener(name, onActivity, { capture: true });
      }
    };
  }, []);

  useEffect(
    () =>
      onSessionMessage((message) => {
        switch (message.type) {
          case "activity":
            lastActivityRef.current = Math.max(lastActivityRef.current ?? 0, message.at);
            tick();
            break;
          case "refreshed":
            expiresAtRef.current = message.expiresAt;
            void refetch();
            break;
          case "ended":
            // The tab that ended it already cleared the cookies; just follow it out.
            endingRef.current = true;
            dispatch(clearSession());
            leaveToLogin(message.reason);
            break;
          case "signedIn":
            // Someone signed in elsewhere; the cookies are theirs now. Showing this user's screens
            // on top of another user's session is exactly the leak to avoid — start over.
            if (message.userId !== userId) {
              endingRef.current = true;
              window.location.replace("/dashboard");
            } else {
              void refetch();
            }
            break;
        }
      }),
    [dispatch, refetch, tick, userId],
  );

  const refreshToken = useCallback(async () => {
    const run = async () => {
      const { expiresAt } = await refreshSession().unwrap();
      expiresAtRef.current = expiresAt;
      postSessionMessage({ type: "refreshed", expiresAt });
      void refetch();
    };
    // Core rotates the refresh token and treats a reused one as theft, so two tabs must never
    // refresh at once. One after another is fine: each sends the cookie the previous one rotated.
    if (typeof navigator !== "undefined" && navigator.locks) {
      await navigator.locks.request("corp-session-refresh", run);
    } else {
      await run();
    }
  }, [refetch, refreshSession]);

  const staySignedIn = useCallback(async () => {
    const warning = warningRef.current;
    const now = Date.now();
    lastActivityRef.current = now;
    postSessionMessage({ type: "activity", at: now });
    setRefreshFailed(false);

    if (warning === "limit") {
      // Nothing extends past the absolute limit; this only acknowledges it.
      limitAcknowledgedRef.current = true;
    } else {
      // Staying always refreshes, idle prompt included: it proves to the server the session is
      // still good, and pushes the token expiry out so its own prompt doesn't follow right after.
      const timing = timingRef.current;
      const tokenDue = timing !== null && timing.expiresAt - now <= TOKEN_EXPIRY_WARNING_MS;
      setIsExtending(true);
      try {
        await refreshToken();
      } catch (error) {
        if ((error as FetchBaseQueryError | undefined)?.status === 401) {
          endSession("expired");
          return;
        }
        // Core unreachable. With time left on the token, the user being here is enough for now;
        // without it, keep the prompt up so they can retry.
        if (tokenDue) {
          setRefreshFailed(true);
          return;
        }
      } finally {
        setIsExtending(false);
      }
    }
    warningRef.current = null;
    tick();
  }, [endSession, refreshToken, tick]);

  const signOut = useCallback(() => endSession(), [endSession]);

  return { prompt, policy: info?.policy, isExtending, refreshFailed, staySignedIn, signOut };
}
