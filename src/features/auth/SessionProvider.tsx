"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useMeQuery } from "./auth.api";
import { setSession } from "./auth.slice";
import SessionTimeoutDialog from "./components/SessionTimeoutDialog";
import { isLeaving } from "./session-sync";
import { useAuth } from "./use-auth";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

/**
 * Restores the Redux session mirror after a full page load (the httpOnly
 * cookie survives refresh; Redux doesn't). Wraps the (portal) layout:
 *  - already authenticated this session → render immediately
 *  - otherwise call /me; spinner while restoring
 *  - /me fails → cookies are dead; log out (clears them) and reload to /login
 *  - once authenticated, SessionTimeoutDialog times the session out per the bank's policy
 */
export default function SessionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useAppDispatch();
  const { logout } = useAuth();
  const status = useAppSelector((state) => state.auth.status);

  const { data, isError, error } = useMeQuery(undefined, {});

  useEffect(() => {
    if (DEV_BYPASS) {
      dispatch(
        setSession({
          id: "dev",
          name: "Dev User",
          roles: [{ id: null, code: "SUPER_ADMIN", name: "Super admin" }],
          permissions: [],
        }),
      );
    }
  }, [dispatch, status]);

  useEffect(() => {
    if (data) dispatch(setSession(data));
  }, [data, dispatch]);

  useEffect(() => {
    if (!isError || isLeaving()) return;
    // Through the BFF logout, which clears the cookies — otherwise the route guard would bounce
    // /login straight back here. A 401 means the session ran out; anything else is just a failure.
    const expired = (error as FetchBaseQueryError | undefined)?.status === 401;
    logout(expired ? "expired" : undefined).catch(() => {});
  }, [isError, error, logout]);

  if (status !== "authenticated") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <>
      {children}
      {DEV_BYPASS ? null : <SessionTimeoutDialog />}
    </>
  );
}
