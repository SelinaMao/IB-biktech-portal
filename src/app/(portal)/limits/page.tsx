"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

import BaseButton from "@core/components/BaseButton";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import BaseTitle from "@core/components/BaseTitle";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { TransactionLimitsGrid, useGetMyLimitsQuery } from "@/features/transaction-limit";
import { useListUsersQuery, userStatusMeta, type AdminUser } from "@/features/user";

const USER_PAGE_SIZE = 200;

/**
 * Two different jobs behind one route.
 *
 * <p>Someone who can set limits is managing a team, so they get the team listed, and each user
 * is edited on their own page. Someone who cannot is only ever asking "what am I allowed to
 * move?", so they get their own figures directly rather than a list they cannot act on.
 */
export default function LimitsPage() {
  const canView = useCan(CLIENT_PERMISSIONS.TRANSACTION_LIMIT.VIEW);
  const canUpdate = useCan(CLIENT_PERMISSIONS.TRANSACTION_LIMIT.UPDATE);

  if (!canView) {
    return (
      <Alert severity="error">You do not have permission to view transaction limits.</Alert>
    );
  }

  return canUpdate ? <TeamLimits /> : <OwnLimits />;
}

/**
 * What this user may move. Read-only, and deliberately just the figures — where they came
 * from is a company-level question they cannot act on.
 */
function OwnLimits() {
  const { data, isLoading } = useGetMyLimitsQuery();

  return (
    <Stack spacing={3}>
      <Box>
        <BaseTitle>My Transaction Limits</BaseTitle>
        <Typography variant="body2" color="text.secondary">
          What you are allowed to move, and where each figure comes from.
        </Typography>
      </Box>

      <Alert severity="info">
        These are set for you by someone who manages limits at your company. Ask them if you need
        more.
      </Alert>

      <TransactionLimitsGrid limits={data} isLoading={isLoading} readOnly />
    </Stack>
  );
}

/** Everyone in the company. Picking someone opens their own page. */
function TeamLimits() {
  const router = useRouter();
  const { data, isLoading } = useListUsersQuery({ page: 0, size: USER_PAGE_SIZE });

  const users = useMemo(() => (data?.content ?? []).map((entry) => entry.user), [data]);
  const open = (userId: string) => router.push(`/limits/${userId}`);

  const columns: BaseTableColumn<AdminUser>[] = [
    {
      key: "user",
      header: "User",
      render: (user) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{user.fullName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user.username}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      render: (user) => (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
          {user.roles.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              —
            </Typography>
          ) : (
            user.roles.map((role) => (
              <Chip key={role.id} size="small" label={role.name} sx={{ height: 20, fontSize: 11 }} />
            ))
          )}
        </Stack>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => {
        const meta = userStatusMeta(user.status);
        return <Chip size="small" label={meta.label} color={meta.color} />;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 140,
      render: (user) => (
        <BaseButton title="Set limits" size="small" variant="text" onClick={() => open(user.id)} />
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <BaseTitle>Transaction Limits</BaseTitle>
        <Typography variant="body2" color="text.secondary">
          How you divide what your bank allows the company between your users.
        </Typography>
      </Box>

      <BaseTable
        columns={columns}
        rows={users}
        getRowKey={(user) => user.id}
        isLoading={isLoading}
        onRowClick={(user) => open(user.id)}
        emptyTitle="No users yet"
        emptyDescription="Once your company has users, their limits are set here."
        minWidth={720}
      />
    </Stack>
  );
}
