/**
 * Layout constants — single source for chrome dimensions, next to the palette
 * so all "config" lives under src/theme.
 */
export const SIDEBAR_WIDTH = 300;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
export const TOPBAR_HEIGHT = 64;

/** Default gap (theme spacing units) between a topbar vertical divider and its neighbors. Pass `sx={{ mx }}` to a <Divider> to override per-instance. */
export const TOPBAR_DIVIDER_SPACING = 2;

/** localStorage key remembering the collapsed state across sessions. */
export const SIDEBAR_COLLAPSED_KEY = "bo.sidebar-collapsed";
