"use client";

import { useState } from "react";
import { Box, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { CheckRounded, KeyboardArrowDownRounded } from "@mui/icons-material";

import { useLocale, type Locale } from "@/i18n";
import { font } from "@/theme/palette";

export function SwitchLanguageMenu() {
  const { locale, setLocale, languages } = useLocale();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);

  return (
    <>
      <Stack
        direction="row"
        spacing={0.75}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          alignItems: "center",
          cursor: "pointer",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          height: 40,
          px: 2,
          bgcolor: "white",
        }}
      >
        <Box
          component="img"
          src={languages[locale].flag}
          alt={languages[locale].short}
          sx={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
        <Typography
          sx={{
            fontWeight: font.weight.semibold,
            fontSize: font.size.md,
            color: "text.primary",
          }}
        >
          {languages[locale].short}
        </Typography>
        <KeyboardArrowDownRounded
          sx={{
            fontSize: font.icon.sm,
            color: "text.secondary",
            transition: "transform 0.15s ease",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </Stack>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 1,
              minWidth: 180,
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 6px 16px rgba(16,24,40,0.08)",
              overflow: "hidden",
              ul: {
                py: 0,
              },
            },
          },
        }}
      >
        {(Object.keys(languages) as Locale[]).map((key) => (
          <MenuItem
            key={key}
            selected={locale === key}
            onClick={() => {
              setLocale(key);
              setAnchor(null);
            }}
            sx={{ py: 1.5, gap: 2, fontWeight: locale === key ? 600 : 500 }}
          >
            <Box
              component="img"
              src={languages[key].flag}
              alt={languages[key].short}
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            {languages[key].label}
            {locale === key && (
              <CheckRounded
                sx={{
                  fontSize: font.icon.sm,
                  ml: "auto",
                  color: "success.main",
                }}
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
