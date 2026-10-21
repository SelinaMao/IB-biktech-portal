"use client";

import { useState } from "react";
import { Box, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { CheckRounded, KeyboardArrowDownRounded } from "@mui/icons-material";

import { useLocale, type Locale } from "@/i18n";
import { font, palette } from "@/theme/palette";

export function SwitchLanguageMenu() {
  const { locale, setLocale, languages } = useLocale();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          alignItems: "center",
          cursor: "pointer",
          borderRadius: "9999px",
          height: 38,
          px: 1.75,
          bgcolor: "#EDF0F4",
          transition: "background-color 0.15s ease",
          "&:hover": {
            bgcolor: "#E2E8F0",
          },
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
            fontWeight: 500,
            fontSize: 14,
            color: "text.primary",
          }}
        >
          {languages[locale].label}
        </Typography>
        <KeyboardArrowDownRounded
          sx={{
            fontSize: 18,
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
                width: 20,
                height: 20,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <Typography
              sx={{
                fontWeight: locale === key ? font.weight.semibold : font.weight.regular,
                fontSize: font.size.md,
                flex: 1,
              }}
            >
              {languages[key].label}
            </Typography>
            {locale === key && <CheckRounded sx={{ fontSize: font.icon.sm, color: "primary.main" }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
export default SwitchLanguageMenu;
