"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Box, Skeleton, Typography } from "@mui/material";
import {
  ArrowUpRight,
  ChevronRight,
  HandCoins,
  ScrollText,
  Settings,
} from "lucide-react";

import BaseButton from "@core/components/BaseButton";
import BaseCard from "@core/components/BaseCard";
import BaseIconBadge from "@core/components/BaseIconBadge";
import { font, palette } from "@/theme/palette";
import {
  useListInstancesQuery,
  useListMyTasksQuery,
  type InstanceStatus,
} from "@/features/workflow";

export type PendingRequestCategoryId =
  | "transfer"
  | "bill-payment"
  | "payroll"
  | "admin-setup";

export interface PendingRequestItem {
  id: PendingRequestCategoryId | string;
  title: string;
  count: number;
  icon: React.ReactNode;
  href: string;
}

export interface PendingRequestsCardProps {
  items?: PendingRequestItem[];
  totalBadge?: number;
  viewAllHref?: string;
  isLoading?: boolean;
}

interface RequestClassificationInput {
  functionCode?: string;
  functionName?: string;
  moduleCode?: string;
}

export interface CategoryDefinition {
  id: PendingRequestCategoryId;
  title: string;
  defaultCount: number;
  queryParam: string;
  icon: React.ReactNode;
}

export const CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = [
  {
    id: "transfer",
    title: "Transfer",
    defaultCount: 3,
    queryParam: "transfer",
    icon: <ArrowUpRight size={20} color={palette.slate[900]} />,
  },
  {
    id: "bill-payment",
    title: "Bill Payment",
    defaultCount: 2,
    queryParam: "bill",
    icon: <HandCoins size={20} color={palette.slate[900]} />,
  },
  {
    id: "payroll",
    title: "Payroll",
    defaultCount: 4,
    queryParam: "payroll",
    icon: <ScrollText size={20} color={palette.slate[900]} />,
  },
  {
    id: "admin-setup",
    title: "Admin Setup",
    defaultCount: 1,
    queryParam: "admin",
    icon: <Settings size={20} color={palette.slate[900]} />,
  },
] as const;

const DEFAULT_VIEW_ALL_HREF = "/approval-workflow/requests";
const OPEN_STATUSES: readonly InstanceStatus[] = ["PENDING", "IN_PROGRESS", "ESCALATED"];

export const defaultPendingRequests: PendingRequestItem[] = CATEGORY_DEFINITIONS.map(
  ({ id, title, defaultCount, icon }) => ({
    id,
    title,
    count: defaultCount,
    icon,
    href: DEFAULT_VIEW_ALL_HREF,
  }),
);

const containsAny = (source: string, substrings: readonly string[]): boolean =>
  substrings.some((sub) => source.includes(sub));

const startsWithAny = (source: string, prefixes: readonly string[]): boolean =>
  prefixes.some((prefix) => source.startsWith(prefix));

const PAYROLL_CODES = ["PAYROLL", "BULK", "SALARY"] as const;
const PAYROLL_NAMES = ["payroll", "salary", "bulk"] as const;

const BILL_CODES = ["BILL", "TOPUP", "PHONE_TOPUP", "UTILITY", "CHARITY"] as const;
const BILL_NAMES = ["bill", "top-up", "topup", "utility", "phone"] as const;

const TRANSFER_CODES = ["TRANSFER", "BAKONG", "OWN_ACCOUNT", "OTHER_SME"] as const;
const TRANSFER_NAMES = ["transfer", "bakong"] as const;

const ADMIN_CODE_PREFIXES = ["ORG", "USER", "ROLE", "LIMIT"] as const;
const ADMIN_CODE_KEYWORDS = ["APPROVER", "ENTITLEMENT", "RULE"] as const;
const ADMIN_MODULES = ["ORG", "ADMIN", "AUTH"] as const;
const ADMIN_NAMES = [
  "user",
  "role",
  "limit",
  "approver",
  "setup",
  "admin",
  "entitlement",
  "mandate",
] as const;

export function categorizePendingRequest(
  item: RequestClassificationInput,
): PendingRequestCategoryId {
  const code = (item.functionCode || "").toUpperCase();
  const name = (item.functionName || "").toLowerCase();
  const mod = (item.moduleCode || "").toUpperCase();

  // 1. Payroll / Bulk transfers
  if (
    containsAny(code, PAYROLL_CODES) ||
    mod.includes("PAYROLL") ||
    containsAny(name, PAYROLL_NAMES)
  ) {
    return "payroll";
  }

  // 2. Bill Payment / Top-up / Utilities
  if (
    containsAny(code, BILL_CODES) ||
    containsAny(name, BILL_NAMES)
  ) {
    return "bill-payment";
  }

  // 3. Fund transfers
  if (
    containsAny(code, TRANSFER_CODES) ||
    containsAny(name, TRANSFER_NAMES)
  ) {
    return "transfer";
  }

  // 4. Admin Setup (User management, limits, roles, approver groups)
  if (
    startsWithAny(code, ADMIN_CODE_PREFIXES) ||
    containsAny(code, ADMIN_CODE_KEYWORDS) ||
    containsAny(mod, ADMIN_MODULES) ||
    containsAny(name, ADMIN_NAMES)
  ) {
    return "admin-setup";
  }

  // Default fallback: if module or code is payment -> transfer, else admin setup
  if (mod.includes("PAYMENT") || code.startsWith("PAYMENT")) {
    return "transfer";
  }

  return "admin-setup";
}

// ----------------------------------------------------------------------
// Styles
// ----------------------------------------------------------------------

const headerSx = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  mb: 4,
} as const;

const titleSx = {
  fontSize: { xs: 18, sm: 20 },
  fontWeight: font.weight.bold,
  color: palette.slate[900],
  lineHeight: 1.2,
} as const;

const totalBadgeSx = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 24,
  height: 24,
  px: 0.8,
  borderRadius: "12px",
  bgcolor: palette.orange,
  color: palette.white,
  fontSize: 12,
  fontWeight: 700,
} as const;

const rowSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  py: 1.75,
  textDecoration: "none",
  color: "inherit",
  transition: "background-color 0.15s ease",
  px: 0.5,
  borderRadius: 1.5,
  "&:hover": {
    bgcolor: palette.slate[50],
  },
} as const;

const chevronSx = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  bgcolor: palette.slate[100],
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: palette.slate[700],
  flexShrink: 0,
  transition: "background-color 0.15s ease",
  "&:hover": {
    bgcolor: palette.slate[200],
  },
} as const;

const viewAllButtonSx = {
  py: 1.4,
  borderRadius: "9999px",
  bgcolor: palette.slate[100],
  color: palette.slate[900],
  fontSize: 15,
  fontWeight: 500,
  textDecoration: "none",
  mt: 0.5,
  "&:hover": {
    bgcolor: palette.slate[200],
  },
} as const;

// ----------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------

interface PendingRequestRowProps {
  item: PendingRequestItem;
  isLast: boolean;
  isLoading: boolean;
  fallbackHref: string;
}

function PendingRequestRow({
  item,
  isLast,
  isLoading,
  fallbackHref,
}: PendingRequestRowProps) {
  const requestCountLabel = `${item.count} ${item.count === 1 ? "request" : "requests"}`;

  return (
    <Box
      component={Link}
      href={item.href || fallbackHref}
      sx={[
        rowSx,
        !isLast && { borderBottom: `1px solid ${palette.slate[100]}` },
      ]}
    >
      {/* Left: Icon + Labels */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
        <BaseIconBadge
          direction="income"
          size={44}
          bgColor={palette.slate[100]}
          icon={item.icon}
        />

        <Box>
          <Typography
            sx={{
              fontSize: font.size.base,
              fontWeight: font.weight.regular,
              color: palette.slate[900],
              lineHeight: 1.25,
            }}
          >
            {item.title}
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width={65} height={18} sx={{ mt: 0.5 }} />
          ) : (
            <Typography
              sx={{
                fontSize: 13,
                color: palette.slate[450],
                lineHeight: 1.25,
                mt: 0.5,
              }}
            >
              {requestCountLabel}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Right: Chevron Circle */}
      <Box sx={chevronSx} aria-hidden="true">
        <ChevronRight size={18} />
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function PendingRequestsCard({
  items: propItems,
  totalBadge: propTotalBadge,
  viewAllHref = DEFAULT_VIEW_ALL_HREF,
  isLoading: propIsLoading,
}: PendingRequestsCardProps) {
  const hasPropItems = Boolean(propItems);

  // Query caller's pending tasks and company's open instances when items are not provided as props
  const {
    data: tasksData,
    isLoading: isTasksLoading,
  } = useListMyTasksQuery(
    { status: "PENDING", size: 100 },
    { refetchOnMountOrArgChange: true, skip: hasPropItems },
  );

  const {
    data: instancesData,
    isLoading: isInstancesLoading,
  } = useListInstancesQuery(
    { status: "PENDING", size: 100 },
    { refetchOnMountOrArgChange: true, skip: hasPropItems },
  );

  const isLoading =
    propIsLoading ??
    (!hasPropItems &&
      (isTasksLoading || isInstancesLoading) &&
      !tasksData &&
      !instancesData);

  const items = useMemo<PendingRequestItem[]>(() => {
    if (propItems) return propItems;

    const hasData = Boolean(tasksData || instancesData);
    if (!hasData) {
      return defaultPendingRequests;
    }

    const counts: Record<PendingRequestCategoryId, number> = {
      transfer: 0,
      "bill-payment": 0,
      payroll: 0,
      "admin-setup": 0,
    };

    const taskInstanceIds = new Set<string>();

    for (const task of tasksData?.content ?? []) {
      if (task.instanceId) {
        taskInstanceIds.add(task.instanceId);
      }
      counts[categorizePendingRequest(task)]++;
    }

    for (const inst of instancesData?.content ?? []) {
      if (OPEN_STATUSES.includes(inst.status) && !taskInstanceIds.has(inst.id)) {
        counts[categorizePendingRequest(inst)]++;
      }
    }

    return CATEGORY_DEFINITIONS.map(({ id, title, icon, queryParam }) => ({
      id,
      title,
      count: counts[id],
      icon,
      href: `${viewAllHref}?q=${queryParam}`,
    }));
  }, [propItems, tasksData, instancesData, viewAllHref]);

  const totalCount =
    propTotalBadge ?? items.reduce((sum, item) => sum + item.count, 0);

  return (
    <BaseCard>
      {/* Header */}
      <Box sx={headerSx}>
        <Typography sx={titleSx}>Pending Request</Typography>

        {isLoading ? (
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            sx={{ bgcolor: palette.slate[200] }}
          />
        ) : (
          <Box
            sx={totalBadgeSx}
            aria-label={`${totalCount} pending requests`}
          >
            {totalCount}
          </Box>
        )}
      </Box>

      {/* Request Items List */}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {items.map((item, index) => (
          <PendingRequestRow
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
            isLoading={Boolean(isLoading)}
            fallbackHref={viewAllHref}
          />
        ))}
      </Box>

      {/* Footer View All Button */}
      <BaseButton
        component={Link}
        href={viewAllHref}
        title="View all"
        fullWidth
        sx={viewAllButtonSx}
      />
    </BaseCard>
  );
}
