"use client";

import Link, { type LinkProps } from "@mui/material/Link";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { MouseEvent, ReactNode } from "react";

export type TermsLinkTextProps = {
  /** Text shown before the link, e.g. "I have read and agreed to the". */
  text: ReactNode;
  linkText?: ReactNode;
  href?: string;
  onLinkClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  underline?: LinkProps["underline"];
  /** Styles for the link only; the leading text inherits the surrounding element's styles. */
  linkSx?: SxProps<Theme>;
};

/** Inline `<text> <link>` fragment — use when the caller already provides its own wrapping Typography (e.g. SetupPassword's `termsLabel` prop). */
export function TermsLinkText({
  text,
  linkText = "Terms & Conditions",
  href = "#",
  onLinkClick,
  underline = "hover",
  linkSx,
}: TermsLinkTextProps) {
  return (
    <>
      {text}{" "}
      <Link href={href} underline={underline} onClick={onLinkClick} sx={[{ textDecoration: "underline" }, ...(Array.isArray(linkSx) ? linkSx : [linkSx])]}>
        {linkText}
      </Link>
    </>
  );
}

export type BaseTermsLabelProps = TermsLinkTextProps & {
  variant?: TypographyProps["variant"];
  /** Styles for the wrapping Typography. */
  sx?: SxProps<Theme>;
};

/** Self-contained `<Typography><text> <link></Typography>` — use as a BaseCheckbox/ControlledBaseCheckbox `label`. */
export default function BaseTermsLabel({ variant = "body2", sx, ...rest }: BaseTermsLabelProps) {
  return (
    <Typography variant={variant} sx={sx}>
      <TermsLinkText {...rest} />
    </Typography>
  );
}
