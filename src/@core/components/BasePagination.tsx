"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { palette } from "@/theme/palette";
import type { BaseTablePagination } from "@core/types/BaseTable.types";

export type BasePaginationProps = BaseTablePagination & {
  /** "detailed" (default) — "Showing X–Y of N" + numbered pages, for list/table screens.
   *  "compact" — right-aligned "N Transactions  [Page:]  (|<)  01 02 03  (>|)", for card-embedded lists. */
  variant?: "detailed" | "compact";
};

const MAX_VISIBLE_PAGES = 3;

/**
 * Returns a sliding window of up to 3 page numbers (e.g. [1, 2, 3], then [2, 3, 4]).
 */
function getPageNumbers(current: number, total: number): number[] {
  if (total <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  // Keep the window anchored at 1..3 until current exceeds 3, then slide forward
  let start = Math.max(1, current - (MAX_VISIBLE_PAGES - 1));
  let end = start + MAX_VISIBLE_PAGES - 1;

  if (end > total) {
    end = total;
    start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Pager for list screens. Pages are 1-based in MUI but the BaseTablePagination
 * contract stays zero-based (converted here). Used by BaseTable and reusable
 * on its own.
 */
export default function BasePagination({
  count,
  page,
  rowsPerPage,
  onPageChange,
  variant = "detailed",
}: BasePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(count / rowsPerPage));

  if (variant === "compact") {
    const currentPage = page + 1;
    const pages = getPageNumbers(currentPage, pageCount);

    return (
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: { xs: "center", md: "flex-end" },
          flexWrap: "wrap",
          gap: { xs: 2.25, sm: 1.75, md: 2.5 },
          py: { xs: 0.2, md: 0.8 },
        }}
      >
        {/* Total Count Label */}
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 400,
            color: "#0F172A",
            mr: 0.5,
          }}
        >
          {count} {count === 1 ? "Transaction" : "Transactions"}
        </Typography>

        {/* "Page:" Pill */}
        <Box
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            bgcolor: "#ECEFF5",
            borderRadius: "9999px",
            px: { sm: 1.7, md: 2 },
            height: { sm: 28, md: 28 },
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 400,
              color: "#0F172A",
              lineHeight: 1,
            }}
          >
            Page:
          </Typography>
        </Box>

        {/* Previous Button */}
        <Button
          variant="text"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          sx={{
            width: 30,
            height: 30,
            minWidth: 30,
            p: 0,
            borderRadius: "50%",
            bgcolor: "#ECEFF5",
            color: "#0F172A",
            "&:hover": {
              bgcolor: "#DDE3EE",
            },
            "&.Mui-disabled": {
              bgcolor: "#ECEFF5",
              color: "#94A3B8",
              opacity: 0.6,
            },
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m17 18-6-6 6-6" />
            <path d="M7 6v12" />
          </svg>
        </Button>

        {/* Page Numbers (01, 02, 03) */}
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
          {pages.map((item) => {
            const isSelected = item === currentPage;
            return (
              <Button
                key={item}
                variant="text"
                onClick={() => onPageChange(item - 1)}
                sx={{
                  width: 30,
                  height: 30,
                  minWidth: 30,
                  p: 0,
                  borderRadius: "50%",
                  fontSize: 15,
                  fontWeight: isSelected ? 500 : 400,
                  bgcolor: isSelected ? palette.primary[40] : "transparent",
                  color: isSelected ? palette.white : "#0F172A",
                  "&:hover": {
                    bgcolor: isSelected ? palette.primary[40] : "#ECEFF5",
                  },
                }}
              >
                {String(item).padStart(2, "0")}
              </Button>
            );
          })}
        </Stack>

        {/* Next Button */}
        <Button
          variant="text"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          sx={{
             width: 30,
                  height: 30,
                  minWidth: 30,
            p: 0,
            borderRadius: "50%",
            bgcolor: "#ECEFF5",
            color: "#0F172A",
            "&:hover": {
              bgcolor: "#DDE3EE",
            },
            "&.Mui-disabled": {
              bgcolor: "#ECEFF5",
              color: "#94A3B8",
              opacity: 0.6,
            },
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m7 18 6-6-6-6" />
            <path d="M17 6v12" />
          </svg>
        </Button>
      </Stack>
    );
  }

  const start = count === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min((page + 1) * rowsPerPage, count);

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {count === 0 ? "No results" : `Showing ${start}–${end} of ${count}`}
      </Typography>

      {count > 0 && (
        <Pagination
          shape="rounded"
          count={pageCount}
          page={page + 1}
          onChange={(_e, next) => onPageChange(next - 1)}
          siblingCount={1}
          boundaryCount={1}
          sx={{
            "& .MuiPaginationItem-root.Mui-selected": {
              bgcolor: palette.navy[800],
              color: palette.white,
              fontWeight: 600,
              "&:hover": { bgcolor: palette.primary[800] },
            },
          }}
        />
      )}
    </Box>
  );
}