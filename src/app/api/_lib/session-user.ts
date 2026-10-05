import type { SessionRole, SessionUser } from "@/features/auth/auth.slice";
import type { CoreUserDto, CoreUserRoleDto } from "./core-contracts";

/**
 * One role, as both halves a caller needs.
 *
 * Core sends role objects. A bare string is tolerated because an older login response sent only
 * codes — reading `.name` off one of those yielded `undefined`, which is how a corporate login came
 * back with `roles: [null]`.
 */
function toSessionRole(role: CoreUserRoleDto | string): SessionRole | null {
  if (typeof role === "string") {
    return role ? { id: null, code: role, name: role } : null;
  }
  const code = role?.code ?? role?.name;
  if (!code) return null;
  return { id: role.id ?? null, code, name: role.name ?? code };
}

/**
 * CoreUserDto → SessionUser (the client-facing mirror). The browser gets
 * only what the UI needs — never tokens, never the raw core payload.
 */
export function toSessionUser(user: CoreUserDto): SessionUser {
  const roles = (user.roles ?? [])
    .map(toSessionRole)
    .filter((role): role is SessionRole => role !== null);

  // No roles yet on a first login; the user type is all there is to go on.
  const fallback: SessionRole[] = user.userType
    ? [{ id: null, code: user.userType, name: user.userType }]
    : [];

  return {
    id: user.id,
    name: user.username,
    roles: roles.length ? roles : fallback,
    permissions: user.permissions ?? [],
  };
}
