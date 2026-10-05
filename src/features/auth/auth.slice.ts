import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Client-only session state. The authoritative session lives in an httpOnly
 * cookie set by the BFF; this mirror exists purely to drive the UI (show the
 * user, gate what the UI renders). Never store raw tokens here.
 */
/** A role on the session: `code` is what to gate on, `name` is what to show. */
export interface SessionRole {
  id: string | null;
  code: string;
  name: string;
}

export interface SessionUser {
  id: string;
  name: string;
  roles: SessionRole[];
  permissions: string[];
}

export interface AuthState {
  user: SessionUser | null;
  status: "unknown" | "authenticated" | "unauthenticated";
}

const initialState: AuthState = {
  user: null,
  status: "unknown",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<SessionUser>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
    clearSession(state) {
      state.user = null;
      state.status = "unauthenticated";
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
