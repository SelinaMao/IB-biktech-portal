"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { font, palette } from "@/theme/palette";

export type BaseStepProps = {
  steps: string[];
  /** 0-based index of the current step. */
  activeStep: number;
};

/** Row of progress-bar segments with labels — the New -> Review -> Transfer style stepper. */
export default function BaseStep({ steps, activeStep }: BaseStepProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
      {steps.map((label, i) => (
        <Stack
          key={label}
          spacing={1.5}
          sx={{
            flex: 1,
            minWidth: 0,
            alignItems:
              i === 0 ? "flex-start" : i === steps.length - 1 ? "flex-end" : "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: 4,
              borderRadius: "999px",
              bgcolor: i <= activeStep ? palette.info[950] : palette.slate[200],
              transition: "background-color 0.3s ease",
            }}
          />
          <Typography
            sx={{
              fontSize: font.size.md,
              fontWeight: i <= activeStep ? font.weight.bold : font.weight.regular,
              color: i <= activeStep ? palette.info[950] : palette.slate[950],
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
