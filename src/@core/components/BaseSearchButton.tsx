"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";

import { palette } from "@/theme/palette";
import BaseIconButton from "./BaseIconButton";

export interface BaseSearchButtonProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tooltip?: string;
  /** Width of the expanded input. Default 240. */
  width?: number | string;
}

/**
 * Collapsed icon button that expands into a text input on click. Stays
 * expanded while it holds a query and collapses back on blur once cleared.
 */
export default function BaseSearchButton({
  value,
  onChange,
  placeholder = "Search…",
  tooltip = "Search",
  width = 240,
}: BaseSearchButtonProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    if (!value) setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Escape") return;
    onChange("");
    setOpen(false);
    inputRef.current?.blur();
  };

  if (!open) {
    return (
      <BaseIconButton
        icon={<SearchRoundedIcon fontSize="small" />}
        tooltip={tooltip}
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        sx={{
          width: 33,
          height: 33,
          borderRadius: "12px",
          border: `1px solid ${palette.slate[200]}`,
          "&:hover": { backgroundColor: palette.primary[100] },
        }}
      />
    );
  }

  return (
    <TextField
      inputRef={inputRef}
      size="small"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      sx={{
        width,
        "& .MuiOutlinedInput-root": { height: 33, borderRadius: "12px" },
        "& .MuiOutlinedInput-input": { paddingTop: 0, paddingBottom: 0 },
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" sx={{ color: palette.slate[400] }} />
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
