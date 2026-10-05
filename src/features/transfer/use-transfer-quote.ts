"use client";

import React from "react";

import { showToast } from "@core/components/AppToast";
import { toToastError } from "@/utils/api-error";
import { useCalculateTransferMutation } from "./transfer.api";
import type { CalculateTransferRequest, CalculateTransferResult } from "./transfer.types";

export type TransferQuoteStatus = "idle" | "loading" | "error" | "ready";

/**
 * Prices a transfer on payment-service (amount, fee, rate, debit and credit) for the Review
 * step's Summary. Only the latest request counts: going back and changing the form while a
 * price is on its way drops the stale answer.
 */
export function useTransferQuote() {
  const [calculate] = useCalculateTransferMutation();
  const [quote, setQuote] = React.useState<CalculateTransferResult | null>(null);
  const [status, setStatus] = React.useState<TransferQuoteStatus>("idle");
  const latest = React.useRef<CalculateTransferRequest | null>(null);

  const fetchQuote = React.useCallback(
    async (request: CalculateTransferRequest) => {
      latest.current = request;
      setQuote(null);
      setStatus("loading");
      try {
        const result = await calculate(request).unwrap();
        if (latest.current !== request) return;
        setQuote(result);
        setStatus("ready");
      } catch (error) {
        if (latest.current !== request) return;
        setStatus("error");
        showToast("error", toToastError(error, "Could not price the transfer"));
      }
    },
    [calculate],
  );

  const retry = React.useCallback(() => {
    if (latest.current) void fetchQuote(latest.current);
  }, [fetchQuote]);

  const reset = React.useCallback(() => {
    latest.current = null;
    setQuote(null);
    setStatus("idle");
  }, []);

  return { quote, status, fetchQuote, retry, reset };
}
