"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  AlertCircle,
  ArrowDown01,
  CirclePause,
  CirclePlay,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  RotateCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { font, palette, radius } from "@/theme/palette";
import BaseButton from "@core/components/BaseButton";
import BaseFilterByDay, {
  type BaseFilterByDayValue,
  isDateWithinFilter,
} from "@core/components/BaseFilterByDay";
import BaseSearchButton from "@core/components/BaseSearchButton";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import type { ScheduledTransaction } from "../schedule.types";

export interface ScheduleTransactionsTableProps {
  schedules: ScheduledTransaction[];
  isLoading?: boolean;
  isError?: boolean;
  onRefresh?: () => void;
  onAddSchedule?: () => void;
  onTogglePause?: (schedule: ScheduledTransaction) => void;
  onEditSchedule?: (schedule: ScheduledTransaction) => void;
  onDeleteSchedule?: (schedule: ScheduledTransaction) => void;
  onViewDetails?: (schedule: ScheduledTransaction) => void;
}

type SortField = "date" | "amount" | "type";
type SortDirection = "asc" | "desc";

const ROWS_PER_PAGE = 5;

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  Active: { bg: "#056A4E", fg: "#FFFFFF" },
  Paused: { bg: "#D97706", fg: "#FFFFFF" },
  "Awaiting Approval": { bg: "#2563EB", fg: "#FFFFFF" },
  Processing: { bg: "#7C3AED", fg: "#FFFFFF" },
  Completed: { bg: "#10B981", fg: "#FFFFFF" },
  Failed: { bg: "#DC2626", fg: "#FFFFFF" },
  Cancelled: { bg: "#64748B", fg: "#FFFFFF" },
};

/** Proportional column width distribution across screen sizes */
const COLUMN_WIDTHS = ["15%", "25%", "25%", "15%", "10%", "10%"] as const;

/** Shared header cell styling */
const HEAD_CELL_SX = {
  fontSize: 13,
  fontWeight: 500,
  color: palette.slate[500],
  py: 1.75,
} as const;

/** Shared body cell styling */
const BODY_CELL_SX = {
  py: 2.25,
} as const;

export default function ScheduleTransactionsTable({
  schedules,
  isLoading = false,
  isError = false,
  onRefresh,
  onAddSchedule,
  onTogglePause,
  onEditSchedule,
  onDeleteSchedule,
  onViewDetails,
}: ScheduleTransactionsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<BaseFilterByDayValue | null>(null);
  const [currentPage, setPage] = useState(0);
  const statusTab = "scheduled";

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // Row action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledTransaction | null>(null);

  // Filtered and sorted data
  const filteredRows = useMemo(() => {
    let result = [...schedules];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.transactionType.toLowerCase().includes(q) ||
          item.refNo.toLowerCase().includes(q) ||
          item.payToName.toLowerCase().includes(q) ||
          item.payToAccount.toLowerCase().includes(q) ||
          item.amount.toString().includes(q) ||
          item.date.toLowerCase().includes(q),
      );
    }

    if (dateFilter) {
      result = result.filter((item) => isDateWithinFilter(item.date, dateFilter));
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortField === "type") {
        comparison = a.transactionType.localeCompare(b.transactionType);
      } else {
        // Date compare
        const dateA = new Date(`${a.date} ${a.time}`).getTime() || 0;
        const dateB = new Date(`${b.date} ${b.time}`).getTime() || 0;
        comparison = dateA - dateB;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [schedules, search, dateFilter, sortField, sortDirection]);

  const handleOpenActionMenu = (
    event: React.MouseEvent<HTMLElement>,
    schedule: ScheduledTransaction,
  ) => {
    event.stopPropagation();
    setSelectedSchedule(schedule);
    setActionMenuAnchor(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setSelectedSchedule(null);
  };

  const handleSelectSort = (field: SortField, dir: SortDirection) => {
    setSortField(field);
    setSortDirection(dir);
    setSortMenuAnchor(null);
  };

  // Type-Safe columns with consistent width distribution & flexible headers
  const columns: BaseTableColumn<ScheduledTransaction>[] = [
    {
      key: "date",
      header: "Date",
      width: COLUMN_WIDTHS[0],
      headSx: { ...HEAD_CELL_SX, pl: 0 },
      cellSx: { ...BODY_CELL_SX, pl: 0 },
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 13.5,
              fontWeight: 500,
              color: "#0F172A",
              lineHeight: 1.3,
            }}
          >
            {t.date}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.3,
              mt: 0.4,
            }}
          >
            {t.time}
          </Typography>
        </Box>
      ),
    },
    {
      key: "transactionType",
      header: "Transaction type & reference",
      width: COLUMN_WIDTHS[1],
      headSx: HEAD_CELL_SX,
      cellSx: BODY_CELL_SX,
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              color: "#0F172A",
              lineHeight: 1.3,
            }}
          >
            {t.transactionType}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.3,
              mt: 0.4,
            }}
          >
            {t.refNo}
          </Typography>
        </Box>
      ),
    },
    {
      key: "payTo",
      header: "Pay to",
      width: COLUMN_WIDTHS[2],
      headSx: HEAD_CELL_SX,
      cellSx: BODY_CELL_SX,
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              color: "#0F172A",
              lineHeight: 1.3,
            }}
          >
            {t.payToName}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.3,
              mt: 0.4,
            }}
          >
            {t.payToAccount}
          </Typography>
        </Box>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      width: COLUMN_WIDTHS[3],
      headSx: HEAD_CELL_SX,
      cellSx: BODY_CELL_SX,
      render: (t) => (
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: font.weight.medium,
            color: "#0F172A",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {t.currency === "KHR"
            ? `KHR ${t.amount.toLocaleString("en-US")}`
            : `USD ${t.amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
        </Typography>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: COLUMN_WIDTHS[4],
      headSx: HEAD_CELL_SX,
      cellSx: BODY_CELL_SX,
      render: (t) => {
        const badgeStyle = STATUS_STYLES[t.status] || {
          bg: "#94A3B8",
          fg: "#FFFFFF",
        };
        return (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              py: 0.8,
              px: 3,
              borderRadius: "8px",
              bgcolor: badgeStyle.bg,
              color: badgeStyle.fg,
              fontSize: font.size.xs,
              fontWeight: font.weight.medium,
              lineHeight: 1.4,
              whiteSpace: "nowrap",
            }}
          >
            {t.status}
          </Box>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      width: COLUMN_WIDTHS[5],
      headSx: { ...HEAD_CELL_SX, pr: 0.5 },
      cellSx: { ...BODY_CELL_SX, pr: 0.5 },
      render: (t) => (
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifyContent: "flex-end" }}
        >
          {t.status === "Paused" ? (
            <Tooltip title="Resume schedule">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePause?.(t);
                }}
                sx={{
                  color: palette.slate[700],
                  p: 0.5,
                  "&:hover": { bgcolor: palette.slate[100] },
                }}
                aria-label="Resume schedule"
              >
                <CirclePlay size={18} strokeWidth={1} />
              </IconButton>
            </Tooltip>
          ) : (t.status === "Active" || t.status === "Awaiting Approval") ? (
            <Tooltip title="Pause schedule">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePause?.(t);
                }}
                sx={{
                  color: palette.slate[700],
                  p: 0.5,
                  "&:hover": { bgcolor: palette.slate[100] },
                }}
                aria-label="Pause schedule"
              >
                <CirclePause size={18} strokeWidth={1} />
              </IconButton>
            </Tooltip>
          ) : null}

          <IconButton
            size="small"
            onClick={(e) => handleOpenActionMenu(e, t)}
            sx={{
              color: palette.slate[700],
              p: 0.5,
              "&:hover": { bgcolor: palette.slate[100] },
            }}
            aria-label="More actions"
          >
            <MoreVertical size={18} strokeWidth={2} />
          </IconButton>
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
        width: "100%",
      }}
    >
      {/* 1. Header Bar: Title on left, + Schedule button on right */}
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 18, sm: 20 },
            fontWeight: 700,
            color: "#0F172A",
            lineHeight: 1.25,
          }}
        >
          Transactions
        </Typography>

        <BaseButton
          title="Schedule"
          startIcon={<Plus size={18} />}
          onClick={onAddSchedule}
          sx={{
            bgcolor: "#2764A5",
            color: "#ffffff",
            borderRadius: "10px",
            px: 2.75,
            py: 1,
            fontSize: 14,
            fontWeight: 500,
            textTransform: "none",
            "&:hover": {
              bgcolor: "#1E5289",
            },
          }}
        />
      </Stack>

      {/* 2. Filter Row: BaseSearchButton on left, BaseFilterByDay & Sort on right */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          marginTop: 6,
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          mb: 3,
          borderTop: "1px solid",
          borderTopColor: palette.secondary[100],
          pt: 6,
        }}
      >
        <BaseSearchButton
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          placeholder="Search"
          width={240}
          sx={{
            width: { xs: "100%", sm: 240 },
          }}
        />

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            alignSelf: { xs: "flex-end", sm: "center" },
          }}
        >
         

          {onRefresh && (
            <Tooltip title="Refresh">
              <span>
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  disabled={isLoading}
                  sx={{
                    borderRadius: "8px",
                    border: `1px solid ${palette.slate[200]}`,
                    color: palette.slate[700],
                    height: 40,
                    width: 40,
                    bgcolor: "#FFFFFF",
                    "&:hover": {
                      borderColor: palette.slate[300],
                      bgcolor: palette.slate[50],
                    },
                  }}
                  aria-label="Refresh schedules"
                >
                  <RotateCw
                    size={16}
                    style={{
                      animation: isLoading ? "spin 1s linear infinite" : "none",
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>
          )}

          <Button
            variant="outlined"
            onClick={(e) => setSortMenuAnchor(e.currentTarget)}
            endIcon={<ArrowDown01 size={16} />}
            sx={{
              borderRadius: "8px",
              borderColor: palette.slate[200],
              color: palette.slate[700],
              textTransform: "none",
              fontSize: 14,
              fontWeight: font.weight.regular,
              px: 3,
              py: 1,
              height: 40,
              bgcolor: "#FFFFFF",
              "&:hover": {
                borderColor: palette.slate[300],
                bgcolor: palette.slate[50],
              },
            }}
          >
            Sort
          </Button>
        </Stack>
      </Stack>

      {/* Error state alert */}
      {isError && (
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: "10px",
            bgcolor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AlertCircle size={18} color="#DC2626" />
            <Typography sx={{ fontSize: 13.5, color: "#991B1B" }}>
              Failed to load scheduled transfers from backend.
            </Typography>
          </Stack>
          {onRefresh && (
            <Button
              size="small"
              onClick={onRefresh}
              sx={{
                color: "#DC2626",
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
                "&:hover": { bgcolor: "#FEE2E2" },
              }}
            >
              Retry
            </Button>
          )}
        </Box>
      )}

      {/* 3. BaseTable using the requested configuration */}
      <BaseTable
        columns={columns}
        rows={filteredRows}
        getRowKey={(t) => t.id ?? ("ref" in t ? String(t.ref) : t.refNo)}
        isLoading={isLoading}
        onRowClick={onViewDetails}
        minWidth={640}
        rounded={false}
        headerBgColor={palette.white}
        headerBorderColor={palette.slate[200]}
        headerTextColor={palette.slate[500]}
        headerBorderTop={false}
        emptyTitle="No scheduled transactions"
        emptyDescription={
          isError
            ? "Could not retrieve data from server."
            : "There are currently no scheduled transfers."
        }
        getRowSx={() => ({
          "&:hover": {
            bgcolor: palette.slate[50],
            borderRadius: `${radius.md}px`,
          },
          "& td": { borderBottom: `1px solid ${palette.slate[50]}` },
        })}
        pagination={{
          count: filteredRows.length,
          page: currentPage,
          rowsPerPage: ROWS_PER_PAGE,
          onPageChange: setPage,
        }}
        paginationVariant="compact"
        // BaseTable spaces the pager 40px off the table; this card wants 16px.
        paginationSx={{ mt: -3 }}
      />

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            minWidth: 180,
            boxShadow: "0px 8px 24px rgba(15, 23, 42, 0.08)",
            border: `1px solid ${palette.slate[200]}`,
          },
        }}
      >
        <MenuItem
          selected={sortField === "date" && sortDirection === "desc"}
          onClick={() => handleSelectSort("date", "desc")}
        >
          Date: Newest first
        </MenuItem>
        <MenuItem
          selected={sortField === "date" && sortDirection === "asc"}
          onClick={() => handleSelectSort("date", "asc")}
        >
          Date: Oldest first
        </MenuItem>
        <MenuItem
          selected={sortField === "amount" && sortDirection === "desc"}
          onClick={() => handleSelectSort("amount", "desc")}
        >
          Amount: High to low
        </MenuItem>
        <MenuItem
          selected={sortField === "amount" && sortDirection === "asc"}
          onClick={() => handleSelectSort("amount", "asc")}
        >
          Amount: Low to high
        </MenuItem>
        <MenuItem
          selected={sortField === "type" && sortDirection === "asc"}
          onClick={() => handleSelectSort("type", "asc")}
        >
          Type: A to Z
        </MenuItem>
      </Menu>

      {/* Row Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            minWidth: 170,
            boxShadow: "0px 8px 24px rgba(15, 23, 42, 0.08)",
            border: `1px solid ${palette.slate[200]}`,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedSchedule) onViewDetails?.(selectedSchedule);
            handleCloseActionMenu();
          }}
        >
          <ListItemIcon>
            <Eye size={16} />
          </ListItemIcon>
          <ListItemText primary="View details" />
        </MenuItem>

        {selectedSchedule?.status === "Awaiting Approval" && (
          <MenuItem
            onClick={() => {
              router.push("/approval");
              handleCloseActionMenu();
            }}
          >
            <ListItemIcon>
              <ShieldCheck size={16} color="#2563EB" />
            </ListItemIcon>
            <ListItemText
              primary="Go to Approvals"
              primaryTypographyProps={{ sx: { color: "#2563EB", fontWeight: 500 } }}
            />
          </MenuItem>
        )}

        {selectedSchedule?.status !== "Cancelled" &&
          selectedSchedule?.status !== "Completed" &&
          selectedSchedule?.status !== "Awaiting Approval" && (
            <MenuItem
              onClick={() => {
                if (selectedSchedule) onEditSchedule?.(selectedSchedule);
                handleCloseActionMenu();
              }}
            >
              <ListItemIcon>
                <Pencil size={16} />
              </ListItemIcon>
              <ListItemText primary="Edit schedule" />
            </MenuItem>
          )}

        {(selectedSchedule?.status === "Active" ||
          selectedSchedule?.status === "Paused" ||
          selectedSchedule?.status === "Awaiting Approval") && (
          <MenuItem
            onClick={() => {
              if (selectedSchedule) onTogglePause?.(selectedSchedule);
              handleCloseActionMenu();
            }}
          >
            <ListItemIcon>
              {selectedSchedule?.status === "Paused" ? (
                <CirclePlay size={16} />
              ) : (
                <CirclePause size={16} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                selectedSchedule?.status === "Paused" ? "Resume schedule" : "Pause schedule"
              }
            />
          </MenuItem>
        )}

        {selectedSchedule?.status !== "Cancelled" && selectedSchedule?.status !== "Completed" && (
          <MenuItem
            onClick={() => {
              if (selectedSchedule) onDeleteSchedule?.(selectedSchedule);
              handleCloseActionMenu();
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon sx={{ color: "error.main" }}>
              <Trash2 size={16} />
            </ListItemIcon>
            <ListItemText primary="Cancel schedule" />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
