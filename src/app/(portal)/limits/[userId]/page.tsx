"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useParams, useRouter } from "next/navigation";

import BaseIconButton from "@core/components/BaseIconButton";
import BaseTitle from "@core/components/BaseTitle";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { UserLimitsPanel } from "@/features/transaction-limit";
import { useGetUserDetailQuery } from "@/features/user";

/** One user's limits, on their own page — the team list stays put behind the back arrow. */
export default function UserLimitsPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const canView = useCan(CLIENT_PERMISSIONS.TRANSACTION_LIMIT.VIEW);
  const canUpdate = useCan(CLIENT_PERMISSIONS.TRANSACTION_LIMIT.UPDATE);
  const canReset = useCan(CLIENT_PERMISSIONS.TRANSACTION_LIMIT.DELETE);

  const { data, isLoading, isError } = useGetUserDetailQuery(params.userId, { skip: !canView });
  const user = data?.user ?? null;

  if (!canView) {
    return <Alert severity="error">You do not have permission to view transaction limits.</Alert>;
  }

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={420} />
      </Stack>
    );
  }

  if (isError || !user) {
    return <Alert severity="warning">This user could not be found.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <BaseIconButton
          icon={<ArrowBackRoundedIcon fontSize="small" />}
          tooltip="Back to the team"
          aria-label="Back to the team"
          onClick={() => router.push("/limits")}
        />
        <Box>
          <BaseTitle>{user.fullName}</BaseTitle>
          <Typography variant="body2" color="text.secondary">
            {user.username}
          </Typography>
        </Box>
      </Stack>

      <UserLimitsPanel
        userId={user.id}
        userName={user.fullName}
        canUpdate={canUpdate}
        canReset={canReset}
      />
    </Stack>
  );
}
