"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export type BaseTermMaturityProps = {
  /** Days elapsed since placement (or current progress value). */
  totalMaturityDays: number;
  /** Total tenor in days (or max value). */
  totalDays: number;
  /** Header label above the segments. Defaults to "Term to Maturity". */
  label?: string;
  /** Total number of vertical pill segments to display. Defaults to 20. */
  segments?: number;
  /** Height of each vertical pill in px. */
  barHeight?: number;
  /** Width of each vertical pill in px (if false, pills flex to fill width). */
  barWidth?: number;
  /** Active/filled segment color. */
  activeColor?: string;
  /** Inactive/remaining segment color. */
  trackColor?: string;
};

export default function BaseTermMaturity({
  totalMaturityDays,
  totalDays,
  label = "Term to Maturity",
  segments = 20,
  barHeight = 36,
  barWidth = 10,
  activeColor = "#2589BD",
  trackColor = "#E2EBF3",
}: BaseTermMaturityProps) {
  const safeTotal = totalDays > 0 ? totalDays : 1;
  const ratio = Math.min(1, Math.max(0, totalMaturityDays / safeTotal));
  const filledCount = Math.round(ratio * segments);

  return (
    <Stack spacing={1.25}>
      {label && (
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 400,
            color: "#334155",
            lineHeight: 1.3,
          }}
        >
          {label}
        </Typography>
      )}

      <Stack
        direction="row"
        spacing={0.6}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalDays}
        aria-valuenow={totalMaturityDays}
        sx={{ alignItems: "center", width: "100%" }}
      >
        {Array.from({ length: segments }).map((_, index) => {
          const isFilled = index < filledCount;
          return (
            <Box
              key={index}
              sx={{
                width: barWidth,
                height: barHeight,
                borderRadius: "999px",
                bgcolor: isFilled ? activeColor : trackColor,
                transition: "background-color 0.25s ease",
                flexShrink: 0,
              }}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}