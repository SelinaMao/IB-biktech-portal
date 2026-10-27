"use client";

import Link from "next/link";
import { Box, Stack, Typography } from "@mui/material";
import { ChevronRight } from "lucide-react";

import { palette, radius } from "@/theme/palette";
import BaseCard from "@core/components/BaseCard";
import type { TransferOption } from "../transfer.types";

export default function TransferOptionCard({
  option,
  onClick,
}: {
  option: TransferOption;
  /** When provided, the card opens an inline view via this instead of navigating. */
  onClick?: () => void;
}) {
  const asButton = Boolean(onClick);

  return (
    <BaseCard
      component={asButton ? "button" : Link}
      type={asButton ? "button" : undefined}
      href={asButton ? undefined : `/transfer/${option.slug}`}
      onClick={asButton ? onClick : undefined}
      sx={{
        display: "block",
        width: "100%",
        border: `1px solid ${palette.slate[200]}`,
        borderRadius: `${radius.lg}px`,
        font: "inherit",
        textDecoration: "none",
        textAlign: "left",
        cursor: "pointer",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": { boxShadow: 2},
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
       
        <Box sx={{ flex: 1, minWidth: 0 }}>
           <Box
          sx={{
            width: 40,
            height: 40,
            border:0,
            bgcolor:palette.hover[10],
            borderRadius:"50%",
            flexShrink: 0,
            color: palette.primary[600],
            display: "grid",
            placeItems: "center",
          }}
        >
          {option.icon}
        </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", marginTop:4}}>
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: "text.primary" }}>
              {option.label}
            </Typography>
            {/* <ChevronRight size={18} color={palette.slate[400]} style={{ flexShrink: 0 ,marginTop:4}} /> */}
          </Stack>
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 0.25, color: palette.slate[400],marginTop:4 }}
          >
            {option.description}
          </Typography>
        </Box>
      </Stack>
    </BaseCard>
  );
}
