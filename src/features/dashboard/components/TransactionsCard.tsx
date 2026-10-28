"use client";

import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Button, Typography } from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronFirst,
  ChevronLast,
  Search,
} from "lucide-react";

import { palette, radius, padding } from "@/theme/palette";
import { useAppSelector } from "@/store/hooks";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import {
  selectTransactionsResponse,
  useListTransactionsMutation,
} from "@/features/account";
import type { TxnDirection } from "../dashboard.types";
import BasePagination from "@/@core/components/BasePagination";
import BaseFilterByDay from "@/@core/components/BaseFilterByDay";
import BaseFilter, {
  BASE_FILTER_TYPE_LABELS,
  type BaseFilterTypeOption,
  type BaseFilterValue,
} from "@/@core/components/BaseFilter";

export interface TransactionItem {
  id?: string;
  title: string;
  ref: string;
  date: string;
  account: string;
  amount: number;
  direction: TxnDirection;
}

const defaultTransactions: TransactionItem[] = [
  {
    id: "1",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 Jun 2026",
    account: "Savings - 000 067 898",
    amount: -25.0,
    direction: "out",
  },
  {
    id: "2",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 Jun 2026",
    account: "Savings - 000 067 898",
    amount: 25.0,
    direction: "in",
  },
  {
    id: "3",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 Jun 2026",
    account: "Savings - 000 067 898",
    amount: -25.0,
    direction: "out",
  },
  {
    id: "4",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 Jun 2026",
    account: "Savings - 000 067 898",
    amount: -25.0,
    direction: "out",
  },
  {
    id: "5",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 Jun 2026",
    account: "Savings - 000 067 898",
    amount: 25.0,
    direction: "in",
  },
];

const FETCH_LIMIT = 20;
const ROWS_PER_PAGE = 5;

/** This card offers All plus short rolling windows — not BaseFilter's full month list. */
const DATE_FILTER_OPTIONS: BaseFilterTypeOption[] = [
  { value: "all", label: "All" },
  { value: "last7Days", label: "Last 7 days" },
  { value: "last30Days", label: "Last 30 days" },
  { value: "customDate", label: "Custom Date" },
];

const formatTxnAmount = (amount: number) => {
  const sign = amount < 0 ? "-" : "";
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${formatted}`;
};

/**
 * Splits "Savings - 000 067 898" into the two lines the Account column shows:
 * the product name on top, the masked number below. Only the first and last
 * three digits stay readable — everything between them becomes asterisks.
 */
const splitAccount = (account: string) => {
  const [label, ...rest] = account.split(" - ");
  const digits = rest.join(" - ").replace(/\D/g, "");
  const masked =
    digits.length > 6
      ? `${digits.slice(0, 3)}${"*".repeat(digits.length - 6)}${digits.slice(-3)}`
      : digits;
  return { label, masked };
};

export interface TransactionsCardProps {
  accountNumber?: string;
  type?: string;
}

export default function TransactionsCard({
  accountNumber,
  type,
}: TransactionsCardProps) {
  const [statusTab, setStatusTab] = useState<"Processed" | "Pending">("Pending");
  const [dateFilter, setDateFilter] = useState<BaseFilterValue>({
    type: "last7Days",
    from: null,
    to: null,
  });
  const [rangeAnchor, setRangeAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const [listTransactions] = useListTransactionsMutation();
  useEffect(() => {
    if (!accountNumber) return;
    listTransactions({
      accountNumber,
      type: type ?? "",
      limit: FETCH_LIMIT,
      offset: 0,
    });
  }, [accountNumber, type, listTransactions]);

  useEffect(() => {
    setPage(0);
  }, [accountNumber]);

  const transactionsResponse = useAppSelector(selectTransactionsResponse);
  const apiTransactions = useMemo(
    () =>
      transactionsResponse && transactionsResponse.accountNumber === accountNumber
        ? transactionsResponse.data.map(
          (entry): TransactionItem => ({
            id: entry.transactionId,
            title: entry.transactionDescription || entry.transactionCode || "Bakong Payment",
            ref: entry.transactionId || "2819700093P2429",
            date: entry.transactionDate
              ? dayjs(entry.transactionDate).format("DD MMM YYYY")
              : "11 Jun 2026",
            account: `Savings - ${accountNumber ?? "000 067 898"}`,
            amount: entry.transactionAmount,
            direction: entry.transactionAmount >= 0 ? "in" : "out",
          }),
        )
        : undefined,
    [transactionsResponse, accountNumber],
  );

  const allRows = apiTransactions && apiTransactions.length > 0
    ? apiTransactions
    : defaultTransactions;

  const filteredRows = useMemo(() => {
    if (!search.trim()) return allRows;
    const q = search.trim().toLowerCase();
    return allRows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.ref.toLowerCase().includes(q) ||
        r.account.toLowerCase().includes(q),
    );
  }, [allRows, search]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = filteredRows.slice(
    currentPage * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE + ROWS_PER_PAGE,
  );

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
          mb: 2.5,
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
          Transactions
        </Typography>

        {/* Processed / Pending Pill Toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: palette.slate[100],
            borderRadius: "9999px",
            px: 0.1,
            py: 0.2,
          }}
        >
          {(["Processed", "Pending"] as const).map((tab) => {
            const isActive = statusTab === tab;
            return (
              <Box
                key={tab}
                onClick={() => setStatusTab(tab)}
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderRadius: "9999px",
                  bgcolor: isActive ? "#1E659E" : "transparent",
                  color: isActive ? "#FFFFFF" : palette.slate[700],
                  fontSize: 13,
                  fontWeight: isActive ? 400 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tab}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ---------- Filter Row: Search & Date Buttons ---------- */}
      <Box
        sx={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: "1px solid ",
          borderTopColor: palette.secondary[100],
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 4,
        }}
      >
        {/* Search Input */}
        <Box

          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1.8,

            borderRadius: `${radius.md}px`,
            border: `1px solid ${palette.slate[200]}`,
            bgcolor: "#FFFFFF",
            width: { xs: "100%", sm: 260 },
          }}
        >
          <Search size={18} color={palette.slate[400]} />
          <Box
            component="input"
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              border: "none",
              outline: "none",
              fontSize: 14,
              color: palette.slate[900],
              bgcolor: "transparent",
              width: "100%",
              "&::placeholder": {
                color: palette.slate[400],
              },
            }}
          />
        </Box>

        {/* Date Filter Buttons */}
        <>
          <Button
            variant="outlined"
            size="small"
            endIcon={<KeyboardArrowDownRoundedIcon />}
            onClick={(e) => setRangeAnchor(e.currentTarget)}
            sx={{ color: "text.primary", borderColor: palette.slate[200] }}
          >
            {BASE_FILTER_TYPE_LABELS[dateFilter.type]}
          </Button>
          <BaseFilter
            anchorEl={rangeAnchor}
            onClose={() => setRangeAnchor(null)}
            defaultValue={dateFilter}
            typeOptions={DATE_FILTER_OPTIONS}
            onApply={(value) => {
              setDateFilter(value);
              setRangeAnchor(null);
            }}
          />
        </>
        {/* <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            flexWrap: "wrap",
          }}
        >
          {["Last 7days", "Last 30days", "Custom date"].map((f) => {
            const isSelected = dateFilter === f;
            return (
              <Box
                key={f}
                onClick={() => setDateFilter(f)}
                sx={{
                  px: 3,
                  py: 1.75,
                  borderRadius: `${radius.md}px`,
                  border: `1px solid ${palette.slate[200]}`,
                  bgcolor: isSelected ? palette.slate[100] : "#FFFFFF",
                  color: palette.slate[700],
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: palette.slate[50],
                  },
                }}
              >
                {f}
              </Box>
            );
          })}
        </Box> */}
      </Box>

      {/* ---------- Table Content ---------- */}
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: 640 }}>
          {/* Table Header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "2.4fr 1.6fr 2fr 1fr",
              alignItems: "center",
              pb: 2,
              borderBottom: `1px solid ${palette.slate[200]}`,
              px: 1,
            }}
          >
            <Typography
              sx={{ fontSize: 15, color: palette.slate[500] }}
            >
              To/From
            </Typography>
            <Typography
              sx={{ fontSize: 15, color: palette.slate[500] }}
            >
              Transaction Date
            </Typography>
            <Typography
              sx={{ fontSize: 15, color: palette.slate[500] }}
            >
              Account
            </Typography>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 500,
                color: palette.slate[500],
                textAlign: "right",
              }}
            >
              Amount
            </Typography>
          </Box>

          {/* Table Rows */}
          <Box sx={{ display: "flex", flexDirection: "column", padding: 1 }}>
            {pageItems.map((t, idx) => {
              const isNegative = t.direction === "out" || t.amount < 0;
              const account = splitAccount(t.account);
              return (
                <Box
                  key={t.id ?? `${t.ref}-${idx}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "2.4fr 1.6fr 2fr 1fr",
                    alignItems: "center",
                    py: 2.75,
                    px: 1.75,
                    borderBottom: `1px solid ${palette.slate[50]}`,
                    "&:hover": {
                      bgcolor: palette.slate[50],
                      borderRadius: `${radius.md}px`,
                    },
                  }}
                >
                  {/* To/From with circular arrow icon */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        bgcolor: isNegative ? "#FEE8E8" : "#E6F4EA",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isNegative ? "#E11D48" : "#16A34A",
                        flexShrink: 0,
                      }}
                    >
                      {isNegative ? (
                        <ArrowUpRight size={18} strokeWidth={1.8} />
                      ) : (
                        <ArrowDownLeft size={18} strokeWidth={1.8} />
                      )}
                    </Box>

                    <Box>
                      <Typography
                        sx={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: palette.slate[900],
                          lineHeight: 1.25,
                        }}
                      >
                        {t.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: palette.slate[450],
                          lineHeight: 1.50,
                          mt: 0.50,
                        }}
                      >
                        Ref: {t.ref}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Transaction Date */}
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: palette.slate[900],
                    }}
                  >
                    {t.date}
                  </Typography>

                  {/* Account — product name over the masked number */}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: palette.slate[900],
                        lineHeight: 1.50,
                      }}
                    >
                      {account.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: palette.slate[450],
                        lineHeight: 1.25,
                        mt: 0.50,
                      }}
                    >
                      {account.masked}
                    </Typography>
                  </Box>

                  {/* Amount */}
                  <Typography
                    sx={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: palette.slate[900],
                      textAlign: "right",
                    }}
                  >
                    <BaseBlurText>
                      {formatTxnAmount(t.amount)}
                    </BaseBlurText>
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* ---------- Pagination Row ---------- */}
      <Box sx={{ mt: 2 }}>
        <BasePagination
          count={filteredRows.length}
          page={currentPage}
          rowsPerPage={ROWS_PER_PAGE}
          onPageChange={setPage}
          variant="compact"
        />
      </Box>
    </BaseCard>
  );
}
