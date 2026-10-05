"use client";

import { useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import dayjs, { type Dayjs } from "dayjs";

import { font, palette, radius } from "@/theme/palette";
import BaseButton from "./BaseButton";

export type BaseDownloadFormat = "pdf" | "excel" | "csv";

export type BaseDownloadRange =
  | "thisMonth"
  | "last2months"
  | "last1months"
  | "last3months"
  | "last6months"
  | "last12months";

export type BaseDownloadRangeOption = { value: BaseDownloadRange; label: string };

export type BaseDownloadValue = {
  range: BaseDownloadRange;
  format: BaseDownloadFormat;
};

export type BaseDownloadPanelProps = {
  /** Element the panel is anchored to. Panel is closed when null. */
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onDownload: (value: BaseDownloadValue) => void;
  defaultValue?: Partial<BaseDownloadValue>;
  rangeOptions?: BaseDownloadRangeOption[];
};

const DEFAULT_RANGE_OPTIONS: BaseDownloadRangeOption[] = [
  { value: "thisMonth", label: "This month" },
  { value: "last1months", label: "Last 1 month" },
  { value: "last2months", label: "Last 2 month" },
  { value: "last3months", label: "Last 3 months" },
  { value: "last6months", label: "Last 6 months" },
  { value: "last12months", label: "Last 12 months" },
];

const FORMAT_OPTIONS: { value: BaseDownloadFormat; label: string; icon: string }[] = [
  { value: "pdf", label: "PDF file", icon: "/assets/icons/pdf.svg" },
  { value: "excel", label: "Excel file", icon: "/assets/icons/xls.svg" },
  { value: "csv", label: "CSV file", icon: "/assets/icons/csv.svg" },
];

/** Turns a `BaseDownloadRange` into a concrete `[start, end]` range — for
 *  callers that need to translate the picked range into request params
 *  (e.g. an export API's startedDate/endedDate). */
export function resolveBaseDownloadRange(range: BaseDownloadRange): { start: Dayjs; end: Dayjs } {
  const now = dayjs().startOf("day");
  switch (range) {
    case "thisMonth":
      return { start: now.startOf("month"), end: now };
    case "last1months":
      return { start: now.subtract(1, "month"), end: now };
    case "last2months":
      return { start: now.subtract(2, "month"), end: now };
    case "last3months":
      return { start: now.subtract(3, "month"), end: now };
    case "last6months":
      return { start: now.subtract(6, "month"), end: now };
    case "last12months":
      return { start: now.subtract(12, "month"), end: now };
  }
}

/**
 * "Download" panel anchored to its trigger — the export counterpart to
 * BaseFilter. Picks a month range and one file format, then hands both
 * back on "Download".
 */
export default function BaseDownloadPanel({
  anchorEl,
  onClose,
  onDownload,
  defaultValue,
  rangeOptions = DEFAULT_RANGE_OPTIONS,
}: BaseDownloadPanelProps) {
  const [range, setRange] = useState<BaseDownloadRange>(defaultValue?.range ?? "thisMonth");
  const [format, setFormat] = useState<BaseDownloadFormat>(defaultValue?.format ?? "pdf");

  const handleDownload = () => {
    onDownload({ range, format });
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: 520,
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            borderRadius: `${radius.xl}px`,
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.16)",
          },
        },
      }}
    >
      <Box sx={{ p: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            mx: -3,
            px: 3,
            pb: 2,
            mb: 2,
            borderBottom: `1px solid ${palette.slate[200]}`,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: font.size.xxl, p: 6 }}>
            Download
          </Typography>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Close download panel"
            sx={{ pr: 6, color: palette.black40 }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack p={6} spacing={6}>
          <Box>
            <Typography
              variant="body2"
              sx={{ color: palette.slate[450], fontWeight: font.weight.medium, mb: 2, fontSize: font.size.md }}
            >
              Select Type
            </Typography>
            <Stack direction="row" flexWrap="wrap" sx={{ gap: 4, rowGap: 4 }}>
              {rangeOptions.map((opt) => {
                const active = opt.value === range;
                return (
                  <Box
                    key={opt.value}
                    component="button"
                    type="button"
                    onClick={() => setRange(opt.value)}
                    sx={{
                      cursor: "pointer",
                      border: `1px solid ${active ? palette.navy[800] : palette.slate[200]}`,
                      borderRadius: "8px",
                      bgcolor: active ? palette.navy[800] : palette.white,
                      color: active ? palette.white : "text.primary",
                      fontFamily: "inherit",
                      fontWeight: font.weight.regular,
                      fontSize: font.size.xs,
                      px: 2,
                      py: 0.75,
                      transition: "all 150ms ease",
                      "&:hover": { borderColor: palette.navy[800] },
                    }}
                  >
                    {opt.label}
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Box>
            <Typography
              variant="body2"
              sx={{ color: palette.slate[450], fontWeight: font.weight.medium, mb: 2, fontSize: font.size.md }}
            >
              File Type
            </Typography>

            <Stack direction="row" spacing={2}>
              {FORMAT_OPTIONS.map((opt) => {
                const active = opt.value === format;
                return (
                  <Box
                    key={opt.value}
                    component="button"
                    type="button"
                    onClick={() => setFormat(opt.value)}
                    sx={{
                      flex: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      border: `1px solid ${active ? palette.navy[800] : palette.slate[200]}`,
                      borderRadius: `${radius.md}px`,
                      bgcolor: active ? palette.navy[800] : palette.white,
                      fontFamily: "inherit",
                      px: 1.25,
                      py: 1,
                      transition: "all 150ms ease",
                      "&:hover": { borderColor: palette.navy[800] },
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        borderRadius: "6px",
                        display: "grid",
                        placeItems: "center",
                        // bgcolor: active ? palette.white : palette.slate[100],
                      }}
                    >
                      <Image src={opt.icon} alt={opt.label} width={24} height={24} />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: font.size.xs,
                        fontWeight: font.weight.regular,
                        color: active ? palette.white : "text.primary",
                        textAlign: "left",
                        lineHeight: 1.2,
                      }}
                    >
                      {opt.label}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Stack>


        <Box sx={{ pt: 2.5, pb: 6, display: "flex", justifyContent: "center" }}>
          <BaseButton
            title="Download"
            fullWidth
            onClick={handleDownload}
            sx={{ width: "80%", fontSize: 16, fontWeight: font.weight.regular }}
          />
        </Box>
      </Box>
    </Popover>
  );
}
