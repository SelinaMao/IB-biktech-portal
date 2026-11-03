"use client";

import { useRef, type KeyboardEvent } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";
import { Search } from "lucide-react";

import { palette } from "@/theme/palette";

export interface BaseSearchButtonProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tooltip?: string;
  /** Width of the expanded input. Default 240. */
  width?: number | string;
  focusBorderColor?: string;
  sx?: SxProps<Theme>;
}

/**
 * Search input field matching portal design system.
 */
export default function BaseSearchButton({
  value,
  onChange,
  placeholder = "Search…",
  width = 240,
  focusBorderColor,
  sx,
}: BaseSearchButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Escape") return;
    onChange("");
    inputRef.current?.blur();
  };

  return (
    <TextField
      inputRef={inputRef}
      size="small"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      sx={{
        width,
        "& .MuiOutlinedInput-root": {
          height: 40,
          borderRadius: "10px",
          bgcolor: "#FFFFFF",
          fontSize: 13,
          "& fieldset": {
            borderColor: palette.slate[200],
            borderWidth: "1px",
            transition: "border-color 0.15s ease",
          },
          "&:hover fieldset": {
            borderColor: palette.slate[300],
          },
          "&.Mui-focused fieldset": {
            borderColor: focusBorderColor ?? palette.slate[300],
            borderWidth: "1px !important",
          },
        },
        "& .MuiOutlinedInput-input": { paddingTop: 0, paddingBottom: 0 },
        ...sx,
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search size={16} color="#94A3B8" />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => {
                  onChange("");
                  inputRef.current?.focus();
                }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
}
