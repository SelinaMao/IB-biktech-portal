import { redirect } from "next/navigation";

/**
 * Root entry point. Goes to the login screen; authenticated users are sent
 * to /dashboard by the login flow. TODO: read the session cookie here and
 * skip the login screen when already authenticated.
 */
export default function RootPage() {
  redirect("/login");
}
