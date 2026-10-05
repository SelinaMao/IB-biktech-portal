"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { palette, radius } from "@/theme/palette";
import { SectionCard } from "@/features/dashboard";
import type { ApprovalTypeBreakdown } from "../approval.types";

export default function ApprovalTypeBreakdownCard({
  items,
  title = "Pending Transaction Type",
}: {
  items: ApprovalTypeBreakdown[];
  /** Override for screens that break down something other than transactions. */
  title?: string;
}) {
  return (
    <SectionCard title={title} showBorder={false}>
      {items.length === 0 ? (
        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
          Nothing pending right now.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => (
            <Stack
              key={item.label}
              direction="row"
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography sx={{ fontSize: 14, color: "text.primary" }}>
                {item.label}
              </Typography>
              <Box
                sx={{
                  minWidth: 28,
                  height: 22,
                  px: 1,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: palette.info[50],
                  color: palette.info[600],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {item.count}
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </SectionCard>
  );
}
