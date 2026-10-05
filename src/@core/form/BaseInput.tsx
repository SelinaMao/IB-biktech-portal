"use client";

import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldOwnerState, type TextFieldProps } from "@mui/material/TextField";
import FieldWrapper, { type LabelPosition } from "./FieldWrapper";
import { font, palette, radius } from "@/theme/palette";

export type BaseInputProps = Omit<TextFieldProps, "label" | "prefix"> & {
  isRequired?: boolean;
  /** External label rendered OUTSIDE the input (not MUI's floating label). */
  label?: React.ReactNode;
  /** "top" (default) stacks the label above; "left" puts it beside. */
  labelPosition?: LabelPosition;
  /** Label column width when labelPosition="left". */
  labelWidth?: number;
  /**
   * Fixed text shown before the value — a dial code, a currency. It is not
   * part of `value`; the caller joins it on when it submits.
   */
  prefix?: React.ReactNode;
};

/**
 * Dumb TextField wrapper — visual defaults only, no form logic. Use
 * `ControlledBaseInput` inside react-hook-form forms.
 */
export default function BaseInput({
  isRequired,
  label,
  labelPosition,
  labelWidth,
  prefix,
  slotProps,
  fullWidth = true,
  size = "medium",
  ...rest
}: BaseInputProps) {
  return (
    <FieldWrapper
      label={label}
      isRequired={isRequired}
      error={rest.error}
      labelPosition={labelPosition}
      labelWidth={labelWidth}
      alignTop={Boolean(rest.multiline)}
      fullWidth={fullWidth}
    >
      <TextField
        {...rest}
        slotProps={
          prefix == null
            ? slotProps
            : withStartAdornment(slotProps, <PrefixChip disabled={rest.disabled}>{prefix}</PrefixChip>)
        }
        fullWidth={fullWidth}
        size={size}
        autoComplete="off"
      />
    </FieldWrapper>
  );
}

/**
 * The prefix wears a filled chip so it reads as fixed furniture rather than
 * as a value already typed. It is inset from the border instead of running
 * flush to it: a full-height block would square off the rounded corner.
 */
function PrefixChip({ disabled, children }: { disabled?: boolean; children: React.ReactNode }) {
  return (
    // Pointer events pass through to the input root, so clicking the chip
    // focuses the field like clicking anywhere else in it. The root pads 14px
    // on this side; -6px leaves the chip as far from the border as from the
    // top and bottom. No right margin: the input keeps its own 14px left
    // padding (theme), so the value starts as far from the chip as a plain
    // field's does from its border.
    <InputAdornment position="start" disablePointerEvents sx={{ ml: -1.5, mr: 0 }}>
      <Box
        component="span"
        sx={{
          display: "flex",
          alignItems: "center",
          height: 28,
          px: 2.5,
          borderRadius: `${radius.sm}px`,
          fontSize: font.size.md,
          fontWeight: font.weight.medium,
          userSelect: "none",
          // A disabled field is filled in slate[50], which the resting chip
          // nearly matches, so the chip steps one shade darker there.
          bgcolor: disabled ? palette.slate[200] : palette.slate[100],
          color: disabled ? palette.slate[400] : palette.text.secondary,
        }}
      >
        {children}
      </Box>
    </InputAdornment>
  );
}

/** Adds `adornment` after any start adornment the caller already gave the input slot. */
function withStartAdornment(
  slotProps: BaseInputProps["slotProps"],
  adornment: React.ReactNode,
): BaseInputProps["slotProps"] {
  const input = slotProps?.input;
  const append = (props?: { startAdornment?: React.ReactNode }) => ({
    ...props,
    startAdornment: (
      <>
        {props?.startAdornment}
        {adornment}
      </>
    ),
  });
  return {
    ...slotProps,
    input:
      typeof input === "function"
        ? (ownerState: TextFieldOwnerState) => append(input(ownerState))
        : append(input),
  };
}
