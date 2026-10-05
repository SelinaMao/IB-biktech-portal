"use client";

import { CardContent, Grid, Skeleton, Stack } from "@mui/material";

import BaseCard from "@core/components/BaseCard";

/** Loading placeholder for `AccountOverviewCard`/`TDAccountOverviewCard`,
 *  shown while `getAccountDetail` is in flight for the selected account. */
export default function AccountOverviewCardSkeleton() {
  return (
    <BaseCard sx={{ p: 6 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1.5,
            mb: 1,
          }}
        >
          <Skeleton variant="text" width={180} height={32} />
          <Skeleton variant="rounded" width={120} height={34} />
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
          <Skeleton variant="text" width={110} height={20} />
          <Skeleton variant="text" width={70} height={20} />
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 3, md: 4 }}
          sx={{ alignItems: "center" }}
        >
          <Skeleton variant="circular" width={120} height={120} sx={{ flexShrink: 0 }} />

          <Grid container spacing={2.5} sx={{ flex: 1, width: "100%" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} size={{ xs: 6, sm: 4 }}>
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="80%" height={24} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </CardContent>
    </BaseCard>
  );
}
