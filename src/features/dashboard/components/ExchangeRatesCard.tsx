"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import { ChevronDown, GripVertical, RotateCcw } from "lucide-react";

import { palette, radius, padding } from "@/theme/palette";
import BaseCard from "@core/components/BaseCard";
import type { ExchangeRatesResponse } from "@/features/meta";
import BaseButton from "@/@core/components/BaseButton";

function FlagIcon({ code }: { code: string }) {
  switch (code) {
    case "USD":
      return (
        <svg
          width={22}
          height={15}
          viewBox="0 0 24 16"
          fill="none"
          style={{ borderRadius: 2, flexShrink: 0 }}
        >
          <rect width="24" height="16" fill="#B22234" />
          <path
            d="M0 2.46h24v1.23H0zM0 4.92h24v1.23H0zM0 7.38h24v1.23H0zM0 9.85h24v1.23H0zM0 12.31h24v1.23H0zM0 14.77h24v1.23H0z"
            fill="#FFF"
          />
          <rect width="10" height="8.6" fill="#3C3B6E" />
        </svg>
      );
    case "KHR":
      return (
        <svg
          width={22}
          height={15}
          viewBox="0 0 24 16"
          fill="none"
          style={{ borderRadius: 2, flexShrink: 0 }}
        >
          <rect width="24" height="16" fill="#032EA6" />
          <rect y="4" width="24" height="8" fill="#ED1B24" />
          <path d="M12 5.5l1.5 2.5h-3L12 5.5zM10.5 8h3v2.5h-3V8z" fill="#FFF" />
        </svg>
      );
    case "CNY":
      return (
        <svg
          width={22}
          height={15}
          viewBox="0 0 24 16"
          fill="none"
          style={{ borderRadius: 2, flexShrink: 0 }}
        >
          <rect width="24" height="16" fill="#DE2910" />
          <polygon
            points="4,2 5,4.5 7.5,4.5 5.5,6 6.5,8.5 4,7 1.5,8.5 2.5,6 0.5,4.5 3,4.5"
            fill="#FFDE00"
            transform="scale(0.5) translate(4,2)"
          />
        </svg>
      );
    case "YEN":
    case "JPY":
      return (
        <svg
          width={22}
          height={15}
          viewBox="0 0 24 16"
          fill="none"
          style={{ borderRadius: 2, flexShrink: 0 }}
        >
          <rect width="24" height="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
          <circle cx="12" cy="8" r="4.5" fill="#BC002D" />
        </svg>
      );
    case "EURO":
    case "EUR":
      return (
        <svg
          width={22}
          height={15}
          viewBox="0 0 24 16"
          fill="none"
          style={{ borderRadius: 2, flexShrink: 0 }}
        >
          <rect width="24" height="16" fill="#003399" />
          <circle
            cx="12"
            cy="8"
            r="4.5"
            stroke="#FFCC00"
            strokeWidth="1"
            strokeDasharray="1.5 1.5"
            fill="none"
          />
        </svg>
      );
    default:
      return (
        <Box
          sx={{
            width: 22,
            height: 15,
            bgcolor: palette.slate[200],
            borderRadius: 0.5,
          }}
        />
      );
  }
}

export interface BaseCurrencyOption {
  code: string;
  name: string;
  defaultUnit: number;
}

const baseCurrencies: BaseCurrencyOption[] = [
  { code: "USD", name: "US Dollars", defaultUnit: 1 },
  { code: "KHR", name: "Khmer Riel", defaultUnit: 4000 },
  { code: "CNY", name: "Chinese Yuan", defaultUnit: 1 },
  { code: "YEN", name: "Japanese Yen", defaultUnit: 100 },
  { code: "EURO", name: "European Euro", defaultUnit: 1 },
];

export interface RateItem {
  code: string;
  name: string;
  rate: string;
}

const defaultRates: RateItem[] = [
  { code: "KHR", name: "Khmer Riel", rate: "3,940" },
  { code: "CNY", name: "Chinese Yuan", rate: "7.10" },
  { code: "YEN", name: "Japanese Yen", rate: "147.08" },
  { code: "EURO", name: "European Euro", rate: "0.85" },
];

export interface ExchangeRatesCardProps {
  data?: ExchangeRatesResponse;
  isLoading?: boolean;
  isError?: boolean;
  onRefresh?: () => void;
  viewAllHref?: string;
}

export default function ExchangeRatesCard({
  data,
  isLoading,
  onRefresh,
  viewAllHref = "#",
}: ExchangeRatesCardProps) {
  const [selectedBase, setSelectedBase] = useState<BaseCurrencyOption>(
    baseCurrencies[0],
  );
  const [amount, setAmount] = useState<number | string>(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectCurrency = (curr: BaseCurrencyOption) => {
    setSelectedBase(curr);
    setAmount(curr.defaultUnit);
    handleCloseMenu();
  };

  const lastUpdateLabel = data?.lastUpdate
    ? `Last update: ${dayjs(data.lastUpdate).format("D MMMM YYYY | HH:mm A")}`
    : "Last update: 3 September 2026 | 14:00 PM";

  const rows: RateItem[] = React.useMemo(() => {
    if (!data?.currencies?.length) return defaultRates;
    return defaultRates.map((d) => {
      const match = data.currencies.find((c) => c.currency === d.code);
      if (d.code === "KHR" && data.rate?.buyRate) {
        return {
          ...d,
          rate: Math.round(data.rate.buyRate).toLocaleString(),
        };
      }
      return match ? { ...d, name: match.description || d.name } : d;
    });
  }, [data]);

  // Exclude selected base currency from list if present
  const displayRows = rows.filter((r) => r.code !== selectedBase.code);

  return (
    <BaseCard
      sx={{
        p: `${padding.xxl}px`,
        borderRadius: `${radius.xl}px`,
        border: `1px solid ${palette.slate[200]}`,
        bgcolor: "#FFFFFF",
      }}
    >
      {/* ---------- Header Row ---------- */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 18, sm: 20 },
            fontWeight: 700,
            color: palette.slate[900],
            lineHeight: 1.2,
          }}
        >
          Exchange rate
        </Typography>

        {/* Refresh Icon Button */}
        <Box
          component="button"
          type="button"
          onClick={onRefresh}
          aria-label="Refresh exchange rates"
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            bgcolor: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: palette.slate[900],
            backgroundColor:palette.slate[100],
            cursor: "pointer",
            transition: "all 0.15s ease",
            "&:hover": {
              bgcolor: palette.slate[100],
            },
          }}
        >
          <RotateCcw size={18} />
        </Box>
      </Box>

      {/* Last Update */}
      <Typography
        sx={{
          fontSize: 13,
          color: palette.slate[450],
          mt: 0.5,
          mb: 2,
        }}
      >
        {lastUpdateLabel}
      </Typography>

      {/* ---------- Base Currency Selector Box ---------- */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: palette.slate[50],
          borderRadius: `${radius.md}px`,
          px: 1.75,
          py: 1.25,
        }}
      >
        {/* Left: Interactive Dropdown Trigger */}
        <Box
          component="button"
          type="button"
          onClick={handleOpenMenu}
          aria-haspopup="true"
          aria-expanded={Boolean(anchorEl)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            border: "none",
            bgcolor: "transparent",
            cursor: "pointer",
            p: 0,
            borderRadius: `${radius.sm}px`,
            transition: "opacity 0.15s ease",
            "&:hover": {
              opacity: 0.8,
            },
          }}
        >
          <FlagIcon code={selectedBase.code} />
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              color: palette.slate[900],
            }}
          >
            {selectedBase.name}
          </Typography>
          <ChevronDown
            size={16}
            color={palette.slate[700]}
            style={{
              transform: anchorEl ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          />
        </Box>

        {/* Right: Amount */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box
            component="input"
            type="text"
            value={amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "");
              setAmount(val);
            }}
            sx={{
              width: 50,
              textAlign: "right",
              border: "none",
              outline: "none",
              bgcolor: "transparent",
              fontSize: 15,
              fontWeight: 600,
              color: palette.slate[900],
              p: 0,
            }}
          />
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              color: palette.slate[900],
            }}
          >
            {selectedBase.code}
          </Typography>
        </Box>
      </Box>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            mt: 0.75,
            borderRadius: `${radius.md}px`,
            border: `1px solid ${palette.slate[200]}`,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            minWidth: 220,
            py: 0.5,
          },
        }}
      >
        {baseCurrencies.map((c) => {
          const isSelected = c.code === selectedBase.code;
          return (
            <MenuItem
              key={c.code}
              selected={isSelected}
              onClick={() => handleSelectCurrency(c)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                py: 1,
                px: 2,
                fontSize: 14,
                fontWeight: isSelected ? 600 : 400,
                bgcolor: isSelected
                  ? `${palette.slate[100]} !important`
                  : "transparent",
                "&:hover": {
                  bgcolor: palette.slate[50],
                },
              }}
            >
              <FlagIcon code={c.code} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 500,
                    color: palette.slate[900],
                  }}
                >
                  {c.name}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: palette.slate[450] }}>
                {c.code}
              </Typography>
            </MenuItem>
          );
        })}
      </Menu>

      {/* ---------- Section Title: List ---------- */}
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: 700,
          color: palette.slate[900],
          mt: 2.25,
          mb: 1.25,
        }}
      >
        List
      </Typography>

      {/* ---------- Currency List Container ---------- */}
      <Box
        sx={{
          bgcolor: palette.slate[50],
          borderRadius: `${radius.lg}px`,
          overflow: "hidden",
        }}
      >
        {displayRows.map((row, index) => {
          const isLast = index === displayRows.length - 1;
          return (
            <Box
              key={row.code}
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 44px",
                alignItems: "center",
                borderBottom: isLast
                  ? "none"
                  : `1px solid ${palette.slate[200]}`,
                transition: "background-color 0.15s ease",
                "&:hover": {
                  bgcolor: palette.slate[100],
                },
              }}
            >
              {/* Main Section: Currency Label & Rate */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.5,
                  px: 2,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: palette.slate[900],
                      lineHeight: 1.2,
                    }}
                  >
                    {row.code}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: palette.slate[500],
                      lineHeight: 1.2,
                      mt: 0.25,
                    }}
                  >
                    {row.name}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: palette.slate[900],
                  }}
                >
                  {row.rate}
                </Typography>
              </Box>

              {/* Drag Grip Handle */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  borderLeft: `1px solid ${palette.slate[200]}`,
                  color: palette.slate[400],
                }}
              >
                <GripVertical size={18} />
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Footer View All Button */}
      <BaseButton
        component="button"
        href={viewAllHref}
        title="View all"
        fullWidth
        sx={{

          py: 1.4,
          borderRadius: "9999px",
          bgcolor: palette.slate[100],
          color: palette.slate[900],
          fontSize: 15,
          fontWeight: 500,
          textDecoration: "none",
          mt: 4,
          "&:hover": {
            bgcolor: palette.slate[200],
          },
        }}
      />
    </BaseCard>
  );
}
