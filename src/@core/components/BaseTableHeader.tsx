"use client";

import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { font, palette, radius } from "@/theme/palette";
import type { BaseTableColumn } from "@core/types/BaseTable.types";

/** Shared "emphasized" text style — used by the header cells here and reused wherever a table needs matching emphasis (e.g. a primary cell value). */
export const baseTableHeaderTextSx = {
  fontSize: font.size.md,
  fontWeight: font.weight.medium,
};

/**
 * Column header row (`<thead>`) for BaseTable — driven by the same column
 * config as the body. Brand-tinted header; the first/last cells round their
 * top corners so the tint follows the table's rounded card.
 */
export default function BaseTableHeader<T>({
  columns,
  bgColor = palette.primary[100],
  borderColor = palette.primary[200],
  textColor = palette.text.secondary,
  rounded = true,
  borderTop = true,
}: {
  columns: BaseTableColumn<T>[];
  /** Header row background — defaults to the brand tint. */
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  /** Round the header's top corners — off when BaseTable is nested inside an already-rounded card. */
  rounded?: boolean;
  /** Show the header row's top border — off for tables sitting flush under another element. */
  borderTop?: boolean;
}) {
  return (
    <TableHead>
      <TableRow
        sx={{
          "& th": {
            bgcolor: bgColor,
            borderBottom: `1px solid ${borderColor}`,
            ...(borderTop && { borderTop: `1px solid ${borderColor}` }),
          },
          ...(rounded && {
            "& th:first-of-type": { borderTopLeftRadius: `${radius.lg}px` },
            "& th:last-of-type": { borderTopRightRadius: `${radius.lg}px` },
          }),
        }}
      >
        {columns.map((col) => (
          <TableCell
            key={col.key}
            align={col.align ?? "left"}
            sx={{
              ...baseTableHeaderTextSx,
              color: textColor,
              whiteSpace: "nowrap",
              width: col.width,
              ...col.headSx,
            }}
          >
            {col.header}
          </TableCell>
     
        ))}
      </TableRow>
    </TableHead>
  );
}
