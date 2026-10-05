"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import Image from "next/image";

import BaseButton from "@core/components/BaseButton";
import { font, palette, radius } from "@/theme/palette";

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
  title,
  description,
  bodyExtra,
  imageSrc = "/assets/icons/linked_device.svg",
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
          position: "relative",
          width: "calc(100% + 48px)",
          height: imageHeight,
          mt: imageOffsetTop,
          borderRadius: `${radius.xl}px`,
          backgroundColor: palette.slate[100],
          overflow: "hidden",
        }}
      >
        {imageInset !== undefined ? <Box sx={{ position: "absolute", inset: imageInset }}>{image}</Box> : image}
      </Box>

      <Box sx={{ mt: 4, ...textBoxSx }}>
        <Typography
          variant="h5"
          sx={{ mb: 1, fontWeight: font.weight.bold, fontSize: font.size["5xl"], color: palette.slate[950], ...titleSx }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            variant="body2"
            sx={{ fontSize: font.size.base, maxWidth: font.weight.regular, mx: "auto", color: palette.slate[950], ...descriptionSx }}
          >
            {description}
          </Typography>
        ) : null}
        {bodyExtra}
      </Box>

      {secondaryActionTitle || primaryActionTitle ? (
        <Stack direction="row" spacing={6} sx={{ width: "100%" }}>
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
          {primaryActionTitle ? <BaseButton fullWidth title={primaryActionTitle} onClick={onPrimaryAction} /> : null}
        </Stack>
      ) : null}

      {children}
    </Stack>
  );
}
