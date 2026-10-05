"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { palette } from "@/theme/palette";
import type { BaseTablePagination } from "@core/types/BaseTable.types";

export type BasePaginationProps = BaseTablePagination & {
  /** "detailed" (default) — "Showing X–Y of N" + numbered pages, for list/table screens.
   *  "compact" — right-aligned "‹ Previous  1  Next ›", for card-embedded lists. */
  variant?: "detailed" | "compact";
};

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
    return (
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "flex-end", gap: 3 }}
      >
        <Button
          variant="text"
          size="small"
          startIcon={<ChevronLeft size={16} />}
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          sx={{ color: "text.primary", "&.Mui-disabled": { backgroundColor: "transparent" } }}
        >
          Previous
        </Button>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{page + 1}</Typography>
        <Button
          variant="text"
          size="small"
          endIcon={<ChevronRight size={16} />}
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          sx={{ color: "text.primary", "&.Mui-disabled": { backgroundColor: "transparent" } }}
        >
          Next
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
