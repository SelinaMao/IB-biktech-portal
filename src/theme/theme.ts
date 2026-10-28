import { createTheme } from "@mui/material/styles";
import React from "react";
import { font, palette, radius } from "./palette";
import { CheckboxIcon, CheckboxCheckedIcon, CheckboxIndeterminateIcon } from "./CheckboxIcons";

// const fontFamily = "var(--font-poppins), var(--font-noto-khmer), sans-serif";
const fontFamily = "var(--font-poppins)";
/**
 * Single source of truth for component styling.
 *
 * Every base component (BaseButton, BaseInput, BaseSelect, BaseCheckbox,
 * BaseRadioGroup, cards, dialogs, …) stays "dumb": no colors or radii at the
 * call site. All visual defaults live here and read ONLY from `palette` /
 * `radius`. Change the palette → the whole app follows.
 */
export const createAppTheme = () =>
  createTheme({
    cssVariables: true,
    palette: {
      mode: "light",
      primary: {
        main: palette.primary.main,
        light: palette.primary.light,
        dark: palette.primary.dark,
        contrastText: palette.primary[950],
      },
      secondary: {
        main: palette.secondary.main,
        light: palette.secondary.light,
        dark: palette.secondary.dark,
        contrastText: palette.primary[950],
      },
      info: {
        main: palette.info.main,
        light: palette.info[300],
        dark: palette.info[700],
        contrastText: palette.white,
      },
      success: {
        main: palette.success.main,
        light: palette.success[300],
        dark: palette.success[700],
        contrastText: palette.success[950],
      },
      warning: {
        main: palette.warning.main,
        light: palette.warning[300],
        dark: palette.warning[700],
        contrastText: palette.warning[950],
      },
      error: {
        main: palette.danger.main,
        light: palette.danger[300],
        dark: palette.danger[700],
        contrastText: palette.white,
      },
      background: {
        default: palette.slate[100],
        paper: palette.white,
      },
      text: {
        primary: palette.text.primary,
        secondary: palette.slate[500],
        disabled: palette.slate[400],
      },
      divider: palette.slate[200],
    },
    spacing: 4,
    typography: {
      fontFamily,
      // Full scale from `font.size` — nothing outside src/theme sets a size.
      // Headings default to the brand-tinted dark; `sx` at the call site
      // still wins (variant styles have lower priority than sx).
      h1: {
        color: palette.text.heading,
        fontSize: font.size["4xl"],
        fontWeight: font.weight.bold,
        lineHeight: 1.25,
      },
      h2: {
        color: palette.text.heading,
        fontSize: font.size["3xl"],
        fontWeight: font.weight.bold,
        lineHeight: 1.25,
      },
      h3: {
        color: palette.text.heading,
        fontSize: font.size["2xl"],
        fontWeight: font.weight.bold,
        lineHeight: 1.3,
      },
      h4: {
        color: palette.text.heading,
        fontSize: font.size.xl,
        fontWeight: font.weight.semibold,
        lineHeight: 1.3,
      },
      h5: {
        color: palette.text.heading,
        fontSize: font.size.lg,
        fontWeight: font.weight.semibold,
        lineHeight: 1.4,
      },
      h6: {
        color: palette.text.heading,
        fontSize: font.size.base,
        fontWeight: font.weight.semibold,
        lineHeight: 1.4,
      },
      subtitle1: { fontSize: font.size.base, fontWeight: font.weight.medium },
      subtitle2: { fontSize: font.size.md, fontWeight: font.weight.semibold },
      body1: { fontSize: font.size.base },
      body2: { fontSize: font.size.md },
      caption: { fontSize: font.size.xs },
      button: {
        textTransform: "none",
        fontWeight: font.weight.semibold,
        fontSize: font.size.md,
      },
    },
    shape: {
      borderRadius: radius.lg, // buttons + inputs baseline
    },
    components: {
      // Bank back-office: dense, no shouty shadows, predictable surfaces.
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true, // Disables the pulse/ripple effect globally
        },
      },

      /* ---------- Buttons ---------- */
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: radius.lg,
            fontWeight: font.weight.semibold,
            textTransform: "none",
            "&.Mui-disabled": {
              color: palette.slate[400],
              backgroundColor: palette.primary[50],
            },
          },
          sizeLarge: { paddingTop: 12, paddingBottom: 12 },
          contained: {
            "&.Mui-disabled": {
              backgroundColor: palette.primary[50],
              color: palette.slate[400],
            },
          },
          containedPrimary: {
            color: palette.white,
            "&:hover": { backgroundColor: palette.primary[600] },
          },
          containedSecondary: {
            color: palette.white,
            "&:hover": { backgroundColor: palette.secondary.dark },
          },
          outlined: {
            color: palette.primary.main,
            borderColor: palette.slate[300],
            "&:hover": {
              borderColor: palette.primary.main,
              backgroundColor: palette.primary[50],
            },
            "&.Mui-disabled": {
              borderColor: palette.slate[200],
              color: palette.slate[400],
            },
          },
          text: {
            color: palette.primary.main,
            "&:hover": {
              backgroundColor: palette.primary[50],
            },
            "&.Mui-disabled": {
              color: palette.slate[400],
            },
          },
        },
      },
      MuiIconButton: {
        defaultProps: {
          disableRipple: true, // Disables the pulse/ripple effect globally
        },
        styleOverrides: {
          root: {
            // borderRadius: radius.md,
            // border: `1px solid ${palette.slate[200]}`,
            // padding: "8px",
            // "&:hover": { backgroundColor: palette.primary[100] },
          },
        },
      },

      /* ---------- Inputs (TextField / Select / TextArea share these) ---------- */
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radius.lg,
            backgroundColor: palette.white,
            fontSize: font.size.md,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.slate[200],
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.slate[300],
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.primary.main,
              borderWidth: 1.5,
            },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.danger.main,
            },
            "&.Mui-disabled": {
              backgroundColor: palette.slate[50],
            },
            "&.MuiInputBase-multiline": {
              padding: "12px 14px",
            },
          },
          input: {
            padding: "12px 14px",
            "&::placeholder": { color: palette.slate[400], opacity: 1 },
          },
          inputMultiline: {
            padding: 0,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: palette.slate[500],
            "&.Mui-focused": { color: palette.primary.dark },
            "&.Mui-error": { color: palette.danger.main },
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            color: palette.slate[700],
            fontWeight: font.weight.medium,
            "&.Mui-focused": { color: palette.primary.dark },
            "&.Mui-error": { color: palette.danger.main },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            marginLeft: 2,
            "&.Mui-error": { color: palette.danger.main },
          },
        },
      },

      /* ---------- Checkbox / Radio / Switch ---------- */
      MuiCheckbox: {
        defaultProps: {
          disableRipple: true, // Disables the pulse/ripple effect globally
          icon: React.createElement(CheckboxIcon),
          checkedIcon: React.createElement(CheckboxCheckedIcon),
          indeterminateIcon: React.createElement(CheckboxIndeterminateIcon),
        },
        styleOverrides: {
          root: {
            // color: "white",
            padding: 8,
            "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: palette.navy[800] },
            "&.Mui-disabled": { color: palette.slate[200] },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            color: palette.slate[300],
            "&.Mui-checked": { color: palette.primary.main },
            "&.Mui-disabled": { color: palette.slate[200] },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: palette.navy[800],
            },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: palette.navy[800],
            },
          },
        },
      },

      /* ---------- Select dropdown / menus ---------- */
      MuiMenuItem: {
        styleOverrides: {
          root: {
            "&.Mui-selected": {
              backgroundColor: palette.slate[100],
              "&:hover": { backgroundColor: palette.primary[100] },
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: radius.lg,
            border: `1px solid ${palette.slate[200]}`,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
          },
        },
      },

      /* ---------- Surfaces ---------- */
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: radius.xl,
            border: `1px solid ${palette.slate[200]}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: radius.lg },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: radius.xl,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            outline: "none",
          },
        },
      },

      /* ---------- Misc ---------- */
      MuiLink: {
        defaultProps: { underline: "hover" },
        styleOverrides: {
          root: {
            color: palette.primary.dark,
            fontWeight: font.weight.semibold,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: radius.pill, fontWeight: font.weight.medium },
          colorInfo: {
            backgroundColor: palette.info.bg,
            color: palette.info[700],
          },
          colorSuccess: {
            backgroundColor: palette.success.bg,
            color: palette.success[700],
          },
          colorWarning: {
            backgroundColor: palette.warning.bg,
            color: palette.warning[700],
          },
          colorError: {
            backgroundColor: palette.danger.bg,
            color: palette.danger[700],
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          standardInfo: { backgroundColor: palette.info.bg },
          standardSuccess: { backgroundColor: palette.success.bg },
          standardWarning: { backgroundColor: palette.warning.bg },
          standardError: { backgroundColor: palette.danger.bg },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: palette.slate[900],
            borderRadius: radius.sm,
            fontSize: font.size.xs,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottomColor: palette.slate[200] },
          head: {
            backgroundColor: palette.slate[50],
            color: palette.slate[700],
            fontWeight: font.weight.semibold,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: palette.slate[200] },
        },
      },
      // Matches the back office: lowercase, tight, selected reads by colour and weight.
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40, borderBottom: `1px solid ${palette.slate[200]}` },
          indicator: { height: 2, borderRadius: "2px 2px 0 0" },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 40,
            paddingLeft: 4,
            paddingRight: 4,
            marginRight: 24,
            minWidth: 0,
            textTransform: "none",
            fontSize: font.size.md,
            fontWeight: font.weight.medium,
            color: palette.slate[500],
            "&:hover": { color: palette.slate[900] },
            "&.Mui-selected": { color: palette.primary[600], fontWeight: font.weight.semibold },
          },
        },
      },
    },
  });
