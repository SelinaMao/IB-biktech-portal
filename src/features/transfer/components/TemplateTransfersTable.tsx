"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronRightRounded } from "@mui/icons-material";
import { MoreVertical } from "lucide-react";

import { palette } from "@/theme/palette";
import { formatDate } from "@/utils/date-time";
import { formatAccountNumber } from "@/utils/format-account-number";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import { baseTableHeaderTextSx } from "@core/components/BaseTableHeader";
import type { TransferTemplate } from "../transfer.types";

const TRANSFER_TYPE_LABEL: Record<TransferTemplate["transferType"], string> = {
  OWN_ACCOUNT: "Own Account",
  OTHER_SME_ACCOUNT: "Other",
  BAKONG_LOCAL_BANK: "Local Bank",
  BAKONG_WALLET: "Bakong Account",
};

export type TemplateTransfersTableProps = {
  templates: TransferTemplate[];
  isLoading?: boolean;
  onView?: (template: TransferTemplate) => void;
  onEdit?: (template: TransferTemplate) => void;
  onDelete?: (template: TransferTemplate) => void;
};

function TemplateRowActions({
  template,
  onView,
  onEdit,
  onDelete,
}: {
  template: TransferTemplate;
  onView?: (template: TransferTemplate) => void;
  onEdit?: (template: TransferTemplate) => void;
  onDelete?: (template: TransferTemplate) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSelect = (action?: (template: TransferTemplate) => void) => {
    setAnchorEl(null);
    action?.(template);
  };

  return (
    <Stack
      direction="row"
      spacing={0.5}
      onClick={(e) => e.stopPropagation()}
      sx={{ alignItems: "center", justifyContent: "flex-end" }}
    >
      <IconButton
        size="small"
        aria-label={`Actions for ${template.templateName}`}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          width: 30,
          height: 30,
          borderRadius: "4px",
          bgcolor: Boolean(anchorEl) ? palette.info[100] : "transparent",
        }}
      >
        <MoreVertical size={30} color={palette.navy[800]} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 0.5,
              minWidth: 140,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 6px 16px rgba(16,24,40,0.08)",
            },
          },
        }}
      >
        <MenuItem onClick={() => handleSelect(onView)}>View</MenuItem>
        <MenuItem onClick={() => handleSelect(onEdit)}>Edit</MenuItem>
        <MenuItem
          onClick={() => handleSelect(onDelete)}
          sx={{ color: palette.danger.main }}
        >
          Delete
        </MenuItem>
      </Menu>

      <ChevronRightRounded sx={{ color: palette.slate[400] }} />
    </Stack>
  );
}

/**
 * Saved transfer templates list — thin column config over the shared
 * BaseTable, matching the RolesTable/ApprovalTable convention.
 */
export default function TemplateTransfersTable({
  templates,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
}: TemplateTransfersTableProps) {
  const columns: BaseTableColumn<TransferTemplate>[] = [
    {
      key: "templateName",
      header: "Template Name",
      render: (template) => (
        <Typography variant="body2" sx={baseTableHeaderTextSx}>
          {template.templateName}
        </Typography>
      ),
    },
    {
      key: "toAccount",
      header: "To Account",
      render: (template) => (
        <>
          <Typography variant="body2" sx={baseTableHeaderTextSx}>
            {template.toAccountName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            {formatAccountNumber(template.toAccountNumber)}
          </Typography>
        </>
      ),
    },
    {
      key: "transferType",
      header: "Transfer Type",
      render: (template) => (
        <Typography variant="body2">{TRANSFER_TYPE_LABEL[template.transferType]}</Typography>
      ),
    },
    {
      key: "createdAt",
      header: "Date Created",
      render: (template) => (
        <Typography variant="body2">
          {formatDate(template.createdAt, "DD MMM YYYY")}
        </Typography>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (template) => (
        <TemplateRowActions
          template={template}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
    },
  ];

  return (
    <BaseTable
      columns={columns}
      rows={templates}
      getRowKey={(template) => template.id}
      isLoading={isLoading}
      minWidth={720}
      emptyTitle="No template transfers"
      emptyDescription="Saved transfer templates will appear here."
      headerBgColor={palette.slate[50]}
      headerBorderColor={palette.slate[200]}
      headerTextColor={palette.slate[400]}
      headerBorderTop={false}
    />
  );
}
