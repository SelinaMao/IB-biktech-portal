"use client";

import { Box, Stack } from "@mui/material";
import {
  AccountBalanceRounded,
  CalendarMonthRounded,
  PaymentsRounded,
  SwapHorizRounded,
} from "@mui/icons-material";

import SectionCard from "./SectionCard";
import { toneMap } from "./StatCard";

const actions = [
  { label: "Transfer", icon: <SwapHorizRounded />, tone: "info" as const },
  { label: "Payment", icon: <PaymentsRounded />, tone: "success" as const },
  { label: "Schedule", icon: <CalendarMonthRounded />, tone: "info" as const },
  {
    label: "Account",
    icon: <AccountBalanceRounded />,
    tone: "purple" as const,
  },
];

export default function FrequentActionsCard() {
  return (
    <SectionCard title="Frequent Actions">
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: "space-between" }}
      >
        {actions.map((a) => {
          const c = toneMap[a.tone];
          return (
            <Stack
              key={a.label}
              spacing={1}
              sx={{ alignItems: "center", cursor: "pointer", flex: 1 }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  bgcolor: c.bg,
                  color: c.fg,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {a.icon}
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </SectionCard>
  );
}
