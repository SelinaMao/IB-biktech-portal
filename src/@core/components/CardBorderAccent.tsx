"use client";

import React, { useId } from "react";
import { Box } from "@mui/material";

export interface CardBorderAccentProps {
  color?: string;
  type?: "top-left" | "bottom-left" | "left-side";
  radius?: number;
  length?: number;
  strokeWidth?: number;
}

/**
 * Renders a curved corner border accent in a given theme color, with smooth
 * gradients fading along adjacent card edges.
 *
 * - "top-left": Renders a glowing accent on the top-left rounded corner
 *   fading out along both the top edge and left edge (used on Transactions card).
 * - "bottom-left": Renders a glowing accent on the bottom-left rounded corner
 *   fading out along both the bottom edge and left edge (used on AccountDetailCard).
 * - "left-side": Renders accents on both top-left and bottom-left corners,
 *   connected by the left vertical stroke.
 */
export default function CardBorderAccent({
  color = "#74C0A8",
  type = "top-left",
  radius = 20,
  length = 48,
  strokeWidth = 2,
}: CardBorderAccentProps) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  const halfW = strokeWidth / 2;
  const arcR = Math.max(1, radius - halfW);
  const boxW = length;
  const boxH = length;

  if (type === "top-left") {
    return (
      <Box
        component="svg"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: boxW,
          height: boxH,
          pointerEvents: "none",
          overflow: "visible",
          zIndex: 1,
        }}
      >
        <defs>
          <linearGradient
            id={`${id}-tl-top`}
            x1={radius}
            y1={halfW}
            x2={boxW}
            y2={halfW}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id={`${id}-tl-left`}
            x1={halfW}
            y1={radius}
            x2={halfW}
            y2={boxH}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Horizontal top edge line fading right */}
        <line
          x1={radius}
          y1={halfW}
          x2={boxW}
          y2={halfW}
          stroke={`url(#${id}-tl-top)`}
          strokeWidth={strokeWidth}
        />
        {/* Top-left rounded corner arc */}
        <path
          d={`M ${radius} ${halfW} A ${arcR} ${arcR} 0 0 0 ${halfW} ${radius}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Vertical left edge line fading down */}
        <line
          x1={halfW}
          y1={radius}
          x2={halfW}
          y2={boxH}
          stroke={`url(#${id}-tl-left)`}
          strokeWidth={strokeWidth}
        />
      </Box>
    );
  }

  if (type === "bottom-left") {
    const botArcStartY = boxH - radius;
    const botArcEndY = boxH - halfW;

    return (
      <Box
        component="svg"
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: boxW,
          height: boxH,
          pointerEvents: "none",
          overflow: "visible",
          zIndex: 1,
        }}
      >
        <defs>
          <linearGradient
            id={`${id}-bl-bot`}
            x1={radius}
            y1={botArcEndY}
            x2={boxW}
            y2={botArcEndY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id={`${id}-bl-left`}
            x1={halfW}
            y1={botArcStartY}
            x2={halfW}
            y2={0}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Bottom-left rounded corner arc */}
        <path
          d={`M ${halfW} ${botArcStartY} A ${arcR} ${arcR} 0 0 0 ${radius} ${botArcEndY}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Horizontal bottom edge line fading right */}
        <line
          x1={radius}
          y1={botArcEndY}
          x2={boxW}
          y2={botArcEndY}
          stroke={`url(#${id}-bl-bot)`}
          strokeWidth={strokeWidth}
        />
        {/* Vertical left edge line fading up */}
        <line
          x1={halfW}
          y1={botArcStartY}
          x2={halfW}
          y2={0}
          stroke={`url(#${id}-bl-left)`}
          strokeWidth={strokeWidth}
        />
      </Box>
    );
  }

  // "left-side" (full left edge with top-left and bottom-left curves)
  const botArcStartY = boxH - radius;
  const botArcEndY = boxH - halfW;

  return (
    <>
      {/* Top-Left Arc + Horizontal Fade */}
      <Box
        component="svg"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: boxW,
          height: radius + 2,
          pointerEvents: "none",
          overflow: "visible",
          zIndex: 1,
        }}
      >
        <defs>
          <linearGradient
            id={`${id}-ls-top`}
            x1={radius}
            y1={halfW}
            x2={boxW}
            y2={halfW}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1={radius}
          y1={halfW}
          x2={boxW}
          y2={halfW}
          stroke={`url(#${id}-ls-top)`}
          strokeWidth={strokeWidth}
        />
        <path
          d={`M ${radius} ${halfW} A ${arcR} ${arcR} 0 0 0 ${halfW} ${radius}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      </Box>

      {/* Straight connecting left line */}
      <Box
        sx={{
          position: "absolute",
          top: `${radius}px`,
          bottom: `${radius}px`,
          left: 0,
          width: `${strokeWidth}px`,
          bgcolor: color,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Bottom-Left Arc + Horizontal Fade */}
      <Box
        component="svg"
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: boxW,
          height: boxH,
          pointerEvents: "none",
          overflow: "visible",
          zIndex: 1,
        }}
      >
        <defs>
          <linearGradient
            id={`${id}-ls-bot`}
            x1={radius}
            y1={botArcEndY}
            x2={boxW}
            y2={botArcEndY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M ${halfW} ${botArcStartY} A ${arcR} ${arcR} 0 0 0 ${radius} ${botArcEndY}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <line
          x1={radius}
          y1={botArcEndY}
          x2={boxW}
          y2={botArcEndY}
          stroke={`url(#${id}-ls-bot)`}
          strokeWidth={strokeWidth}
        />
      </Box>
    </>
  );
}
