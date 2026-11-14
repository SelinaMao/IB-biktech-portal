"use client";

import React from "react";
import { Box } from "@mui/material";

export interface CardBorderAccentProps {
  color?: string;
  type?: "top-left" | "bottom-left" | "left-side";
  /** Card corner radius (must match the card's borderRadius) */
  radius?: number;
  /** Max thickness of the accent at the middle of the corner */
  strokeWidth?: number;
  /** Length of the accent along the card border */
  length?: number;
  /** How far the tapered tails run along the card edges */
  tailLength?: number;
  /** Figma box size of the accent */
  width?: number;
  height?: number;
  /** Figma offsets (negative = sticks out of the card) */
  top?: number;
  bottom?: number;
  left?: number;
}

interface CornerProps {
  color: string;
  position: "top" | "bottom";
  radius: number;
  strokeWidth: number;
  tailLength: number;
  width: number;
  height: number;
  offsetY: number; // top offset for "top", bottom offset for "bottom"
  left: number;
  withVerticalTail: boolean;
}

/**
 * One rounded corner drawn as a filled crescent:
 * thickest on the corner, tapering to a point along both card edges.
 */
function Corner({
  color,
  position,
  radius: R,
  strokeWidth: t,
  tailLength,
  width,
  height,
  offsetY,
  left,
  withVerticalTail,
}: CornerProps) {
  const isTop = position === "top";

  // Where the card corner sits inside the SVG
  const ox = -left;
  const oy = -offsetY;

  // Tail lengths, clamped to the space available inside the SVG box
  const a = Math.max(0, Math.min(tailLength, width - ox - R)); // along top/bottom edge
  const b = withVerticalTail
    ? Math.max(0, Math.min(tailLength, height - oy - R)) // along left edge
    : 0;

  const r2 = Math.max(1, R - t);

  // Local coordinates: card corner = (0,0), card grows to +x and +y.
  // The bottom corner is the same shape mirrored with scale(1, -1).
  const d = [
    // outer edge (follows the card border)
    `M ${R + a} 0`,
    `L ${R} 0`,
    `A ${R} ${R} 0 0 0 0 ${R}`,
    `L 0 ${R + b}`,
    // inner edge back: left tail tapers in
    `C 0 ${R + b * 0.6} ${t} ${R + b * 0.4} ${t} ${R}`,
    // inner arc
    `A ${r2} ${r2} 0 0 1 ${R} ${t}`,
    // top tail tapers out
    `C ${R + a * 0.4} ${t} ${R + a * 0.6} 0 ${R + a} 0`,
    "Z",
  ].join(" ");

  const translateY = isTop ? oy : height - oy;
  const scaleY = isTop ? 1 : -1;

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${width} ${height}`}
      sx={{
        position: "absolute",
        ...(isTop ? { top: `${offsetY}px` } : { bottom: `${offsetY}px` }),
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 1,
      }}
    >
      <g transform={`translate(${ox} ${translateY}) scale(1 ${scaleY})`}>
        <path d={d} fill={color} />
      </g>
    </Box>
  );
}

/**
 * Curved corner accent in the active account's theme color.
 * The stroke is thick on the rounded corner and tapers to a point
 * along the adjacent card edges.
 * Renders a curved corner border accent in a given theme color, with smooth
 * gradients fading along adjacent card edges.
 *
 * - "top-left": top-left corner (Transactions card).
 * - "bottom-left": bottom-left corner (AccountDetailCard).
 * - "left-side": both corners joined by a straight left stroke.
 *
 * The parent card needs `position: "relative"` and must NOT use
 * `overflow: "hidden"`, otherwise the part outside the card is clipped.
 */
export default function CardBorderAccent({
  color = "#74C0A8",
  type = "top-left",
  radius = 20,
  strokeWidth = 3,
  length,
  tailLength = 40,
  width = 95.89,
  height = 108.77,
  top = -16.73,
  bottom = -16.73,
  left = -23.32,
}: CardBorderAccentProps) {
  const effectiveTailLength = length ?? tailLength;
  const effectiveWidth = length ? Math.max(width, length + 20) : width;
  const effectiveHeight = length ? Math.max(height, length + 20) : height;
  const common = {
    color,
    radius,
    strokeWidth,
    tailLength: effectiveTailLength,
    width: effectiveWidth,
    height: effectiveHeight,
    left,
  };

  if (type === "top-left") {
    return <Corner {...common} position="top" offsetY={top} withVerticalTail />;
  }

  if (type === "bottom-left") {
    return <Corner {...common} position="bottom" offsetY={bottom} withVerticalTail />;
  }

  // "left-side"
  return (
    <>
      <Corner {...common} position="top" offsetY={top} withVerticalTail={false} />

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

      <Corner {...common} position="bottom" offsetY={bottom} withVerticalTail={false} />
    </>
  );
}