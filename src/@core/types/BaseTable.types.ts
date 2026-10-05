import type { SxProps, Theme } from "@mui/material/styles";

/** One column definition. `render` turns a row into its cell content. */
export type BaseTableColumn<T> = {
  /** Stable key (also the React key for the cell). */
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  /** Fixed/min width for the column. */
  width?: number | string;
  headSx?: SxProps<Theme>;
  cellSx?: SxProps<Theme>;
};

export type BaseTablePagination = {
  /** Total rows across all pages (server total). */
  count: number;
  /** Zero-based current page. */
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  rowsPerPageOptions?: number[];
  onRowsPerPageChange?: (rowsPerPage: number) => void;
};
