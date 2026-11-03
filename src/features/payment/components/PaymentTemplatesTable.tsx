"use client";

import { useMemo, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ChevronsUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { font, palette, radius } from "@/theme/palette";
import BaseButton from "@core/components/BaseButton";
import BaseSearchByDay, {
  type BaseFilterByDayValue,
} from "@core/components/BaseSearchByDay";
import { isDateWithinFilter } from "@core/components/BaseFilterByDay";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import type { PaymentTemplate } from "../payment.types";

export interface PaymentTemplatesTableProps {
  templates: PaymentTemplate[];
  onAddTemplate?: () => void;
  onEditTemplate?: (template: PaymentTemplate) => void;
  onDeleteTemplate?: (template: PaymentTemplate) => void;
  onSelectTemplate?: (template: PaymentTemplate) => void;
}

const ROWS_PER_PAGE = 10;

/** Proportional column width distribution across screen sizes */
const COLUMN_WIDTHS = ["24%", "16%", "22%", "16%", "14%", "8%"] as const;

/** Shared header cell styling */
const HEAD_CELL_SX = {
  bgcolor: "transparent",
  py: 1.75,
  px: 2,
  fontSize: 13,
  fontWeight: 500,
  color: palette.slate[500],
  borderBottom: "none",
} as const;

/** Shared body cell styling */
const BODY_CELL_SX = {
  py: 2,
  px: 2,
  borderBottom: "none",
} as const;

export default function PaymentTemplatesTable({
  templates,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onSelectTemplate,
}: PaymentTemplatesTableProps) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<BaseFilterByDayValue | null>(null);
  const [page, setPage] = useState(0);

  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (tpl) =>
          tpl.name.toLowerCase().includes(q) ||
          tpl.type.toLowerCase().includes(q) ||
          tpl.providerName.toLowerCase().includes(q) ||
          tpl.correspondentId.toLowerCase().includes(q),
      );
    }
    if (dateFilter) {
      result = result.filter((tpl) => isDateWithinFilter(tpl.createdAt, dateFilter));
    }
    return result;
  }, [templates, search, dateFilter]);

  const totalCount = filteredTemplates.length;

  // Type-Safe columns with consistent width distribution & flexible headers
  const columns: BaseTableColumn<PaymentTemplate>[] = [
    {
      key: "name",
      header: (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <span>Template name</span>
          <ChevronsUpDown size={14} color={palette.slate[400]} />
        </Stack>
      ),
      width: COLUMN_WIDTHS[0],
      headSx: { ...HEAD_CELL_SX, pl: 2.5 },
      cellSx: {
        ...BODY_CELL_SX,
        pl: 2.5,
        fontSize: 14,
        fontWeight: 600,
        color: palette.slate[900],
      },
      render: (t) => t.name,
    },
    {
      key: "type",
      header: (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <span>Type</span>
          <ChevronsUpDown size={14} color={palette.slate[400]} />
        </Stack>
      ),
      width: COLUMN_WIDTHS[1],
      headSx: HEAD_CELL_SX,
      cellSx: {
        ...BODY_CELL_SX,
        fontSize: 14,
        color: palette.slate[700],
      },
      render: (t) => t.type,
    },
    {
      key: "provider",
      header: (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <span>Service provider</span>
          <ChevronsUpDown size={14} color={palette.slate[400]} />
        </Stack>
      ),
      width: COLUMN_WIDTHS[2],
      headSx: HEAD_CELL_SX,
      cellSx: BODY_CELL_SX,
      render: (t) => (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar
            sx={{
              width: 30,
              height: 30,
              bgcolor: "#EDF2F7",
              color: palette.slate[900],
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {t.providerInitials}
          </Avatar>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              color: palette.slate[900],
            }}
          >
            {t.providerName}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "correspondentId",
      header: "Correspondent ID",
      width: COLUMN_WIDTHS[3],
      headSx: HEAD_CELL_SX,
      cellSx: {
        ...BODY_CELL_SX,
        fontSize: 14,
        color: palette.slate[700],
      },
      render: (t) => t.correspondentId,
    },
    {
      key: "createdAt",
      header: (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <span>Created date</span>
          <ChevronsUpDown size={14} color={palette.slate[400]} />
        </Stack>
      ),
      width: COLUMN_WIDTHS[4],
      headSx: HEAD_CELL_SX,
      cellSx: {
        ...BODY_CELL_SX,
        fontSize: 14,
        color: palette.slate[700],
      },
      render: (t) => t.createdAt,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: COLUMN_WIDTHS[5],
      headSx: { ...HEAD_CELL_SX, pr: 0.5, pl: 2 },
      cellSx: { ...BODY_CELL_SX, pr: 0.5, pl: 2 },
      render: (t) => (
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "flex-end", alignItems: "center", pr: 2, gap: 2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="Edit template">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEditTemplate?.(t);
              }}
              sx={{
                color: palette.slate[700],
                p: 0.5,
                "&:hover": {
                  color: palette.slate[900],
                  bgcolor: palette.slate[100],
                },
              }}
            >
              <Pencil size={17} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete template">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTemplate?.(t);
              }}
              sx={{
                color: "#EF4444",
                p: 0.5,
                "&:hover": {
                  bgcolor: "rgba(239, 68, 68, 0.08)",
                },
              }}
            >
              <Trash2 size={17} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        border: `1px solid ${palette.slate[200]}`,
        borderRadius: "16px",
        p: { xs: 2.5, sm: "20px 24px" },
        boxShadow: "none",
      }}
    >
      {/* Header bar: Title & Subtitle on left, + Template on right */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 18,
              color: palette.slate[900],
              lineHeight: 1.25,
            }}
          >
            Payment templates
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: palette.slate[500],
              mt: 0.5,
            }}
          >
            Click a template to pay with its saved details.
          </Typography>
        </Box>

        <BaseButton
          title="Template"
          startIcon={<Plus size={18} />}
          onClick={onAddTemplate}
          sx={{
            bgcolor: "#2764A5",
            color: "#ffffff",
            borderRadius: "10px",
            px: 3.5,
            py: 1.5,
            fontSize: 14,
            fontWeight: font.weight.regular,
            textTransform: "none",
            "&:hover": {
              bgcolor: "#1E5289",
            },
          }}
        />
      </Stack>

      {/* Filter Row: BaseSearchByDay */}
      <Box
        sx={{
          mb: 3,
          mt: 6,
          borderTop: "1px solid",
          pt: 6,
          borderTopColor: palette.secondary[100],
        }}
      >
        <BaseSearchByDay
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          dateFilter={dateFilter}
          onDateFilterChange={(filter) => {
            setDateFilter(filter);
            setPage(0);
          }}
        />
      </Box>

      {/* BaseTable (Open, flat modern style without nested box border) */}
      <BaseTable
        columns={columns}
        rows={filteredTemplates}
        getRowKey={(t) => t.id}
        minWidth={720}
        rounded={false}
        headerBgColor="transparent"
        headerBorderColor={palette.slate[200]}
        headerTextColor={palette.slate[500]}
        headerBorderTop={false}
        emptyTitle="No payment templates found."
        onRowClick={onSelectTemplate}
        getRowSx={() => ({
          cursor: "pointer",
          transition: "background-color 0.15s ease",
          "&:hover": {
            bgcolor: palette.slate[50],
            borderRadius: `${radius.md}px`,
          },
          "& td": { borderBottom: "none" },
        })}
        pagination={
          totalCount > ROWS_PER_PAGE
            ? {
                count: totalCount,
                page,
                rowsPerPage: ROWS_PER_PAGE,
                onPageChange: setPage,
              }
            : undefined
        }
        paginationVariant="detailed"
        paginationSx={{ mt: 3 }}
      />
    </Box>
  );
}
