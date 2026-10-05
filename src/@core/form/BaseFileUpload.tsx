"use client";

import { useId, useRef, useState } from "react";
import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { font, palette, radius } from "@/theme/palette";
import FieldWrapper, { type LabelPosition } from "./FieldWrapper";

export type BaseFileUploadProps = {
  /** Controlled value — the selected files. */
  value?: File[];
  onChange?: (files: File[]) => void;
  label?: React.ReactNode;
  isRequired?: boolean;
  labelPosition?: LabelPosition;
  labelWidth?: number;
  /** e.g. "image/*,.pdf" */
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Dumb drop-zone file picker (click or drag & drop) — no upload logic; the
 * caller submits the File objects. Use `ControlledBaseFileUpload` inside
 * react-hook-form forms.
 */
export default function BaseFileUpload({
  value = [],
  onChange,
  label,
  isRequired,
  labelPosition,
  labelWidth,
  accept,
  multiple = false,
  maxSizeMb,
  disabled = false,
  error = false,
  helperText,
}: BaseFileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || disabled) return;
    let files = Array.from(incoming);

    if (maxSizeMb) {
      const tooBig = files.filter((f) => f.size > maxSizeMb * 1024 * 1024);
      files = files.filter((f) => f.size <= maxSizeMb * 1024 * 1024);
      setSizeError(
        tooBig.length
          ? `${tooBig.map((f) => f.name).join(", ")} exceeds ${maxSizeMb} MB`
          : null,
      );
    }
    if (!files.length) return;

    onChange?.(multiple ? [...value, ...files] : files.slice(0, 1));
  };

  const removeFile = (index: number) =>
    onChange?.(value.filter((_, i) => i !== index));

  const borderColor = error
    ? palette.danger.main
    : dragOver
      ? palette.primary.main
      : palette.slate[300];

  return (
    <FieldWrapper
      label={label}
      isRequired={isRequired}
      error={error}
      labelPosition={labelPosition}
      labelWidth={labelWidth}
      alignTop
    >
      <Box
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        sx={{
          border: `1.5px dashed ${borderColor}`,
          borderRadius: `${radius.lg}px`,
          bgcolor: dragOver ? palette.primary[50] : palette.slate[50],
          px: 3,
          py: 3,
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "border-color 150ms ease, background-color 150ms ease",
          "&:hover": disabled
            ? undefined
            : { borderColor: palette.primary.main },
        }}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
        <CloudUploadOutlinedIcon
          sx={{ fontSize: font.icon.xl, color: palette.slate[400] }}
        />
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Click to browse or drag & drop
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {[accept, maxSizeMb ? `max ${maxSizeMb} MB` : null]
            .filter(Boolean)
            .join(" · ") || "Any file type"}
        </Typography>
      </Box>

      {value.length > 0 && (
        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
          {value.map((file, index) => (
            <Stack
              key={`${file.name}-${index}`}
              direction="row"
              sx={{
                alignItems: "center",
                gap: 1,
                border: `1px solid ${palette.slate[200]}`,
                borderRadius: `${radius.md}px`,
                px: 1.5,
                py: 0.75,
                bgcolor: palette.white,
              }}
            >
              <InsertDriveFileOutlinedIcon
                sx={{ fontSize: font.icon.md, color: palette.slate[400] }}
              />
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {formatSize(file.size)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => removeFile(index)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
              >
                <DeleteOutlineRoundedIcon
                  sx={{ fontSize: font.icon.sm, color: palette.danger.main }}
                />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}

      {(sizeError || helperText) && (
        <FormHelperText error={error || Boolean(sizeError)}>
          {sizeError ?? helperText}
        </FormHelperText>
      )}
    </FieldWrapper>
  );
}
