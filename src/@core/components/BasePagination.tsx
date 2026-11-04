"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { palette } from "@/theme/palette";
import type { BaseTablePagination } from "@core/types/BaseTable.types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MoreHoriz } from "@mui/icons-material";

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
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
          {/* Previous Button */}
          <Button
            variant="text"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            startIcon={<ChevronLeft fontSize="small" />}
            sx={{
              height: 40,
              px: 1.75,
              mr: 0.5,
              borderRadius: "10px",
              color: "#0F172A",
              fontSize: 15,
              fontWeight: 500,
              textTransform: "none",
              "&:hover": { bgcolor: "#EBEBEB" },
              "&.Mui-disabled": { bgcolor: "#Ffffff", color: "#94A3B8" },
            }}
          >
            Previous
          </Button>

          {/* Page Numbers (1, 2, 3) */}
          {pages.map((item) => {
            const isSelected = item === currentPage;
            return (
              <Button
                key={item}
                variant="text"
                onClick={() => onPageChange(item - 1)}
                sx={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  p: 0,
                  borderRadius: "10px",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#0F172A",
                  border: "1px solid",
                  borderColor: isSelected ? "#E2E8F0" : "transparent",
                  bgcolor: isSelected ? "#FFFFFF" : "transparent",
                  boxShadow: isSelected ? "0px 1px 2px rgba(15, 23, 42, 0.06)" : "none",
                  "&:hover": { bgcolor: isSelected ? "#FFFFFF" : "#F5F5F5" },
                }}
              >
                {item}
              </Button>
            );
          })}

          {/* "..." shown only when there are more pages than displayed */}
          {pages.length < pageCount && !pages.includes(pageCount) && (
            <>
              {/* Ellipsis */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0F172A",
                }}
              >
                <MoreHoriz fontSize="small" />
              </Box>

              {/* Last page */}
              <Button
                variant="text"
                onClick={() => onPageChange(pageCount - 1)}
                sx={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  p: 0,
                  borderRadius: "10px",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#0F172A",
                  border: "1px solid",
                  borderColor: currentPage === pageCount ? "#E2E8F0" : "transparent",
                  bgcolor: currentPage === pageCount ? "#FFFFFF" : "transparent",
                  boxShadow:
                    currentPage === pageCount ? "0px 1px 2px rgba(15, 23, 42, 0.06)" : "none",
                  "&:hover": { bgcolor: currentPage === pageCount ? "#FFFFFF" : "#F5F5F5" },
                }}
              >
                {pageCount}
              </Button>
            </>
          )}


          {/* Next Button */}
          <Button
            variant="text"
            disabled={page >= pageCount - 1}
            onClick={() => onPageChange(page + 1)}
            endIcon={<ChevronRight fontSize="small" />}
            sx={{
              height: 40,
              px: 1.75,
              ml: 0.5,
              borderRadius: "10px",
              color: "#0F172A",
              fontSize: 15,
              fontWeight: 500,
              textTransform: "none",
              "&:hover": { bgcolor: "#F5F5F5" },
              "&.Mui-disabled": { color: "#94A3B8", bgcolor: "#ffffff" },
            }}
          >
            Next
          </Button>
        </Stack>
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