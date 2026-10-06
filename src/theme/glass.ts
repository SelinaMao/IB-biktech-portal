import { alphaWhite, palette, radius } from "./palette";

/**
 * Dark-glass variant used on the auth screens (login panel over the
 * full-bleed background image). This is the ONE sanctioned exception to the
 * light theme — and it still reads only from `palette`. Nothing outside
 * `src/theme` should hardcode colors.
 */

/** The frosted right-side panel on the login page. */
export const glassPanelSx = {
  background:"#ffffff",
    // "linear-gradient(180deg, rgba(0,13,92,0.70) 0%, rgba(23,46,183,0.70) 100%)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  // boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
  // borderRadius: { xs: 0, md: `${radius.xl + 8}px 0 0 ${radius.xl + 8}px` },
} as const;

/** White-on-glass input styling (TextField / Select on the glass panel). */
export const glassInputSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: alphaWhite(0.08),
    color: palette.white,
    "& fieldset": { borderColor: alphaWhite(0.25) },
    "&:hover fieldset": { borderColor: alphaWhite(0.45) },
    "&.Mui-focused fieldset": { borderColor: palette.secondary.main },
  },
  "& .MuiInputBase-input::placeholder": {
    color: alphaWhite(0.45),
    opacity: 1,
  },
  "& .MuiFormHelperText-root": {
    color: alphaWhite(0.5),
    "&.Mui-error": { color: palette.danger[970] },
  },
} as const;

/** Checkbox on the glass panel. */
export const glassCheckboxSx = {
  color: "#0D9488",
  "&.Mui-checked": { color: "#0D9488", },
} as const;

/** Checkbox error/helper text on the glass panel — danger.main is unreadable
 * on navy, use the light tint (same as glassInputSx helper). */
export const glassCheckboxHelperSx = {
  "&.Mui-error": { color: "#0D9488", },
} as const;

/** Muted / body / faint text tones on the glass panel. */
export const glassText = {
  body: alphaWhite(0.75),
  muted: alphaWhite(0.65),
  faint: alphaWhite(0.45),
  icon: alphaWhite(0.6),
  hover: alphaWhite(0.8),
} as const;
