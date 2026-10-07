export const palette = {
  primary: {
    40:"#2764A5",
    50: "#fbf7f1",
    100: "#f5eddf",
    200: "#ead8be",
    300: "#dcbd95",
    400: "#cc9966",
    500: "#c3834c",
    600: "#b56e41",
    700: "#965838",
    800: "#794833",
    900: "#633c2b",
    950: "#351e15",
    1000: "#363635",
    main: "#cc9966",
    dark: "#b56e41",
    light: "#ead8be",
  },
  hover:{
    10:"#E2E8F0"
  },


  // Secondary accents — a subset of Twine (light tan + brand tan).
  secondary: { light: "#ead8be", main: "#cc9966", dark: "#b56e41" },

  // Info — Minsk (indigo). `main`/`bg` for chips + alerts.
  info: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d1fe",
    300: "#a5b3fc",
    400: "#8089f9",
    500: "#6263f2",
    600: "#5045e6",
    700: "#4437cb",
    800: "#382fa4",
    900: "#2f2b7a",
    950: "#1f1b4b",
    main: "#6263f2",
    bg: "#E8ECF4",
  },
  // Success — Malachite (green).
  success: {
    50: "#f1fcf3",
    100: "#defae3",
    200: "#bff3c9",
    300: "#8de89f",
    400: "#53d56d",
    500: "#31ce51",
    600: "#1f9a38",
    700: "#1c792f",
    800: "#1b602a",
    900: "#184f25",
    950: "#082b11",
    main: "#31CE51",
    bg: "#defae3",
  },
  // Warning — California (amber).
  warning: {
    50: "#fffbea",
    100: "#fff3c5",
    200: "#ffe686",
    300: "#ffd347",
    400: "#ffbe1d",
    500: "#fd9e02",
    600: "#e07600",
    700: "#ba5103",
    800: "#973e09",
    900: "#7c330b",
    950: "#471901",
    main: "#fd9e02",
    bg: "#fff3c5",
  },
  // Error — Alizarin Crimson (red). Also cash-out / negative amounts.
  danger: {
    50: "#fef2f3",
    100: "#ffe1e3",
    200: "#ffc8cc",
    300: "#ffa2a9",
    400: "#fd6c76",
    500: "#DC2626",
    600: "#e21d2b",
    700: "#be1723",
    800: "#9d1721",
    900: "#821a21",
    950: "#47080c",
    970: "#ff424f",
    main: "#f53e4b",
    bg: "#FEE2E240",
  },

  // Neutrals — cool-grey scaffolding for surfaces, borders and muted text.
  slate: {
    25: "#ADADAD",
    50: "#F8FAFC",
    100: "#F1F5F9", // app background
    200: "#E2E8F0", // borders
    300: "#CBD5E1",
    400: "#94A3B8", // muted text
    450: "#898987",
    500: "#64748B",
    700: "#334155",
    900: "#1E293B",
    950: "#111827",
  },

  // Text — warm near-blacks. `heading` is the brand-tinted dark; `primary` is the neutral body colour.
  text: { primary: "#0a0a0a", heading: "#351e15", label: "#ffffff", secondary: "#676766" },

  // Icons — warm near-black for select/dropdown chevrons.
  icon: { default: "#363635" },

  white: "#FFFFFF",
  white50: "#ffffff45",

  black40: "#000000",
  black30:"#3D4550",

  // Status — shared indicator color for Dormant & Frozen account states.
  status: { dormantFrozen: "#FFCC00" },

  // Navy — sidebar chrome, the approved chart style (Group 37571 design:
  // navy[800] is the inflow series color), and BaseSwitch's default active
  // pill color.
  navy: {
    800: "#2F2B7A", // sidebar background
    500: "#3B4C8A", // active item background
    300: "#9AA6D4", // inactive item text
    100: "#2A367E",
    900: "#DBEAFE40"
  },
} as const;

/** White with opacity — for text/borders on dark glass surfaces (login). */
export const alphaWhite = (opacity: number) => `rgba(255,255,255,${opacity})`;

export const radius = {
  sm: 8,
  md: 10, // buttons, inputs
  lg: 12, // icon chips
  xl: 16, // cards
  pill: 999,
} as const;
export const padding = {
  sm: 8,
  xs: 4,
  md: 10, // buttons, inputs
  lg: 12, // icon chips
  xl: 16, // cards
  xxl: 20,
  xxxl: 25,
  xxxxl: 30,
  xlg: 18

} as const;

/** Shared height for buttons + inputs that must line up (auth forms, dialogs). */
export const controlBTNHeight = { xs: 42, md: 46 } as const;

/**
 * Typography tokens — the ONLY place font sizes/weights are defined.
 * Components never hardcode rem/px values; they use a Typography variant
 * (preferred) or `font.size.*` when a variant doesn't fit.
 */
export const font = {
  size: {
    xs: "12px", // captions, tooltips, table meta
    sm: "13px", // footer links, dense secondary text
    md: "14px", // body2, nav items, buttons, inputs
    base: "16px", // body1
    lg: "18px", // h5
    xl: "20px", // h4
    xxl: "24px", // h3
    "2xl": "26px", // h3
    "3xl": "30px", // h2
    "4xl": "36px", // h1
    "5xl": "32px",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  /** Icon sizes in px (MUI icons take `fontSize` in sx). */
  icon: {
    sm: 18,
    md: 20,
    lg: 24,
    xl: 32,
  },
} as const;
