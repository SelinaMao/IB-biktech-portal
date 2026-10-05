"use client";

import React from "react";
import { Avatar, Box, Divider, IconButton, Menu, MenuItem, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { ExpandMoreRounded } from "@mui/icons-material";
import dayjs from "dayjs";

import { font, palette, radius } from "@/theme/palette";
import type { ExchangeRatePair, ExchangeRatesResponse } from "@/features/meta";
import SectionCard from "./SectionCard";

const formatAmount = (value: number, code: string) =>
  value.toLocaleString(undefined, {
    maximumFractionDigits: code === "KHR" ? 0 : 2,
  });

/** Converted (quote) amounts always show 2 decimals, even for KHR — only the base row uses its natural precision. */
const formatConvertedAmount = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** KHR is low-value enough that "1" isn't a meaningful default — use 1000 instead. */
const defaultUnit = (code: string | null) => (code === "KHR" ? 4000 : 1);

/** Strips anything but digits and a single decimal point — no letters, signs, or extra dots. */
const sanitizeAmount = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
};

/**
 * Converts an amount held in the quoted pair's base currency into its quote
 * currency (or back) using buy/sell rates instead of the mid rate — buying
 * the quote currency multiplies by buyRate, selling it back divides by
 * sellRate. Mirrors the mobile app's rate calculator.
 */
const calculateRate = (amount: number, fromCode: string, pairBase: string, rate: ExchangeRatePair) => {
  return fromCode === pairBase ? amount * rate.buyRate : amount / rate.sellRate;
};

export interface ExchangeRatesCardProps {
  data?: ExchangeRatesResponse;
  isLoading?: boolean;
  isError?: boolean;
}

export default function ExchangeRatesCard({ data, isLoading, isError }: ExchangeRatesCardProps) {
  const currencies = data?.currencies ?? [];
  const [pairBase, pairQuote] = (data?.rate.pair ?? "").split("/");

  /** Converts an amount held in `fromCode` into `toCode` using the quoted pair's buy/sell rates. */
  const convert = (amount: number, fromCode: string, toCode: string, decimalsOverride?: number) => {
    if (fromCode === toCode) return amount;
    if (!data?.rate || (fromCode !== pairBase && fromCode !== pairQuote)) return amount;
    const raw = calculateRate(amount, fromCode, pairBase, data.rate);
    const decimals = decimalsOverride ?? (toCode === "KHR" ? 0 : 2);
    return Math.round(raw * 10 ** decimals) / 10 ** decimals;
  };

  const [baseCode, setBaseCode] = React.useState<string | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [amount, setAmount] = React.useState("");
  const [editingCode, setEditingCode] = React.useState<string | null>(null);

  // Currencies only arrive once the fetch resolves — default the base to the
  // first one as soon as they show up.
  React.useEffect(() => {
    if (!baseCode && currencies.length > 0) setBaseCode(currencies[0].currency);
  }, [currencies, baseCode]);

  const rows = [...currencies].sort((a, b) =>
    a.currency === baseCode ? -1 : b.currency === baseCode ? 1 : 0
  );

  const enteredAmount = amount.trim() === "" ? null : Number(amount);
  const hasAmount = enteredAmount !== null && Number.isFinite(enteredAmount);

  /** Switching the base currency clears the typed amount back to its default unit. */
  const switchBase = (code: string) => {
    if (code === baseCode) return;
    setAmount("");
    setBaseCode(code);
  };

  const startEditing = (code: string) => {
    if (hasAmount) {
      switchBase(code);
    } else {
      // Nothing typed yet — seed the field with the base's default unit converted into this currency.
      setAmount(baseCode ? String(convert(defaultUnit(baseCode), baseCode, code)) : "");
      setBaseCode(code);
    }
    setEditingCode(code);
  };

  const selectBase = (code: string) => {
    switchBase(code);
    setAnchorEl(null);
  };

  return (
    <SectionCard title="Exchange rates" showBorder={false}>
      <Typography
        variant="caption"
        sx={{ display: "block", color: palette.slate[400], mt: -1.5, mb: 2 }}
      >
        {data?.lastUpdate ? `Last update: ${dayjs(data.lastUpdate).format("DD MMM YYYY")}` : " "}
      </Typography>
      <Divider sx={{ mb: 1.5 }} />
      {/* Column Headers */}
      <Stack direction="row" sx={{ px: 0, pb: 1.5, color: palette.slate[400] }}>
        <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, fontSize: 13 }}>
          Currency
        </Typography>
        <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, fontSize: 13, textAlign: "right" }}>
          Rate
        </Typography>
      </Stack>
      {isLoading && rows.length === 0 ? (
        <Stack spacing={1.5} sx={{ py: 1.5 }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: `${radius.lg}px` }} />
          ))}
        </Stack>
      ) : isError && rows.length === 0 ? (
        <Typography variant="body2" sx={{ color: palette.slate[400], py: 2, textAlign: "center" }}>
          Could not load exchange rates.
        </Typography>
      ) : (
        <Stack divider={<Divider flexItem />}>
          {rows.map((r) => {

            const isBase = r.currency === baseCode;
            const hasRate = r.currency === pairBase || r.currency === pairQuote;
            return (
              <Stack
                key={r.currency}
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center", py: 1.5, justifyContent: "space-between" }}
              >
                <Box
                  onClick={() => switchBase(r.currency)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    flex: 1,
                    cursor: "pointer",
                    ...(isBase && {
                      bgcolor: palette.info.bg,
                      borderRadius: `${radius.lg}px`,
                      p: 2,
                      pr: 3,
                    }),
                  }}
                >
                  <Avatar
                    src={r.icon}
                    variant="rounded"
                    sx={{
                      width: 40,
                      height: 40,
                      fontSize: 18,
                      borderRadius: `${radius.md}px`,
                      bgcolor: isBase ? palette.white : palette.slate[100],
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" sx={{ alignItems: "center", gap: 3 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                        {r.currency}
                      </Typography>
                      {isBase && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnchorEl(e.currentTarget);
                          }}
                          sx={{ p: 0 }}
                        >
                          <ExpandMoreRounded sx={{ fontSize: font.icon.lg, color: palette.info[900] }} />
                        </IconButton>
                      )}
                    </Stack>
                    <Typography variant="caption" sx={{ color: palette.slate[500], fontSize: 12 }}>
                      {r.description}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right", flex: 1 }}>
                  {editingCode === r.currency ? (
                    <TextField
                      autoFocus
                      variant="outlined"
                      size="small"
                      value={amount}
                      onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => setEditingCode(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      inputMode="decimal"
                      placeholder="0"
                      slotProps={{
                        input: {
                          endAdornment: (
                            <Typography sx={{ fontSize: font.size.base, color: palette.slate[950], pl: 0.5 }}>
                              {r.currency}
                            </Typography>
                          ),
                          sx: { borderRadius: `${radius.md}px`, bgcolor: palette.white },
                        },
                        htmlInput: { style: { textAlign: "right", fontWeight: 700, fontSize: font.size.base } },
                      }}
                      sx={{ maxWidth: 150 }}
                    />
                  ) : (
                    <Typography
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(r.currency);
                      }}
                      sx={{ fontSize: font.size.base, cursor: hasRate || isBase ? "pointer" : "default" }}
                    >
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        {hasAmount && baseCode
                          ? isBase
                            ? formatAmount(enteredAmount!, r.currency)
                            : formatConvertedAmount(convert(enteredAmount!, baseCode, r.currency, 2))
                          : isBase
                            ? String(defaultUnit(baseCode))
                            : baseCode
                              ? formatConvertedAmount(convert(defaultUnit(baseCode), baseCode, r.currency, 2))
                              : "–"}
                      </Box>{" "}
                      <Box component="span" sx={{ color: palette.slate[950] }}>
                        {r.currency}
                      </Box>
                    </Typography>
                  )}
                  {hasRate && data?.rate && !isBase && (
                    <Typography variant="caption" sx={{ color: palette.slate[950], fontSize: font.size.md, display: "block" }}>
                      1 {pairBase} ={" "}
                      {formatAmount(
                        baseCode === pairQuote ? data.rate.sellRate : data.rate.buyRate,
                        pairQuote
                      )}{" "}
                      {pairQuote}
                    </Typography>
                  )}
                </Box>
              </Stack>
            );
          })}
        </Stack>
      )}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {currencies.map((r) => (
          <MenuItem
            key={r.currency}
            selected={r.currency === baseCode}
            onClick={() => selectBase(r.currency)}
          >
            {r.currency} — {r.description}
          </MenuItem>
        ))}
      </Menu>
    </SectionCard>
  );
}
