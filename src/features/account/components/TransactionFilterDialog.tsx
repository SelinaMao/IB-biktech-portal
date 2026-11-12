"use client";

import dayjs from "dayjs";
import { Eye } from "lucide-react";
import BaseFilterDialog, {
  type BaseFilterDialogOption,
} from "@core/components/BaseFilterDialog";
import type { BaseFilterValue } from "@core/components/BaseFilter";

export interface TransactionFilterDialogProps {
  open: boolean;
  onClose: () => void;
  value?: BaseFilterValue;
  onApply: (value: BaseFilterValue) => void;
}

export default function TransactionFilterDialog({
  open,
  onClose,
  value,
  onApply,
}: TransactionFilterDialogProps) {
  const today = dayjs();

  const options: BaseFilterDialogOption[] = [
    {
      id: "thisMonth",
      label: "This month",
      filterType: "thisMonth",
      getDateRange: () => ({
        from: today.startOf("month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
    {
      id: "last1Month",
      label: "Last 1 month",
      filterType: "last1Month",
      getDateRange: () => ({
        from: today.subtract(1, "month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
    {
      id: "last2Months",
      label: "Last 2 months",
      filterType: "last2Months",
      getDateRange: () => ({
        from: today.subtract(2, "month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
    {
      id: "last3Months",
      label: "Last 3 months",
      filterType: "last3Months",
      getDateRange: () => ({
        from: today.subtract(3, "month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
    {
      id: "last6Months",
      label: "Last 6 months",
      filterType: "last6Months",
      getDateRange: () => ({
        from: today.subtract(6, "month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
    {
      id: "last12Months",
      label: "Last 12 months",
      filterType: "customDate",
      getDateRange: () => ({
        from: today.subtract(12, "month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
  ];

  return (
    <BaseFilterDialog
      open={open}
      onClose={onClose}
      value={value}
      onApply={onApply}
      options={options}
      customOptionPosition="start"
      defaultOptionId="last1Month"
      title="Filter"
      subtitle="Transaction Filter"
      applyLabel="View Transaction"
      applyIcon={<Eye size={16} />}
    />
  );
}
