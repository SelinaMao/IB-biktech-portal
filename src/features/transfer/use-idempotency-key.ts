"use client";

import React from "react";

/**
 * Idempotency-Key lifecycle for a single transfer submission.
 *
 * ADR-004 (payment-service `cbs.idempotency.paths`) requires every money-movement
 * POST to carry an `Idempotency-Key` header. The key is **per submit attempt**, not
 * per session: the first time the user hits Confirm we mint a UUID v4; if the
 * network request fails and the user hits Confirm again (within the same open
 * form), we **reuse** the same key so the server either replays its stored
 * response or recognises the duplicate. Once the server returns a terminal
 * answer (success *or* a non-retryable failure), we clear it so the next
 * form submission starts a fresh key.
 *
 * Usage:
 *   const idem = useIdempotencyKey();
 *   const key = idem.ensure();         // mint-or-reuse
 *   await submit({ ...body, headers: { "Idempotency-Key": key } });
 *   idem.reset();                      // on terminal success/failure
 */
export function useIdempotencyKey() {
  const keyRef = React.useRef<string | null>(null);

  const ensure = React.useCallback((): string => {
    if (!keyRef.current) {
      keyRef.current = crypto.randomUUID();
    }
    return keyRef.current;
  }, []);

  const reset = React.useCallback((): void => {
    keyRef.current = null;
  }, []);

  const peek = React.useCallback((): string | null => keyRef.current, []);

  return { ensure, reset, peek };
}
