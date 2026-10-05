'use client'

import React from "react";
import { useAppSelector } from "@/store/hooks";

export interface BaseBlurTextProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    // optional width to keep overlay consistent e.g., for monospace amounts
    width?: number | string;
}

export default function BaseBlurText({ children, className, style, width }: BaseBlurTextProps) {
    const hideAmount = useAppSelector((s) => s.global.hideAmount);

    // If no children provided, render nothing
    if (children === null || children === undefined) return null;

    // Wrapper keeps layout (inline-block) and overlays a background to obscure text
    return (
        <span
            className={className}
            style={{
                position: "relative",
                display: "inline-block",
                lineHeight: 1,
                verticalAlign: "middle",
                width: width ?? undefined,
                ...style,
            }}
        >
            <span style={{ visibility: hideAmount ? "hidden" : "visible", fontSize: style?.fontSize }}>{children}</span>

            {hideAmount && (() => {
                // Monotone noise overlay
                const NOISE_OPACITY = 0.6000000238418579;
                const NOISE_COLOR = "#00000026";
                const noiseSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#noise)' fill='${NOISE_COLOR}'/></svg>`;
                const noiseDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(noiseSvg)}`;

                return (
                    <span
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: NOISE_COLOR,
                            backgroundImage: `url("${noiseDataUrl}")`,
                            backgroundRepeat: "repeat",
                            backgroundSize: "auto",
                            // match typical pill/rank look; adjust as needed
                            borderRadius: 4,
                            opacity: NOISE_OPACITY,
                            // keep pointer events none so overlay doesn't block interactions unless desired
                            pointerEvents: "none",
                        }}
                    />
                );
            })()}
        </span>
    );
}
