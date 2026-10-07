"use client";

import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Typography } from "@mui/material";
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
    date: "11 June 2026",
    account: "Savings - 000 067 898",
    amount: -25.0,
    direction: "out",
  },
  {
    id: "2",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 June 2026",
    account: "Savings - 000 067 898",
    amount: 25.0,
    direction: "in",
  },
  {
    id: "3",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 June 2026",
    account: "Savings - 000 067 898",
    amount: -25.0,
    direction: "out",
  },
  {
    id: "4",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 June 2026",
    account: "Savings - 000 067 898",
    amount: -25.0,
    direction: "out",
  },
  {
    id: "5",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 June 2026",
    account: "Savings - 000 067 898",
    amount: 25.0,
    direction: "in",
  },
];

const FETCH_LIMIT = 20;
const ROWS_PER_PAGE = 5;

const formatTxnAmount = (amount: number) => {
  const sign = amount < 0 ? "-" : "";
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${formatted}`;
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
  const [dateFilter, setDateFilter] = useState("Last 7days");
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
                ? dayjs(entry.transactionDate).format("DD MMMM YYYY")
                : "11 June 2026",
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
            p: "3px",
          }}
        >
          {(["Processed", "Pending"] as const).map((tab) => {
            const isActive = statusTab === tab;
            return (
              <Box
                key={tab}
                onClick={() => setStatusTab(tab)}
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: "9999px",
                  bgcolor: isActive ? "#1E659E" : "transparent",
                  color: isActive ? "#FFFFFF" : palette.slate[700],
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 2.5,
        }}
      >
        {/* Search Input */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.8,
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
        <Box
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
                  px: 2,
                  py: 0.75,
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
        </Box>
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
              pb: 1.5,
              borderBottom: `1px solid ${palette.slate[200]}`,
              px: 0.5,
            }}
          >
            <Typography
              sx={{ fontSize: 13, fontWeight: 500, color: palette.slate[500] }}
            >
              To/From
            </Typography>
            <Typography
              sx={{ fontSize: 13, fontWeight: 500, color: palette.slate[500] }}
            >
              Transaction Date
            </Typography>
            <Typography
              sx={{ fontSize: 13, fontWeight: 500, color: palette.slate[500] }}
            >
              Account
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: palette.slate[500],
                textAlign: "right",
              }}
            >
              Amount
            </Typography>
          </Box>

          {/* Table Rows */}
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {pageItems.map((t, idx) => {
              const isNegative = t.direction === "out" || t.amount < 0;
              return (
                <Box
                  key={t.id ?? `${t.ref}-${idx}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "2.4fr 1.6fr 2fr 1fr",
                    alignItems: "center",
                    py: 1.75,
                    px: 0.5,
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
                          lineHeight: 1.25,
                          mt: 0.25,
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

                  {/* Account */}
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: palette.slate[500],
                    }}
                  >
                    {t.account}
                  </Typography>

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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 3.5,
          pt: 3,
          mt: 1,
        }}
      >
        <Typography
          sx={{ fontSize: 13, color: palette.slate[900], fontWeight: 500 }}
        >
          {filteredRows.length} Transactions
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
          {/* Page Badge */}
          <Box
            sx={{
              px: 1.5,
              py: 0.4,
              borderRadius: `${radius.pill}px`,
              bgcolor: palette.slate[100],
              fontSize: 13,
              fontWeight: 500,
              color: palette.slate[900],
            }}
          >
            Page:
          </Box>

          {/* First page button */}
          <Box
            onClick={() => setPage(0)}
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              bgcolor: palette.slate[100],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: palette.slate[700],
              cursor: "pointer",
              transition: "background-color 0.15s ease",
              "&:hover": { bgcolor: palette.slate[200] },
            }}
          >
            <ChevronFirst size={15} />
          </Box>

          {/* Page numbers */}
          {Array.from({ length: Math.min(3, Math.max(3, pageCount)) }, (_, pIdx) => {
            const pageNumStr = String(pIdx + 1).padStart(2, "0");
            const isActive = currentPage === pIdx;
            return (
              <Box
                key={pIdx}
                onClick={() => setPage(pIdx)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  bgcolor: isActive ? "#1E659E" : "transparent",
                  color: isActive ? "#FFFFFF" : palette.slate[700],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: isActive ? "#1E659E" : palette.slate[100],
                    color: isActive ? "#FFFFFF" : palette.slate[900],
                  },
                }}
              >
                {pageNumStr}
              </Box>
            );
          })}

          {/* Last page button */}
          <Box
            onClick={() => setPage(Math.max(0, pageCount - 1))}
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              bgcolor: palette.slate[100],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: palette.slate[700],
              cursor: "pointer",
              transition: "background-color 0.15s ease",
              "&:hover": { bgcolor: palette.slate[200] },
            }}
          >
            <ChevronLast size={15} />
          </Box>
        </Box>
      </Box>
    </BaseCard>
  );
}
