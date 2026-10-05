import "server-only";

/**
 * Errors the BFF raises itself, in the same envelope core and the gateway send
 * (`message` / `detail` / `errorCode` / `referenceCode` / `correlationId`), so the
 * client shows every failure the same way and every one carries a reference a
 * user can quote to support. Ported from sme-backoffice-portal.
 */
type BffErrorInput = {
  errorCode: string;
  statusCode: number;
  message: string;
  detail: string;
  service?: string;
  module?: string;
  action?: string;
};

export function createBffError({
  errorCode,
  statusCode,
  message,
  detail,
  service = "00",
  module = "00",
  action = "000",
}: BffErrorInput) {
  const correlationId = crypto.randomUUID();
  const shortReference = correlationId.replaceAll("-", "").slice(0, 8).toUpperCase();
  const environment = environmentCode();
  return {
    success: false,
    errorCode,
    referenceCode: `${environment}${service}${module}${action}-${shortReference}`,
    statusCode,
    message,
    detail,
    correlationId,
    timestamp: new Date().toISOString(),
    errors: null,
  };
}

export function bffErrorResponse(input: BffErrorInput) {
  return Response.json(createBffError(input), { status: input.statusCode });
}

/** 400 — the request reached the BFF without the body it needs. */
export function badRequestResponse(detail = "Please check your details and try again.") {
  return bffErrorResponse({
    errorCode: "GTW-00-004",
    statusCode: 400,
    message: "Invalid request",
    detail,
  });
}

/** 401 — no session cookie, or one that is no longer good. */
export function notAuthenticatedResponse(detail = "Please log in and try again.") {
  return bffErrorResponse({
    errorCode: "GTW-00-005",
    statusCode: 401,
    message: "Not authenticated",
    detail,
  });
}

/** 502 — core could not be reached or answered with something unusable. */
export function badUpstreamResponse(
  detail = "The bank service is temporarily unavailable. Please try again later.",
) {
  return bffErrorResponse({
    errorCode: "GTW-00-999",
    statusCode: 502,
    message: "Service unavailable",
    detail,
  });
}

/**
 * Body for a core failure that came back without a usable error envelope (e.g. a proxy's HTML
 * error page): keeps the route's own title, and still gives the user a reference.
 */
export function upstreamFailure(
  message: string,
  { statusCode = 502, detail = "Please try again later." }: { statusCode?: number; detail?: string } = {},
) {
  return createBffError({ errorCode: "GTW-00-999", statusCode, message, detail });
}

function environmentCode() {
  const value = (process.env.SME_ENV_CODE ?? "S").toUpperCase();
  if (!/^[SUP]$/.test(value)) throw new Error("SME_ENV_CODE must be S, U, or P");
  return value;
}
