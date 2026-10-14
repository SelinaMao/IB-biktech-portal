"use client";

import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { palette } from "@/theme/palette";

export type BaseRightSideNavItem = {
  key?: string;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
};

export type BaseRightSideNavbarProps = {
  /** Heading at the top of the right sidebar (defaults to "Quick Navigation"). */
  title?: string;
  /** Navigation items — pass simple label strings or item objects with `onClick` / `href`. */
  items: ReadonlyArray<string | BaseRightSideNavItem>;
  /** Optional callback when an item is clicked. */
  onItemClick?: (item: BaseRightSideNavItem, index: number) => void;
  /** Bottom support/help card config. Pass `false` to hide it. */
  assistance?:
    | {
        title?: string;
        description?: React.ReactNode;
      }
    | false;
  sx?: SxProps<Theme>;
};

const DEFAULT_ASSISTANCE = {
  title: "Need Assistance?",
  description:
    "Contact your dedicated Obsidian Enterprise support team at corporate@obsidianops.com",
};

export default function BaseRightSideNavbar({
  title = "Quick Navigation",
  items,
  onItemClick,
  assistance = DEFAULT_ASSISTANCE,
  sx,
}: BaseRightSideNavbarProps) {
  const normalizedItems: BaseRightSideNavItem[] = items.map((item) =>
    typeof item === "string" ? { label: item } : item
  );

  return (
    <Box
      sx={[
        {
          bgcolor: "#FFFFFF",
          borderRadius: "20px",
          p: 3,
          height: "100%",
          minHeight: { lg: "calc(100vh - 140px)" },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {title && (
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 700,
            color: "#0F172A",
            mb: 2,
          }}
        >
          {title}
        </Typography>
      )}

      <Stack>
        {normalizedItems.map((item, index) => {
          const key = item.key ?? `${item.label}-${index}`;
          return (
            <Box
              key={key}
              component={item.href ? Link : "button"}
              href={item.href}
              type={item.href ? undefined : "button"}
              onClick={() => {
                item.onClick?.();
                onItemClick?.(item, index);
              }}
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 4,
                px: 4,
                border: "none",
                borderBottom: "1px solid #F1F5F9",
                bgcolor: item.active ? "#F8FAFC" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                textDecoration: "none",
                transition: "background-color 0.15s ease",
                "&:hover": {
                  bgcolor: "#F8FAFC",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: item.active ? 600 : 400,
                  color: item.active ? palette.primary[40] : "#334155",
                }}
              >
                {item.label}
              </Typography>
              <ChevronRight
                size={15}
                color={item.active ? palette.primary[40] : "#94A3B8"}
              />
            </Box>
          );
        })}
      </Stack>

      {assistance !== false && (
        <Box
          sx={{
            mt: 3,
            p: 2.25,
            borderRadius: "14px",
            bgcolor: "#E6EEF8",
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: palette.primary[40],
              mb: 0.75,
            }}
          >
            {assistance.title ?? DEFAULT_ASSISTANCE.title}
          </Typography>
          <Typography
            component="div"
            sx={{
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.55,
            }}
          >
            {assistance.description ?? DEFAULT_ASSISTANCE.description}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
