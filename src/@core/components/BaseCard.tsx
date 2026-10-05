"use client";

import Card, { type CardProps, type CardTypeMap } from "@mui/material/Card";
import type { OverridableComponent } from "@mui/material/OverridableComponent";
import type { SxProps, Theme } from "@mui/system";
import { forwardRef } from "react";
import { padding } from "@/theme/palette";

export type BaseCardProps<
  RootComponent extends React.ElementType = CardTypeMap["defaultComponent"],
> = CardProps<RootComponent>;

const baseStyles: SxProps<Theme> = {
  p: `${padding.xxl}px`,
  gap: 2,
};

const BaseCard = forwardRef<HTMLDivElement, CardProps>(function BaseCard(
  { sx, children, ...rest },
  ref,
) {
  const mergedSx: SxProps<Theme> = [
    baseStyles,
    ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
  ];

  return (
    <Card {...rest} ref={ref} sx={mergedSx}>
      {children}
    </Card>
  );
}) as OverridableComponent<CardTypeMap>;

export default BaseCard;
