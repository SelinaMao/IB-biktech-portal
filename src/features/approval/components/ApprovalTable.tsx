"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { ChevronRightRounded } from "@mui/icons-material";

import { palette } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseTable, {
  type BaseTableColumn,
  type BaseTablePagination,
} from "@core/components/BaseTable";
import { baseTableHeaderTextSx } from "@core/components/BaseTableHeader";
import { formatDate } from "@/utils/date-time";
import type { ApprovalEntry } from "../approval.types";
import ApprovalStatusChip from "./ApprovalStatusChip";

export type ApprovalTableProps = {
  entries: ApprovalEntry[];
  isLoading?: boolean;
  pagination?: BaseTablePagination;
  /** Style overrides for the pagination row's wrapper (e.g. extra gutter when nested in a zero-padding card). */
  paginationSx?: SxProps<Theme>;
  onRowClick?: (entry: ApprovalEntry) => void;
};

const formatAmount = (amount: number, currency: string) =>
  `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

export default function ApprovalTable({
  entries,
  isLoading = false,
  pagination,
  paginationSx,
  onRowClick,
}: ApprovalTableProps) {
  const columns: BaseTableColumn<ApprovalEntry>[] = [
    {
      key: "creationDate",
      header: "Creation Date",
      render: (entry) => (
        <Typography variant="body2">{formatDate(entry.creationDate, "DD MMM YYYY")}</Typography>
      ),
    },
    {
      key: "transactionType",
      header: "Transaction Type",
      render: (entry) => (
        <>
          <Typography variant="body2" sx={baseTableHeaderTextSx}>
            {entry.transactionType}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            Ref:{entry.refNo}
          </Typography>
        </>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (entry) => (
        <>
          <Typography variant="body2" sx={baseTableHeaderTextSx}>
            <BaseBlurText>{formatAmount(entry.amount, entry.currency)}</BaseBlurText>
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            Fee: {formatAmount(entry.fee, entry.currency)}
          </Typography>
        </>
      ),
    },
    {
      key: "payTo",
      header: "Pay To",
      render: (entry) => (
        <>
          <Typography variant="body2" sx={baseTableHeaderTextSx}>
            {entry.payToName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            Acc No: {entry.payToAccountNo}
          </Typography>
        </>
      ),
    },
    {
      key: "sourceAccount",
      header: "Source Account",
      render: (entry) => (
        <>
          <Typography variant="body2" sx={baseTableHeaderTextSx}>
            {entry.sourceAccountName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            Acc No: {entry.sourceAccountNo}
          </Typography>
        </>
      ),
    },
    {
      key: "pending",
      header: "Pending",
      render: (entry) => <Typography variant="body2">{entry.pendingOn}</Typography>,
    },
    {
      key: "status",
      header: "Transaction Status",
      align: "right",
      render: (entry) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
          <ApprovalStatusChip status={entry.status} />
          <ChevronRightRounded sx={{ color: palette.slate[400] }} />
        </Stack>
      ),
    },
  ];

  return (
    <BaseTable
      columns={columns}
      rows={entries}
      getRowKey={(entry) => entry.id}
      isLoading={isLoading}
      minWidth={880}
      emptyTitle="No approvals found"
      emptyDescription="There is nothing pending your review right now."
      pagination={pagination}
      paginationSx={paginationSx}
      onRowClick={onRowClick}
      rounded={false}
      headerBgColor={palette.white}
      headerBorderColor={palette.slate[200]}
      headerTextColor={palette.slate[400]}
      headerBorderTop={false}
    />
  );
}
