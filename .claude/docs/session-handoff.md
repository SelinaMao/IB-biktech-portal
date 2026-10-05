# Session Handoff — SME Back Office Portal

> Context summary for future Claude sessions. Last updated: 2026-07-18.
> Read this before touching code — it records decisions already made with the
> user (Siveing). Do not re-litigate them.

## What this project is

Bank-internal admin console for **SME Bank of Cambodia** governing Web + Mobile
Corporate Banking channels. Configures systems that move money; does not move
money itself. Security, auditability, dual control (maker-checker) come first.
See CLAUDE.md for non-negotiables (no secrets in browser, BFF re-checks
everything, audit every state change, maker-checker for sensitive mutations).

## Stack (installed & working)

- Next.js 16.2.10 (App Router, Turbopack) · React 19.2.4 · TS strict
- MUI v7 + Emotion (CSS layer `mui` via `enableCssLayer`) · Tailwind v4
- Redux Toolkit + RTK Query (single root `baseApi`, per-request `makeStore`)
- react-hook-form + yup + @hookform/resolvers
- next-intl (cookie-based, NO locale URL prefixes) · dayjs (NOT moment/lodash)
- NOTE (AGENTS.md): Next 16 has breaking changes — consult
  `node_modules/next/dist/docs/` before using unfamiliar APIs.

## Directory conventions (user's explicit choices)

- `src/@core`, `src/@layouts`, `src/@menu` — shared base (Vuexy-style; user
  wants these KEPT; aliases `@core/*`, `@layouts/*`, `@menu/*` in tsconfig).
  `@layouts`/`@menu` are still empty (to be ported/adapted from old project).
- `src/features/<name>/` — one folder per screen/feature (auth, user, role…):
  `<name>.api.ts` (RTK Query via `baseApi.injectEndpoints` — never a second
  `createApi`), `<name>.slice.ts`, `index.ts` barrel. Auth exists as template.
- `src/store/` — generic data layer only: `index.ts` (makeStore), `baseApi.ts`,
  `baseQuery.ts` (Themis pass-through TODO), `hooks.ts`, `StoreProvider.tsx`.
- `src/config/api.config.ts` — BFF path registry (`{id}` placeholders).
  X-Client-Id/X-Client-Secret are attached BFF-side only, never from browser.
- Reference project (conventions source, do NOT copy code):
  `/Users/siveing/Workspace/BiKTECH/Projects/IBanking/banking-portal`
  (Vuexy, Next 14/MUI v5, untyped). New code must be typed (no `any`).

## Theme & branding (final decisions)

- **Light mode ONLY** — dark mode was removed on user request.
- Tokens in `src/theme/palette.ts`: Twine tan (#cc9966) primary, `danger` scale
  maps to MUI `error`; `radius` scale (md=10 baseline, xl=16 cards); navy
  reserved for sidebar only. `contrastText` on primary = Twine 950 (white on
  tan fails WCAG).
- `createAppTheme()` in `src/theme/theme.ts`; heading color via typography
  h1–h6 (sx overrides win). Do NOT use MuiTypography styleOverrides for heading
  colors — it beat sx and broke the login heading once already.
- **Single font: Noto Sans Khmer only** (local TTFs in
  `src/styles/fonts/Noto_Sans_Khmer`, weights 400–700, var `--font-noto-khmer`).
  Geist was removed on user request; Noto Sans Khmer covers Latin too.
- Do not reorder the `@layer theme, base, mui, components, utilities;` line in
  `src/app/globals.css`.
- Branding in `public/branding/`: `logo-gold.png` (used on login),
  `logo.png` (bronze), `logo1.png` (blue), `screen.png` (login bg, 17MB — user
  should compress to WebP), flags in `branding/flags/{en,km}.svg` (simple SVGs
  I drew — replace with real assets anytime).

## i18n (next-intl, cookie mode)

- No `/en` `/km` URLs. Locale in `bo-locale` cookie; `src/i18n/request.ts`
  reads it (makes all routes dynamic — fine for authed portal).
- `src/i18n/config.ts` (locales en/km), `locale-actions.ts` ("use server"
  setLocale), `index.ts` (client `useLocale()` → `{locale, setLocale,
  languages, isPending}`; `languages` has label/short/flag per locale — the
  user's flag-based `SwitchLanguageMenu` in `@core/components` consumes it).
- Messages: `messages/en.json`, `messages/km.json` (namespace `login` so far).
  Components use `useTranslations("login")` from next-intl.
- Layout is async: `getLocale()`/`getMessages()` → `<html lang>` +
  `NextIntlClientProvider`.

## Form system (built, use as template)

`src/@core/form/` — dumb wrappers + RHF controlled variants, all generic over
`FieldValues`: BaseInput/BaseSelect/BaseTextArea/BaseCheckbox/BaseRadioGroup +
Controlled* of each, barrel `index.ts`. Conventions: yup error message wins
over helperText; `readOnly` renders label+value (detail screens); options as
data not JSX. DatePicker/FileUpload deliberately NOT built yet (need
@mui/x-date-pickers / react-dropzone — add when a screen needs them).
Login page (`src/app/(auth)/login/page.tsx`) is the reference implementation:
`useForm` + `yupResolver`, localized error messages, `isSubmitting` drives
BaseButton `isLoading`, submit button stays enabled (errors on submit).

## Auth feature (`src/features/auth/`)

- `auth.api.ts`: me/login/logout via BFF, tag "Session".
- `auth.slice.ts`: UI mirror only (SessionUser, status); real session =
  httpOnly cookie set by BFF; never store tokens client-side.
- `auth.error.ts`: AuthError (message/description/messageCode/traceId) +
  toAuthError(RTKQ error).
- `use-auth.ts`: `login({userId,password})` maps userId→usernameOrEmail,
  dispatches setSession, redirects "/"; `logout()` clears even on BFF failure.
- `@core/components/AppToast.tsx`: imperative `showToast(severity, {title,
  message, messageCode, requestId})` + `<AppToaster/>` mounted in root layout
  (autoHide 3000 — user tuned it).

## Verified working (browser-tested end-to-end)

Login page renders with gold logo + screen.png bg; EN↔KM switch via flag menu
(server action → cookie → refresh → whole tree re-renders); yup validation
shows localized Khmer errors; submit POSTs /api/v1/auth/login and failure path
shows AuthError toast; computed font = notoSansKhmer for EN and KM text.
`tsc --noEmit`, `eslint`, `next build` all clean at handoff.

## Known gaps / next steps (in rough order)

1. **BFF auth routes** — `src/app/api/v1/auth/*/route.ts` proxying core auth
   with X-Client-Id/X-Client-Secret server-side (`server-only` package is
   installed for this). Login currently 404s (no BFF yet) — expected.
2. Port/adapt `@layouts` + `@menu` shells from old project to MUI v7.
3. Dashboard + portal route group `app/(portal)/...`.
4. `src/styles/App*.ts` (fullcalendar/recharts/dropzone/tiptap/otp css) are
   template leftovers for uninstalled libs — delete or keep until needed.
5. Compress `public/branding/screen.png` (17MB) to WebP.
6. `.claude/docs/architecture.md` + `project-setup.md` were deleted from disk
   mid-session while CLAUDE.md still references them — user should restore or
   update CLAUDE.md.

## Working style notes

- User (Siveing) actively edits files between turns — always re-check current
  file state before editing; don't revert their changes (e.g. they renamed the
  font var to `--font-noto-khmer`, replaced SwitchLanguageMenu with a
  flag-based design, added branding assets, tuned toast duration).
- Dev server: `.claude/launch.json` name "dev" (npm run dev, port 3000,
  autoPort). Next 16 allows only ONE dev server per project dir.
- Verify changes in the browser, not just tsc/build.

