/**
 * Runs once when the server starts, before any request is handled.
 * NEXT_PUBLIC_DEV_BYPASS_AUTH short-circuits both the route guard
 * (src/proxy.ts) and session restore (src/features/auth/SessionProvider.tsx)
 * — it must never reach a production deploy.
 */
export function register() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true"
  ) {
    throw new Error(
      "NEXT_PUBLIC_DEV_BYPASS_AUTH=true in a production build — this disables authentication for every user. Unset it before deploying.",
    );
  }
}
