"use client";

import { Box, Stack, Typography } from "@mui/material";

import { font, palette, radius } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import { scheduleTransfers } from "../dashboard.data";
import SectionCard from "./SectionCard";

export default function ScheduleCard() {
  return (
    <SectionCard title="Schedule" action="View All">
      <Stack
        sx={{
          width: "100%",
          height: "100%",
          bgcolor: palette.slate[50],
          borderRadius: `${radius.lg}px`,
          px: 2,
        }}
      >
        {scheduleTransfers.map((s, i) => {
          const [amountValue, amountCurrency] = s.amount.split(" ");

          return (
            <Stack
              key={s.label}
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                py: 2,
                borderBottom:
                  i < scheduleTransfers.length - 1
                    ? `1px solid ${palette.slate[200]}`
                    : "none",
              }}
            >
              <Box
                sx={{
                  textAlign: "center",
                  width: 48,
                  height: 48,
                  bgcolor: palette.white,
                  borderRadius: `${radius.sm}px`,
                  py: 0.75,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    lineHeight: 1,
                    fontSize: font.size.base,
                    fontWeight: font.weight.semibold,
                  }}
                >
                  {s.day}
                </Typography>
                <Typography variant="caption" sx={{ color: palette.slate[400] }}>
                  {s.month}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: font.weight.regular, fontSize: font.size.base }}>
                  {s.label}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 14 }}>
                <BaseBlurText>
                  <Box component="span" sx={{ fontWeight: font.weight.bold }}>
                    {amountValue}
                  </Box>{" "}
                  <Box
                    component="span"
                    sx={{ fontWeight: font.weight.regular, color: palette.slate[400], fontSize: font.size.base }}
                  >
                    {amountCurrency}
                  </Box>
                </BaseBlurText>
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </SectionCard>
  );
}
