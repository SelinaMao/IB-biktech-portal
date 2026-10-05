"use client";

import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Control, Path } from "react-hook-form";

import { ControlledBaseInput } from "@core/form";
import { font, palette, radius } from "@/theme/palette";
import type { LimitParamsValues, UserInfoValues } from "../schema/user.schema";
import { LIMIT_CATEGORIES } from "../user.types";

export type LimitParametersSectionProps = {
  control: Control<UserInfoValues>;
  isSubmitting: boolean;
  disabled?: boolean;
};

const AMOUNT_FIELDS: { key: keyof LimitParamsValues; label: string; unit: "KHR" | "USD" }[] = [
  { key: "minAmountKHR", label: "Min. Amount", unit: "KHR" },
  { key: "minAmountUSD", label: "Min. Amount", unit: "USD" },
  { key: "dailyLimitUSD", label: "Daily Limit", unit: "USD" },
  { key: "maxAmountKHR", label: "Max. Amount", unit: "KHR" },
  { key: "maxAmountUSD", label: "Max. Amount", unit: "USD" },
  { key: "perTransactionLimitUSD", label: "Per Transaction Limit", unit: "USD" },
];

/**
 * Collapsible "Limit Parameters Configuration" block on the Create/Edit User
 * wizard — per-category (see LIMIT_CATEGORIES) min/max/daily/per-transaction
 * amount limits in KHR + USD. UI-only, same status as ACCESS_LEVEL_OPTIONS.
 */
export default function LimitParametersSection({ control, isSubmitting, disabled }: LimitParametersSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Box>
      <Stack
        direction="row"
        onClick={() => setExpanded((prev) => !prev)}
        sx={{ alignItems: "center", justifyContent: "space-between", cursor: "pointer", py: 1 }}
      >
        <Typography sx={{ fontSize: font.size.md, fontWeight: font.weight.medium }}>
          Limit Parameters Configuration
        </Typography>
        <ChevronDown
          size={18}
          color={palette.slate[400]}
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}
        />
      </Stack>

      <Collapse in={expanded}>
        <Stack spacing={4} sx={{ pt: 2 }}>
          {LIMIT_CATEGORIES.map(({ key: categoryKey, label: categoryLabel }) => (
            <Box
              key={categoryKey}
              sx={{
                p: 6,
                borderRadius: `${radius.lg}px`,
                bgcolor: palette.slate[50],
                border: `1px solid ${palette.slate[200]}`,
              }}
            >
              <Typography sx={{ fontSize: font.size.base, fontWeight: font.weight.semibold, mb: 6, color: palette.slate[950] }}>
                {categoryLabel}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 6,
                }}
              >
                {AMOUNT_FIELDS.map((field) => (
                  <ControlledBaseInput
                    key={field.key}
                    name={`limitParameters.${categoryKey}.${field.key}` as Path<UserInfoValues>}
                    control={control}
                    label={
                      <Box
                        component="span"
                        title={field.label}
                        sx={{
                          display: "inline-block",
                          maxWidth: "calc(100% - 14px)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          verticalAlign: "bottom",
                        }}
                      >
                        {field.label}
                      </Box>
                    }
                    type="number"
                    disabled={isSubmitting || disabled}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end">{field.unit}</InputAdornment>,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}
