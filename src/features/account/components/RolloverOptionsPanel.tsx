"use client";

import { Box, Stack, Typography } from "@mui/material";
import { ChevronRight } from "lucide-react";

import { font, palette } from "@/theme/palette";
import BaseSideDialog from "@core/components/BaseSideDialog";
import { ROLLOVER_OPTIONS } from "../account.data";
import type { RolloverOption, RolloverOptionCode } from "../account.types";

export interface RolloverOptionsPanelProps {
  open: boolean;
  onClose: () => void;
  /** Code of the term deposit's current rollover option, if known — highlighted in the list. */
  currentCode?: RolloverOptionCode;
  onSelect: (option: RolloverOption) => void;
}

/** First step of the "Change Rollover Option" flow — lets the user pick which
 *  new rollover option they want, before moving on to the confirm-and-save dialog. */
export default function RolloverOptionsPanel({
  open,
  onClose,
  currentCode,
  onSelect,
}: RolloverOptionsPanelProps) {
  return (
    <BaseSideDialog open={open} onClose={onClose} title="Rollover Options" width={420}>
      <Stack spacing={1.5}>
        {ROLLOVER_OPTIONS.map((option) => {
          const isCurrent = option.code === currentCode;
          return (
            <Stack
              key={option.code}
              direction="row"
              role="button"
              tabIndex={0}
              onClick={() => onSelect(option)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(option);
              }}
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${palette.slate[200]}`,
                bgcolor: isCurrent ? palette.slate[100] : "transparent",
                cursor: "pointer",
                outline: "none",
                "&:hover": { bgcolor: palette.slate[100] },
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: font.weight.semibold, fontSize: font.size.base, color: "text.primary" }}>
                  {option.label}
                </Typography>
                <Typography sx={{ fontSize: font.size.xs, color: "text.secondary", mt: 0.25 }}>
                  {option.description}
                </Typography>
              </Box>
              <ChevronRight size={18} color={palette.slate[400]} style={{ flexShrink: 0 }} />
            </Stack>
          );
        })}
      </Stack>
    </BaseSideDialog>
  );
}
