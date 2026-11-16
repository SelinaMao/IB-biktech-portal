"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import Image from "next/image";

import BaseButton from "@core/components/BaseButton";
import { font, padding, palette, radius } from "@/theme/palette";

export type BindPromptContentProps = {
  title: ReactNode;
  description?: ReactNode;
  bodyExtra?: ReactNode;
  imageSrc?: string;
  imageHeight?: number;
  imageOffsetTop?: number;
  imageInset?: number;
  stackSx?: SxProps<Theme>;
  textBoxSx?: SxProps<Theme>;
  titleSx?: SxProps<Theme>;
  descriptionSx?: SxProps<Theme>;
  primaryActionTitle?: string;
  onPrimaryAction?: () => void;
  secondaryActionTitle?: string;
  onSecondaryAction?: () => void;
  secondaryActionLoading?: boolean;
  children?: ReactNode;
};

export default function BindPromptContent({
  title = "Activate Account",
  description = "You're almost there! Activate your account to get started and access all features.",
  bodyExtra,
  imageSrc = "/assets/icons/ImageLinkMobile.svg",
  imageHeight = 300,
  imageOffsetTop = 0,
  imageInset,
  stackSx,
  textBoxSx,
  titleSx,
  descriptionSx,
  primaryActionTitle,
  onPrimaryAction,
  secondaryActionTitle,
  onSecondaryAction,
  secondaryActionLoading,
  children,
}: BindPromptContentProps) {
  const image = <Image src={imageSrc} alt="" fill style={{ objectFit: "cover", objectPosition: "center" }} />;

  return (
    <Stack sx={{ alignItems: "center", textAlign: "center", ...stackSx }} spacing={3}>
      <Box
        sx={{
          padding: `${padding.sm}px`,
          marginTop: "30px",
          position: "relative",
          width: "120px",
          height: "120px",
          mt: imageOffsetTop,
          overflow: "hidden",
        }}
      >
        {imageInset !== undefined ? <Box sx={{ position: "absolute", inset: imageInset }}>{image}</Box> : image}
      </Box>

      <Box sx={{ mt: 4, ...textBoxSx }}>
        <Typography
          variant="h5"
          sx={{ mb: 4, fontWeight: font.weight.bold, fontSize: font.size["5xl"], color: palette.slate[950], ...titleSx }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            variant="body2"
            sx={{ fontSize: font.size.base, maxWidth: font.weight.regular, mx: "auto", mb: 4, color: palette.slate[950], ...descriptionSx }}
          >
            {description}
          </Typography>
        ) : null}
        {bodyExtra}
      </Box>

      {secondaryActionTitle || primaryActionTitle ? (
        <Stack direction="row" sx={{ width: "100%", pt: 1 }}>
          {secondaryActionTitle ? (
            <BaseButton
              fullWidth
              title={secondaryActionTitle}
              onClick={onSecondaryAction}
              isLoading={secondaryActionLoading}
              sx={{
                backgroundColor: "#FFFFFF",
                color: palette.danger.main,
                border: `1px solid ${palette.danger.main}`,
                "&:hover": {
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${palette.danger.main}`,
                },
              }}
            />
          ) : null}
          {primaryActionTitle ? (
            <BaseButton
              fullWidth
              title={primaryActionTitle}
              onClick={onPrimaryAction}
              sx={{ height: 52, fontSize: font.size.lg, fontWeight: font.weight.bold }}
            />
          ) : null}
        </Stack>
      ) : null}

      {children}
    </Stack>
  );
}
