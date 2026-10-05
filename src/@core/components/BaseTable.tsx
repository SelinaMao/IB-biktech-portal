"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

import { palette, radius } from "@/theme/palette";
import BasePagination from "./BasePagination";
import BaseTableHeader from "./BaseTableHeader";
import type { BaseTableColumn, BaseTablePagination } from "@core/types/BaseTable.types";

export type { BaseTableColumn, BaseTablePagination } from "@core/types/BaseTable.types";

export type BaseTableProps<T> = {
  columns: BaseTableColumn<T>[];
  rows: T[];
  /** Stable row identity — used as the React key. A key that repeats (e.g. a
   *  reversal carrying its original's transaction id) gets a numbered suffix. */
  getRowKey: (row: T) => string;
  isLoading?: boolean;
  /** Skeleton rows shown while loading (default 5). */
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  minWidth?: number;
  onRowClick?: (row: T) => void;
  /** Omit for a table with no pager. */
  pagination?: BaseTablePagination;
  /** Style overrides for the pagination row's wrapper (e.g. extra gutter when nested in a zero-padding card). */
  paginationSx?: SxProps<Theme>;
  /** "detailed" (default) — "Showing X–Y of N" + numbered pages. "compact" — centered Previous/Next. */
  paginationVariant?: "detailed" | "compact";
  /** Header row styling overrides — default to the brand-tinted header. */
  headerBgColor?: string;
  headerBorderColor?: string;
  headerTextColor?: string;
  /** Show the header row's top border (default true). */
  headerBorderTop?: boolean;
  /**
   * Render as a self-contained rounded, bordered card (default). Set false
   * when nesting BaseTable inside a container that's already rounded (e.g.
   * SectionCard) so the table sits flat instead of double-rounding.
   */
  rounded?: boolean;
};

/**
 * Reusable data table — composes BaseTableHeader (thead) + a body (loading /
 * empty / rows) + BasePagination. Columns come as data; pages stay declarative.
 * Styling comes from theme tokens.
 */
export default function BaseTable<T>({
  columns,
  rows,
  getRowKey,
  isLoading = false,
  skeletonRows = 5,
  emptyTitle = "Nothing to show",
  emptyDescription,
  minWidth = 720,
  onRowClick,
  pagination,
  paginationSx,
  paginationVariant = "detailed",
  headerBgColor,
  headerBorderColor,
  headerTextColor,
  headerBorderTop = true,
  rounded = true,
}: BaseTableProps<T>) {
  const showEmpty = !isLoading && rows.length === 0;
  // React needs sibling keys to be unique, but a row key can legitimately repeat.
  const usedKeys = new Set<string>();
  const rowKeys = rows.map((row) => {
    const key = getRowKey(row);
    let unique = key;
    for (let n = 2; usedKeys.has(unique); n++) unique = `${key}#${n}`;
    usedKeys.add(unique);
    return unique;
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <Box
        sx={{
          ...(rounded && {
            border: `1px solid ${palette.slate[200]}`,
            borderRadius: `${radius.lg}px`,
          }),
          bgcolor: palette.white,
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth }}>
            <BaseTableHeader
              columns={columns}
              bgColor={headerBgColor}
              borderColor={headerBorderColor}
              textColor={headerTextColor}
              rounded={rounded}
              borderTop={headerBorderTop}
            />

            <TableBody>
              {isLoading &&
                Array.from({ length: skeletonRows }).map((_, r) => (
                  <TableRow key={`skeleton-${r}`}>
                    {columns.map((col, c) => (
                      <TableCell key={col.key} align={col.align ?? "left"}>
                        <Skeleton width={c === 0 ? "60%" : "40%"} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {showEmpty && (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                        {emptyTitle}
                      </Typography>
                      {emptyDescription && (
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          {emptyDescription}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                rows.map((row, index) => (
                  <TableRow
                    key={rowKeys[index]}
                    hover
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={{ cursor: onRowClick ? "pointer" : "default" }}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        align={col.align ?? "left"}
                        sx={{
                          // Right-aligned columns are the numeric ones; lining the
                          // digits up lets a reader compare down the column.
                          ...(col.align === "right" && {
                            fontVariantNumeric: "tabular-nums",
                          }),
                          ...col.cellSx,
                        }}
                      >
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {pagination && (
        <Box
          sx={{
            bgcolor: palette.white,
            ...paginationSx,
          }}
        >
          <BasePagination {...pagination} variant={paginationVariant} />
        </Box>
      )}
    </Box>
  );
}
