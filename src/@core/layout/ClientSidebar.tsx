"use client";

import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ActivateAppPromptDialog, MobileBindingDialog, useCurrentDeviceBindingQuery } from "@/features/bind";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "@/theme/layout";
import { font, palette, radius } from "@/theme/palette";
import { ArrowLeftRight, BanknoteArrowDown, CalendarSync, ChevronDown, ChevronUp, Circle, CircleDollarSign, CreditCard, Form, HandCoins, LayoutDashboard, LayoutGrid, ListCollapse, ReceiptText, Shield, SquareCheckBig, SquareMenu, Store, UserShield, UsersRound } from "lucide-react";
import { CLIENT_PERMISSIONS, useAuth, useMeQuery } from "@/features/auth";
import { setHideAmount } from "@/store/global/global.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

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
    href: "/client-dashboard",
    Icon: ReceiptText,
    // Not in CLIENT_PERMISSIONS — confirmed codes are payment.payment.{create,approve},
    // no payment.view code exists yet; not substituting since create/approve is a
    // different scope than view.
    permissions: Object.values(CLIENT_PERMISSIONS.PAYMENT),
  },
  {
    key: "Schedule",
    href: "/client-dashboard",
    Icon: CalendarSync,
    // Not in CLIENT_PERMISSIONS — confirmed codes are payment.payment.{create,approve},
    // no payment.view code exists yet; not substituting since create/approve is a
    // different scope than view.
    permissions: Object.values(CLIENT_PERMISSIONS.PAYMENT),
  },
  {
    key: "Payroll",
    href: "/client-dashboard",
    Icon: UsersRound,
    // Not in CLIENT_PERMISSIONS — no confirmed backend code for this module yet.
    permissions: Object.values(CLIENT_PERMISSIONS.PAYROLL),
  },
  {
    key: "Other Services",
    href: "/client-dashboard",
    Icon: SquareMenu,
    // Not in CLIENT_PERMISSIONS — no confirmed backend code for this module yet.
    permissions: Object.values(CLIENT_PERMISSIONS.PAYROLL),
  },
  {
    key: "Merchant",
    href: "/client-dashboard",
    Icon: Store,
    // Not in CLIENT_PERMISSIONS — no confirmed backend code for this module yet.
    permissions: Object.values(CLIENT_PERMISSIONS.MERCHANT),
  },
  {
    key: "Limits",
    href: "/limits",
    Icon: CreditCard,
    permissions: Object.values(CLIENT_PERMISSIONS.TRANSACTION_LIMIT),
  },
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

const renderNavIcon = (Icon: React.ElementType | string, size = 20) => {
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

  useEffect(() => {
    if (collapsed) {
      setExpandedKey(null);
      setClosedActiveKey(null);
    }
  }, [collapsed]);
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
  const handleGetStartedActivate = () => {
    setActivatePromptOpen(false);
    setMobileActivateOpen(true);
  };

  const isLinked = bindingState?.linked ?? true;
  const statusText = isLinked ? "ACTIVE" : bindingStateLoading ? "..." : "INACTIVE";
  const isHelpActive = isPathActive("/help");

  return (
    <Box
      component="nav"
      sx={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        bgcolor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: `${TOPBAR_HEIGHT}px`,
        height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        maxHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        transition: "width 200ms ease",
        overflow: "hidden",
        borderRight: `1px solid ${palette.slate[200]}`,
        zIndex: 10,
      }}
    >
      {/* Navigation */}
      <List sx={{
        px: collapsed ? 1.5 : 2,
        py: 2,
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: collapsed ? "center" : "stretch",
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

            const parentButton = (
              <ListItemButton
                component={collapsed ? Link : "div"}
                href={collapsed ? children[0].href : undefined}
                onClick={collapsed ? undefined : () => (childActive ? setClosedActiveKey((prev) => (prev === key ? null : key)) : setExpandedKey((prev) => (prev === key ? null : key)))}
                sx={{
                  borderRadius: collapsed ? "12px" : `${radius.sm}px`,
                  mb: collapsed ? 1 : 0.5,
                  minHeight: 44,
                  height: 44,
                  flexGrow: 0,
                  flexShrink: 0,
                  width: collapsed ? 44 : "100%",
                  justifyContent: collapsed ? "center" : "flex-start",
                  alignItems: "center",
                  p: collapsed ? 0 : undefined,
                  px: collapsed ? 0 : 4,
                  mx: collapsed ? "auto" : undefined,
                  cursor: "pointer",
                  color: childActive ? palette.primary[40] : palette.black30,
                  bgcolor: childActive ? (collapsed ? "#EBF3FC" : palette.hover[10]) : "transparent",
                  "&:hover": {
                    bgcolor: childActive ? (collapsed ? "#E2EDF9" : palette.hover[10]) : palette.hover[10],
                    color: palette.black30,
                  },
                  // color: childActive ? palette.white : palette.black30,
                  //             bgcolor: childActive ? (collapsed ? palette.primary[40] : palette.primary[40]) : palette.white,
                  //             "&:hover": {
                  //               bgcolor: childActive ? (collapsed ? palette.primary[40] : palette.primary[40]) : palette.primary[40],
                  //               color: childActive ? palette.white : palette.white ,
                  //             },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 1.5,
                    justifyContent: "center",
                    alignItems: "center",
                    color: "inherit",
                  }}
                >
                  {renderNavIcon(Icon, 20)}
                </ListItemIcon>
                {!collapsed && (
                  <>
                    <ListItemText
                      primary={t(key)}
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
                    {isOpen ? <ChevronUp size={16} style={{ flexShrink: 0 }} /> : <ChevronDown size={16} style={{ flexShrink: 0 }} />}
                  </>
                )}
              </ListItemButton>
            );

            return (
              <Box key={key} sx={{ width: collapsed ? 44 : "100%", flexShrink: 0 }}>
                {collapsed ? (
                  <Tooltip title={t(key)} placement="right">
                    {parentButton}
                  </Tooltip>
                ) : (
                  parentButton
                )}
                {!collapsed && (
                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
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
                              bgcolor: childIsActive ? (collapsed ? "#EBF3FC" : palette.primary[40]) : "transparent",
                              "&:hover": {
                                bgcolor: childIsActive ? (collapsed ? palette.primary[40] : palette.primary[40]) : palette.hover[10],
                                color: childIsActive ? palette.white : palette.black30 ,
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
                )}
              </Box>
            );
          }
          const active = isPathActive(href);
          const item = (
            <ListItemButton
              key={key}
              component={Link}
              href={href}
              sx={{
                borderRadius: collapsed ? "8px" : `${radius.sm}px`,
                mb: collapsed ? 1 : 0.5,
                minHeight: 44,
                height: 44,
                flexGrow: 0,
                flexShrink: 0,
                width: collapsed ? 44 : "100%",
                justifyContent: collapsed ? "center" : "flex-start",
                alignItems: "center",
                p: collapsed ? 0: undefined,
                px: collapsed ? 0 : 4,
                mx: collapsed ? "auto" : undefined,
                color: active ? palette.white : palette.black30,
                bgcolor: active ? (collapsed ? palette.primary[40] : palette.primary[40]) : "transparent",
                "&:hover": {
                  bgcolor: active ? (collapsed ? palette.primary[40]: palette.primary[40]) : palette.hover[10],
                  color: active ? palette.white : palette.black30,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 1.5,
                  justifyContent: "center",
                  alignItems: "center",
                  color: "inherit",
                }}
              >
                {renderNavIcon(Icon, 20)}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={t(key)}
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
              )}


            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip key={key} title={t(key)} placement="right">
              {item}
            </Tooltip>
          ) : (
            item
          );
        })}
      </List>

      {/* Bottom Component */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: `1px solid ${palette.slate[200]}`,
          px: collapsed ? 1.5 : 2,
          py: 2,
          mt: "auto",
        }}
      >
        {collapsed ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Tooltip title={`${t("mobile-activate")} — ${statusText}`} placement="right">
              <Box
                onClick={() => setMobileActivateOpen(true)}
                sx={{
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1.5px solid",
                  borderColor: palette.slate[200],
                  borderRadius: "10px",
                  bgcolor: "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: palette.hover[10],
                    borderColor: palette.slate[300],
                  },
                }}
              >
                <Circle
                  size={12}
                  strokeWidth={2.5}
                  style={{ flexShrink: 0, backgroundColor: palette.success.active, borderRadius: "50%" }}
                  color={isLinked ? "#00875A" : palette.slate[400]}
                />
              </Box>
            </Tooltip>
            <Tooltip title={t("help")} placement="right">
              <ListItemButton
                component={Link}
                href="/help"
                sx={{
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "10px",
                  p: 0,
                  color: isHelpActive ? palette.primary[40] : palette.slate[700],
                  bgcolor: isHelpActive ? palette.hover[10] : "transparent",
                  "&:hover": {
                    bgcolor: palette.hover[10],
                    color: palette.slate[900],
                  },
                }}
              >
                <ListCollapse size={20} strokeWidth={2} />
              </ListItemButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Mobile Activate Card */}
            <Box
              onClick={() => setMobileActivateOpen(true)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1.5px solid",
                borderColor: palette.slate[200],
                borderRadius: "10px",
                px: 2,
                py: 2,
                bgcolor: "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: "#F8FAFC",
                  borderColor: palette.slate[300],
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                <Circle
                  size={12}
                  strokeWidth={2.5}
                  color={isLinked ? "#00875A" : palette.slate[400]}
                  style={{ flexShrink: 0, backgroundColor: palette.success.active, borderRadius: "50%" }}
                />
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: font.weight.medium,
                    color: palette.slate[700],
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("mobile-activate")}
                </Typography>
              </Box>

              <Box
                sx={{
                  px: 1.25,
                  py: 1.35,
                  bgcolor: isLinked ? "#E6F9F0" : palette.slate[100],
                  border: "1.5px solid",
                  borderColor: isLinked ? "#7FE3B5" : palette.slate[300],
                  borderRadius: "5px",
                  color: isLinked ? "#065F46" : palette.slate[500],
                  fontSize: "12px",
                  fontWeight: font.weight.bold,
                  letterSpacing: "0.5px",
                  lineHeight: 1.2,
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                {statusText}
              </Box>
            </Box>

            {/* Help & Support Link */}
            <ListItemButton
              component={Link}
              href="/help"
              sx={{
                borderRadius: "10px",
                py: 1,
                px: 1.5,
                color: isHelpActive ? palette.primary[40] : palette.slate[700],
                bgcolor: isHelpActive ? palette.hover[10] : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                "&:hover": {
                  bgcolor: palette.hover[10],
                  color: palette.slate[900],
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  color: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ListCollapse size={20} strokeWidth={2} />
              </ListItemIcon>
              <ListItemText
                primary={t("help")}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "14px",
                      fontWeight: font.weight.medium,
                      color: "inherit",
                      whiteSpace: "nowrap",
                    },
                  },
                }}
              />
            </ListItemButton>
          </Box>
        )}
      </Box>

      <MobileBindingDialog open={mobileActivateOpen} linked={Boolean(bindingState?.linked)} deviceModel={bindingState?.deviceModel} lastSeenAt={bindingState?.lastSeenAt} onClose={() => setMobileActivateOpen(false)} />

      <ActivateAppPromptDialog open={activatePromptOpen} onClose={handleCloseActivatePrompt} onGetStarted={handleGetStartedActivate} />
    </Box>
  );
}
