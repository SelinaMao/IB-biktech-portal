"use client";

import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ActivateAppPromptDialog, MobileBindingDialog, useCurrentDeviceBindingQuery } from "@/features/bind";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_TOP_PADDING, SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "@/theme/layout";
import { font, palette, radius } from "@/theme/palette";
import { ArrowLeftRight, BanknoteArrowDown, CalendarSync, ChevronDown, ChevronUp, Circle, CircleDollarSign, CreditCard, Form, HandCoins, LayoutDashboard, LayoutGrid, ListCollapse, ReceiptText, Shield, SquareCheckBig, SquareMenu, Store, UserShield, UsersRound } from "lucide-react";
import { CLIENT_PERMISSIONS, useAuth, useMeQuery } from "@/features/auth";
import { setHideAmount } from "@/store/global/global.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

/* ------------------------------------------------------------------ */
/* Animation + layout constants                                        */
/* ------------------------------------------------------------------ */
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const DURATION = "0.3s";

const ICON_SIZE = 20;
const LIST_PX = 12; // horizontal padding of the list (same collapsed / expanded)

/**
 * Horizontal padding inside each item (same collapsed / expanded).
 * Derived so the icon sits exactly centered in the collapsed rail:
 *   collapsedWidth = 2 * LIST_PX + 2 * ITEM_PX + ICON_SIZE
 * Assumes SIDEBAR_COLLAPSED_WIDTH is a number of px (e.g. 68 -> ITEM_PX = 14).
 */
const ITEM_PX = (Number(SIDEBAR_COLLAPSED_WIDTH) - 2 * LIST_PX - ICON_SIZE) / 2;

/** Label stays mounted; it fades and shrinks instead of unmounting. */
const labelSx = (collapsed: boolean) => ({
  m: 0,
  flex: "0 1 auto",
  overflow: "hidden",
  whiteSpace: "nowrap",
  opacity: collapsed ? 0 : 1,
  maxWidth: collapsed ? 0 : 180, // must be >= your longest label
  transition: `opacity 0.2s ${EASE}, max-width ${DURATION} ${EASE}`,
});

/** Same geometry and padding in both states. */
const itemBaseSx = {
  borderRadius: `${radius.sm}px`,
  mb: 0.5,
  minHeight: 44,
  height: 44,
  flexGrow: 0,
  flexShrink: 0,
  width: "100%",
  justifyContent: "flex-start",
  alignItems: "center",
  overflow: "hidden",
  pl: `${ITEM_PX}px`,
  pr: `${ITEM_PX}px`,
  transition: "background-color 0.15s ease, color 0.15s ease",
} as const;

/**
 * Navy sidebar — the ONLY component allowed to reference `palette.navy`
 * (see palette.ts). Collapses to an icon rail; labels become tooltips.
 *
 * Add modules here as they are built — one entry per nav item, label key
 * under `nav.*` in messages/*.json. `permissions` is a list of permission
 * codes (from the login/`me` response) — the item renders if the user has
 * ANY of them; omit `permissions` for items every authenticated user sees
 * (e.g. dashboard).
 */
const NAV_ITEMS = [
  { key: "dashboard", href: "/dashboard", Icon: LayoutDashboard },
  {
    key: "approvalRequests",
    href: "/approval-workflow/requests",
    Icon: SquareCheckBig,
    permissions: [CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW],
  },
  {
    key: "Account",
    href: "/account",
    Icon: Form,
    permissions: Object.values(CLIENT_PERMISSIONS.ACCOUNT),
  },
  {
    key: "Loan",
    href: "/loan",
    Icon: HandCoins,
    // Not in CLIENT_PERMISSIONS — no confirmed backend code for this module yet.
    permissions: Object.values(CLIENT_PERMISSIONS.ACCOUNT),
  },
  {
    key: "Transfers",
    href: "/transfer",
    Icon: "/assets/icons/banknote-arrow-right.svg",
    // Not in CLIENT_PERMISSIONS — confirmed codes are payment.transfer.{create,approve},
    // no transfer.view code exists yet; not substituting since create/approve is a
    // different scope than view.
    permissions: Object.values(CLIENT_PERMISSIONS.TRANSFER),
  },
  {
    key: "Payments",
    href: "/payment",
    Icon: ReceiptText,
    // Not in CLIENT_PERMISSIONS — confirmed codes are payment.payment.{create,approve},
    // no payment.view code exists yet; not substituting since create/approve is a
    // different scope than view.
    permissions: Object.values(CLIENT_PERMISSIONS.PAYMENT),
  },
  {
    key: "Schedule",
    href: "/schedule",
    Icon: CalendarSync,
    // Not in CLIENT_PERMISSIONS — confirmed codes are payment.payment.{create,approve},
    // no payment.view code exists yet; not substituting since create/approve is a
    // different scope than view.
    permissions: Object.values(CLIENT_PERMISSIONS.PAYMENT),
  },
  {
    key: "Payroll",
    href: "/payroll",
    Icon: UsersRound,
    // Not in CLIENT_PERMISSIONS — no confirmed backend code for this module yet.
    permissions: [
      ...Object.values(CLIENT_PERMISSIONS.PAYROLL),
      ...Object.values(CLIENT_PERMISSIONS.ACCOUNT),
    ],
  },
  // {
  //   key: "Other Services",
  //   href: "/client-dashboard",
  //   Icon: SquareMenu,
  //   // Not in CLIENT_PERMISSIONS — no confirmed backend code for this module yet.
  //   permissions: Object.values(CLIENT_PERMISSIONS.PAYROLL),
  // },
  // {
  //   key: "Merchant",
  //   href: "/client-dashboard",
  //   Icon: Store,
  //   // Not in CLIENT_PERMISSIONS — no confirmed backend code for this module yet.
  //   permissions: Object.values(CLIENT_PERMISSIONS.MERCHANT),
  // },
  {
    key: "Administrator",
    href: "/client-dashboard",
    Icon: UserShield,
    // No static `permissions` here — visibility is derived from `children`
    // (see hasNavAccess/visibleNavItems) so it can never drift out of sync
    // with the child permission lists below.
    children: [
      {
        key: "users",
        href: "/users",
        permissions: Object.values(CLIENT_PERMISSIONS.USER),
      },
      {
        key: "Limits",
        href: "/limits",
        Icon: CreditCard,
        permissions: Object.values(CLIENT_PERMISSIONS.TRANSACTION_LIMIT),
      },
      { key: "rbac", href: "/rbac", permissions: [CLIENT_PERMISSIONS.ROLE.VIEW] },
      {
        key: "approvalSetup",
        href: "/approval-workflow",
        permissions: [CLIENT_PERMISSIONS.WORKFLOW.CONFIGURATION_VIEW],
      },
      {
        key: "approvalApprovers",
        href: "/approval-workflow/approvers",
        permissions: [CLIENT_PERMISSIONS.APPROVER_GROUP.VIEW],
      },
    ],
  },
] as const;

/** Strip query, hash and trailing slashes so two paths compare as the user sees them. */
const cleanPath = (path: string) => path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";

/** Every destination the sidebar can highlight — parents and children alike. */
const NAV_HREFS = NAV_ITEMS.flatMap((navItem) => [navItem.href, ...("children" in navItem && navItem.children ? navItem.children.map((child) => child.href) : [])]).map(cleanPath);

// BOTTOM_ITEMS is now defined dynamically inside the component to support React state and custom click actions (CLAUDE.md/USER directive)

const renderNavIcon = (Icon: React.ElementType | string, size = ICON_SIZE) => {
  if (typeof Icon === "string") {
    const src = Icon.replace(/^\/?public[\\/]/, "/").replace(/\\/g, "/");
    const cleanSrc = src.startsWith("/") ? src : `/${src}`;
    return (
      <Box
        component="span"
        sx={{
          width: size,
          height: size,
          display: "inline-block",
          bgcolor: "currentColor",
          mask: `url("${cleanSrc}") no-repeat center / contain`,
          WebkitMask: `url("${cleanSrc}") no-repeat center / contain`,
        }}
      />
    );
  }
  const Component = Icon;
  return <Component fontSize="small" size={size} sx={{ width: size, height: size }} />;
};

export type ClientSidebarProps = {
  collapsed: boolean;
};

export default function ClientSidebar({ collapsed }: ClientSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [mobileActivateOpen, setMobileActivateOpen] = useState(false);
  const [activatePromptOpen, setActivatePromptOpen] = useState(false);
  const [hasShownActivatePrompt, setHasShownActivatePrompt] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [closedActiveKey, setClosedActiveKey] = useState<string | null>(null);

  // Collapsed-rail flyout (dropdown) for items with children
  const [flyoutKey, setFlyoutKey] = useState<string | null>(null);
  const [flyoutAnchor, setFlyoutAnchor] = useState<HTMLElement | null>(null);

  const closeFlyout = () => {
    setFlyoutAnchor(null);
    setFlyoutKey(null);
  };

  const meQueryResult = useMeQuery(undefined);
  const { logout } = useAuth();

  const dispatch = useAppDispatch();
  const hideAmount = useAppSelector((state) => state.global.hideAmount);
  const hideAmountRef = useRef(hideAmount);
  useEffect(() => {
    hideAmountRef.current = hideAmount;
  }, [hideAmount]);
  const prevHideAmountRef = useRef<boolean | null>(null);

  const hasNavAccess = (permissions?: readonly string[]) => {
    if (!permissions) return true;
    return (meQueryResult.data?.permissions ?? []).some((p: string) => permissions.includes(p));
  };

  /**
   * The single href the current path belongs to: the longest one that matches.
   *
   * <p>A plain prefix test lights up every ancestor, so `/approval-workflow/requests` marked
   * both "Request approvals" and Administrator's "Approval setup" (`/approval-workflow`) —
   * which also forced the Administrator group open. Longest match wins, so only the page you
   * are actually on is highlighted.
   */
  const activeHref = useMemo(() => {
    const currentPath = cleanPath(pathname);
    let best: string | null = null;
    for (const href of NAV_HREFS) {
      const matches = currentPath === href || (href !== "/" && currentPath.startsWith(`${href}/`));
      if (matches && (best === null || href.length > best.length)) best = href;
    }
    return best;
  }, [pathname]);

  const isPathActive = (targetHref: string) => cleanPath(targetHref) === activeHref;

  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.map((navItem) => {
      if (!("children" in navItem) || !navItem.children) return navItem;
      return {
        ...navItem,
        children: navItem.children.filter((child) => hasNavAccess(child.permissions)),
      };
    }).filter((navItem) => {
      if ("children" in navItem && navItem.children) {
        return navItem.children.length > 0;
      }
      return hasNavAccess("permissions" in navItem ? (navItem.permissions as readonly string[]) : undefined);
    });
  }, [meQueryResult.data?.permissions]);

  // Collapsing resets the inline accordion; expanding closes the flyout.
  useEffect(() => {
    if (collapsed) {
      setExpandedKey(null);
      setClosedActiveKey(null);
    } else {
      closeFlyout();
    }
  }, [collapsed]);

  // Close the flyout whenever the route changes.
  useEffect(() => {
    closeFlyout();
  }, [pathname]);

  const { data: bindingState, isLoading: bindingStateLoading } = useCurrentDeviceBindingQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  useEffect(() => {
    const shouldForceHide = !bindingState?.linked && (activatePromptOpen || mobileActivateOpen);
    if (shouldForceHide) {
      if (prevHideAmountRef.current === null) {
        prevHideAmountRef.current = hideAmountRef.current;
      }
      dispatch(setHideAmount(true));
    } else if (prevHideAmountRef.current !== null) {
      dispatch(setHideAmount(prevHideAmountRef.current));
      prevHideAmountRef.current = null;
    }
  }, [activatePromptOpen, mobileActivateOpen, bindingState?.linked, dispatch]);

  useEffect(() => {
    if (!bindingStateLoading && !hasShownActivatePrompt && !mobileActivateOpen && (bindingState === undefined || bindingState === null || !bindingState.linked)) {
      setActivatePromptOpen(true);
      setHasShownActivatePrompt(true);
    }
  }, [bindingStateLoading, bindingState, hasShownActivatePrompt, mobileActivateOpen]);

  const handleCloseActivatePrompt = () => {
    setActivatePromptOpen(false);
    logout().catch((err) => console.error("Logout failed:", err));
  };

  // Closing the QR-scan step without finishing device binding leaves the
  // account unactivated, same as dismissing the activate prompt — so it
  // forces the same logout. An already-linked device just closes normally
  // (e.g. viewing device info from the sidebar menu).
  const handleCloseMobileBinding = () => {
    setMobileActivateOpen(false);
    if (!bindingState?.linked) {
      logout().catch((err) => console.error("Logout failed:", err));
    }
  };
  const handleGetStartedActivate = () => {
    setActivatePromptOpen(false);
    setMobileActivateOpen(true);
  };

  const isLinked = bindingState?.linked ?? true;
  const statusText = isLinked ? "ACTIVE" : bindingStateLoading ? "..." : "INACTIVE";
  const isHelpActive = isPathActive("/help");

  // Tooltips only show while collapsed, but the element is always mounted
  const tooltipProps = {
    placement: "right" as const,
    disableHoverListener: !collapsed,
    disableFocusListener: !collapsed,
    disableTouchListener: !collapsed,
  };

  return (
    <Box
      component="nav"
      sx={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        bgcolor: "#EDF0F4",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: `${TOPBAR_HEIGHT}px`,
        height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        maxHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        transition: `width ${DURATION} ${EASE}`,
        overflow: "hidden",
        zIndex: 10,
        paddingTop: `${SIDEBAR_TOP_PADDING}px`,
      }}
    >
      {/* Navigation */}
      <List sx={{
        px: `${LIST_PX}px`, // same padding collapsed or expanded
        py: 2,
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        "&::-webkit-scrollbar": {
          width: "4px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: palette.slate[300],
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: palette.slate[400],
        },
        scrollbarWidth: "thin",
        scrollbarColor: `${palette.slate[300]} transparent`,
      }}>
        {visibleNavItems.map((navItem) => {
          const { key, href, Icon } = navItem;
          const children = "children" in navItem ? navItem.children : undefined;

          if (children) {
            const childActive = children.some((child) => isPathActive(child.href));
            const isOpen = !collapsed && (childActive ? closedActiveKey !== key : expandedKey === key);
            const flyoutOpen = collapsed && flyoutKey === key && Boolean(flyoutAnchor);

            const parentButton = (
              <ListItemButton
                component="div"
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  if (collapsed) {
                    setFlyoutAnchor(e.currentTarget);
                    setFlyoutKey(key);
                    return;
                  }
                  if (childActive) {
                    setClosedActiveKey((prev) => (prev === key ? null : key));
                  } else {
                    setExpandedKey((prev) => (prev === key ? null : key));
                  }
                }}
                sx={{
                  ...itemBaseSx,
                  cursor: "pointer",
                  color: childActive || flyoutOpen ? palette.primary[40] : palette.black30,
                  bgcolor: childActive || flyoutOpen ? (collapsed ? "#EBF3FC" : palette.hover[10]) : "transparent",
                  "&:hover": {
                    bgcolor: childActive ? (collapsed ? "#E2EDF9" : palette.hover[10]) : palette.hover[10],
                    color: palette.black30,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 1.5,
                    justifyContent: "center",
                    alignItems: "center",
                    color: "inherit",
                  }}
                >
                  {renderNavIcon(Icon, ICON_SIZE)}
                </ListItemIcon>
                <ListItemText
                  primary={t(key)}
                  sx={labelSx(collapsed)}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: font.size.md,
                        fontWeight: childActive ? font.weight.semibold : font.weight.medium,
                        whiteSpace: "nowrap",
                      },
                    },
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    ml: "auto",
                    flexShrink: 0,
                    opacity: collapsed ? 0 : 1,
                    transition: `opacity 0.2s ${EASE}`,
                  }}
                >
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Box>
              </ListItemButton>
            );

            return (
              <Box key={key} sx={{ width: "100%", flexShrink: 0 }}>
                <Tooltip
                  title={t(key)}
                  {...tooltipProps}
                  disableHoverListener={!collapsed || flyoutOpen}
                >
                  {parentButton}
                </Tooltip>

                {/* Expanded: inline accordion */}
                <Collapse in={isOpen} timeout={300} unmountOnExit>
                  <List sx={{ py: 0 }}>
                    {children.map((child) => {
                      const childIsActive = isPathActive(child.href);
                      return (
                        <ListItemButton
                          key={child.key}
                          component={Link}
                          href={child.href}
                          sx={{
                            borderRadius: `${radius.sm}px`,
                            mb: 0.5,
                            minHeight: 40,
                            height: 40,
                            flexGrow: 0,
                            flexShrink: 0,
                            pl: 8,
                            pr: 4,
                            color: childIsActive ? palette.white : palette.black30,
                            bgcolor: childIsActive ? palette.primary[40] : "transparent",
                            "&:hover": {
                              bgcolor: childIsActive ? palette.primary[40] : palette.hover[10],
                              color: childIsActive ? palette.white : palette.black30,
                            },
                          }}
                        >
                          <ListItemText
                            primary={t(child.key)}
                            slotProps={{
                              primary: {
                                sx: {
                                  fontSize: font.size.md,
                                  fontWeight: childIsActive ? font.weight.semibold : font.weight.medium,
                                  whiteSpace: "nowrap",
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>

                {/* Collapsed: flyout dropdown (portal, so the sidebar's overflow:hidden doesn't clip it) */}
                <Popover
                  open={flyoutOpen}
                  anchorEl={flyoutAnchor}
                  onClose={closeFlyout}
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  disableScrollLock
                  slotProps={{
                    paper: {
                      sx: {
                        ml: 1,
                        minWidth: 200,
                        p: 1,
                        borderRadius: `${radius.sm}px`,
                        border: `1px solid ${palette.slate[200]}`,
                        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
                      },
                    },
                  }}
                >
                  <Typography
                    sx={{
                      px: 2,
                      py: 1,
                      fontSize: "12px",
                      fontWeight: font.weight.semibold,
                      color: palette.slate[500],
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t(key)}
                  </Typography>

                  {children.map((child) => {
                    const childIsActive = isPathActive(child.href);
                    return (
                      <ListItemButton
                        key={child.key}
                        component={Link}
                        href={child.href}
                        onClick={closeFlyout}
                        sx={{
                          borderRadius: `${radius.sm}px`,
                          mb: 0.5,
                          minHeight: 40,
                          px: 3,
                          color: childIsActive ? palette.white : palette.black30,
                          bgcolor: childIsActive ? palette.primary[40] : "transparent",
                          "&:hover": {
                            bgcolor: childIsActive ? palette.primary[40] : palette.hover[10],
                            color: childIsActive ? palette.white : palette.black30,
                          },
                        }}
                      >
                        <ListItemText
                          primary={t(child.key)}
                          slotProps={{
                            primary: {
                              sx: {
                                fontSize: font.size.md,
                                fontWeight: childIsActive ? font.weight.semibold : font.weight.medium,
                                whiteSpace: "nowrap",
                              },
                            },
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </Popover>
              </Box>
            );
          }

          const active = isPathActive(href);
          const item = (
            <ListItemButton
              component={Link}
              href={href}
              sx={{
                ...itemBaseSx,
                color: active ? palette.white : palette.black30,
                bgcolor: active ? palette.primary[40] : "transparent",
                "&:hover": {
                  bgcolor: active ? palette.primary[40] : palette.hover[10],
                  color: active ? palette.white : palette.black30,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 1.5,
                  justifyContent: "center",
                  alignItems: "center",
                  color: "inherit",
                }}
              >
                {renderNavIcon(Icon, ICON_SIZE)}
              </ListItemIcon>
              <ListItemText
                primary={t(key)}
                sx={labelSx(collapsed)}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: font.size.md,
                      fontWeight: active ? font.weight.semibold : font.weight.medium,
                      whiteSpace: "nowrap",
                    },
                  },
                }}
              />
            </ListItemButton>
          );

          return (
            <Tooltip key={key} title={t(key)} {...tooltipProps}>
              {item}
            </Tooltip>
          );
        })}
      </List>

      {/* Bottom Component */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: `1px solid ${palette.slate[200]}`,
          px: `${LIST_PX}px`, // same padding collapsed or expanded
          py: 2,
          mt: "auto",
        }}
      >
        <Tooltip
          title={`${t("mobile-activate")} — ${statusText}`}
          placement="right"
          disableHoverListener={!collapsed}
          disableFocusListener={!collapsed}
          disableTouchListener={!collapsed}
        >
          <Box
            onClick={() => setMobileActivateOpen(true)}
            sx={{
              display: "flex",
              alignItems: "center",
              height: 44,
              width: "100%",
              overflow: "hidden",
              border: "1.5px solid",
              borderColor: palette.slate[200],
              borderRadius: "10px",
              bgcolor: "#FFFFFF",
              cursor: "pointer",
              // collapsed: centers the 12px dot in the collapsed rail; expanded: tighter gap
              pl: collapsed ? `${ITEM_PX + (ICON_SIZE - 12) / 2 - 1.5}px` : `${LIST_PX}px`,
              pr: `${ITEM_PX}px`,
              transition: "background-color 0.15s ease, border-color 0.15s ease",
              "&:hover": {
                bgcolor: palette.hover[10],
                borderColor: palette.slate[300],
              },
            }}
          >
            <Circle
              size={12}
              strokeWidth={2.5}
              color={isLinked ? "#00875A" : palette.slate[400]}
              style={{
                flexShrink: 0,
                backgroundColor: isLinked ? palette.success.active : "transparent",
                borderRadius: "50%",
              }}
            />
            <Typography
              sx={{
                ml: 1.25,
                flex: collapsed ? "0 0 auto" : "1 1 auto",
                minWidth: 0,
                fontSize: font.size.sm,
                fontWeight: font.weight.medium,
                color: palette.slate[700],
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 160,
                transition: `opacity 0.2s ${EASE}, max-width ${DURATION} ${EASE}`,
              }}
            >
              {t("mobile-activate")}
            </Typography>
            <Box
              sx={{
                ml: "auto",
                px: 1.25,
                py: 1.35,
                bgcolor: isLinked ? "#E6F9F0" : palette.slate[100],
                border: "1.5px solid",
                borderColor: isLinked ? "#7FE3B5" : palette.slate[300],
                borderRadius: "5px",
                color: isLinked ? "#065F46" : palette.slate[500],
                fontSize: font.size.xs,
                fontWeight: font.weight.bold,
                letterSpacing: "0.5px",
                lineHeight: 1.2,
                textTransform: "uppercase",
                flexShrink: 0,
                opacity: collapsed ? 0 : 1,
                transition: `opacity 0.2s ${EASE}`,
              }}
            >
              {statusText}
            </Box>
          </Box>
        </Tooltip>

        {/* Help & Support Link (disabled)
        <Tooltip title={t("help")} {...tooltipProps}>
          <ListItemButton
            component={Link}
            href="/help"
            sx={{
              ...itemBaseSx,
              mt: 1,
              color: isHelpActive ? palette.primary[40] : palette.slate[700],
              bgcolor: isHelpActive ? palette.hover[10] : "transparent",
              "&:hover": { bgcolor: palette.hover[10], color: palette.slate[900] },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: "inherit", justifyContent: "center" }}>
              <ListCollapse size={20} strokeWidth={2} />
            </ListItemIcon>
            <ListItemText primary={t("help")} sx={labelSx(collapsed)} />
          </ListItemButton>
        </Tooltip>
        */}
      </Box>

      <MobileBindingDialog open={mobileActivateOpen} linked={Boolean(bindingState?.linked)} deviceModel={bindingState?.deviceModel} lastSeenAt={bindingState?.lastSeenAt} onClose={handleCloseMobileBinding} />

      <ActivateAppPromptDialog open={activatePromptOpen} onClose={handleCloseActivatePrompt} onGetStarted={handleGetStartedActivate} />
    </Box>
  );
}