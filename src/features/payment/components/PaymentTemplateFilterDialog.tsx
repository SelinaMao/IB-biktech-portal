"use client";

import dayjs from "dayjs";
import BaseFilterDialog, {
  type BaseFilterDialogOption,
} from "@core/components/BaseFilterDialog";
import type { BaseFilterValue } from "@core/components/BaseFilter";

export interface PaymentTemplateFilterDialogProps {
  open: boolean;
  onClose: () => void;
  value?: BaseFilterValue;
  onApply: (value: BaseFilterValue) => void;
}

export default function PaymentTemplateFilterDialog({
  open,
  onClose,
  value,
  onApply,
}: PaymentTemplateFilterDialogProps) {
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
      title="Template Filter"
    />
  );
}
