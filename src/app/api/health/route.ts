/**
 * Liveness probe for load balancers / container orchestration.
 * Deliberately unauthenticated and dependency-free: it reports that the
 * BFF process is up, nothing about core connectivity (that would leak
 * internal state on an open endpoint).
 */
export function GET() {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
