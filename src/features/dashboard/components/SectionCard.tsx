"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";

import { palette } from "@/theme/palette";
import BaseCard from "@core/components/BaseCard";
import BaseChip from "@core/components/BaseChip";

export default function SectionCard({
  title,
  action,
  header,
  beforeContent,
  children,
  showBorder = true,
  headerSx,
  titleSx,
  noPadding = false,
}: {
  title: string;
  action?: string;
  header?: React.ReactNode;
  /** Extra content rendered above the title row, inside the same card — e.g. a
   *  company/status summary that precedes the section's own header. */
  beforeContent?: React.ReactNode;
  children: React.ReactNode;
  showBorder?: boolean;
  headerSx?: object;
  titleSx?: object;
  noPadding?: boolean;
}) {
  return (
    <BaseCard
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...(noPadding && { p: 0 }),
      }}
    >
      {beforeContent}
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          pb: 2,
          flexShrink: 0,
          borderBottom: showBorder ? `1px solid ${palette.slate[200]}` : "none",
          ...(noPadding && { px: 3, pt: 3, mb: 0 }),
          ...headerSx,
        }}
      >
        <Typography variant="h4" sx={{ color: "text.primary", fontSize: 16, ...titleSx }}>{title}</Typography>
        <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
          {header}
          {action && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <BaseChip >{action}</BaseChip>
            </Box>
          )}
        </Stack>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, ...(noPadding && { pt: 3, px: 3, pb: 3 }) }}>{children}</Box>
    </BaseCard>
  );
}
