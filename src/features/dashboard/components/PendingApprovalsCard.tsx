"use client";

import { Box, Stack, Typography } from "@mui/material";
import { ChevronRightRounded } from "@mui/icons-material";

import { palette } from "@/theme/palette";
import { pendingApprovals } from "../dashboard.data";
import SectionCard from "./SectionCard";

export default function PendingApprovalsCard() {
  return (
    <SectionCard title="Pending Approvals" action="View All">
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            textAlign: "center",
            pr: 2,
            borderRight: `1px solid ${palette.slate[200]}`,
          }}
        >
          <Typography variant="h2" sx={{ lineHeight: 1 }}>
            3
          </Typography>
          <Typography variant="body2">Pending</Typography>
        </Box>
        <Stack spacing={1.25} sx={{ flex: 1 }}>
          {pendingApprovals.map((a) => (
            <Stack
              key={a.label}
              direction="row"
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                  {a.label}
                </Typography>
                <Typography variant="body2">{a.amount}</Typography>
              </Box>
              <ChevronRightRounded sx={{ color: palette.slate[400] }} />
            </Stack>
          ))}
        </Stack>
      </Stack>
    </SectionCard>
  );
}
