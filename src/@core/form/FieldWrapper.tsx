"use client";

import Box from "@mui/material/Box";
import FormLabel from "@mui/material/FormLabel";
import { font, palette } from "@/theme/palette";

export type LabelPosition = "top" | "left";

export type FieldWrapperProps = {
  label?: React.ReactNode;
  isRequired?: boolean;
  error?: boolean;
  /** "top" (default) stacks the label above; "left" puts it beside the field. */
  labelPosition?: LabelPosition;
  /** Label column width when labelPosition="left". */
  labelWidth?: number;
  /** Top-align the label (multiline fields) when labelPosition="left". */
  alignTop?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
};

/**
 * External label layout shared by all Base form fields — label is rendered
 * OUTSIDE the input (bank-form style), never as MUI's floating label.
 * One place to change form label layout for the whole app.
 */
export default function FieldWrapper({
  label,
  isRequired,
  error,
  labelPosition = "top",
  labelWidth = 180,
  alignTop = false,
  fullWidth = true,
  children,
}: FieldWrapperProps) {
  if (!label) return <>{children}</>;

  const left = labelPosition === "left";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: left ? "row" : "column",
        alignItems: left ? (alignTop ? "flex-start" : "center") : "stretch",
        gap: left ? 2 : 3,
        width: fullWidth ? "100%" : undefined,
      }}
    >
      <FormLabel
        required={isRequired}
        error={error}
        sx={{
          fontSize: font.size.base,
          fontWeight: font.weight.regular,
          flexShrink: 0,
          color: palette.slate[950],
          width: left ? labelWidth : undefined,
          pt: left && alignTop ? 1.25 : 0,
          "& .MuiFormLabel-asterisk": {
            color: palette.danger[500],
          },
        }}
      >
        {label}
      </FormLabel>
      <Box sx={{ flex: left ? 1 : undefined, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}
