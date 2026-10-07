"use client";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
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
import { alpha } from "@mui/material/styles";
import { ActivateAppPromptDialog, MobileBindingDialog, useCurrentDeviceBindingQuery } from "@/features/bind";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from "@/theme/layout";
import { font, palette, radius } from "@/theme/palette";
import { ArrowLeftRight, ChevronDown, ChevronUp, Circle, CircleDollarSign, CreditCard, HandCoins, ListCollapse, Shield, SquareCheckBig, Store, UsersRound } from "lucide-react";
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
  { key: "dashboard", href: "/dashboard", Icon: DashboardOutlinedIcon },
  {
    key: "approvalRequests",
    href: "/approval-workflow/requests",
    Icon: SquareCheckBig,
    permissions: [CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW],
  },
  {
    key: "Account",
    href: "/account",
    Icon: CreditCard,
    permissions: Object.values(CLIENT_PERMISSIONS.ACCOUNT),
  },
  {
    key: "Limits",
    href: "/limits",
    Icon: CreditCard,
    permissions: Object.values(CLIENT_PERMISSIONS.TRANSACTION_LIMIT),
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
    Icon: ArrowLeftRight,
    // Not in CLIENT_PERMISSIONS — confirmed codes are payment.transfer.{create,approve},
    // no transfer.view code exists yet; not substituting since create/approve is a
    // different scope than view.
    permissions: Object.values(CLIENT_PERMISSIONS.TRANSFER),
  },
  {
    key: "Payments",
    href: "/client-dashboard",
    Icon: CircleDollarSign,
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
    key: "Merchant",
    href: "/client-dashboard",
    Icon: Store,
    // Not in CLIENT_PERMISSIONS — no confirmed backend code for this module yet.
    permissions: Object.values(CLIENT_PERMISSIONS.MERCHANT),
  },
  {
    key: "Administrator",
    href: "/client-dashboard",
    Icon: Shield,
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

  const user = useAppSelector((state) => state.auth.user);
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

  const visibleNavItems = NAV_ITEMS.map((navItem) => {
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
        top: 0,
        height: "100vh",
        transition: "width 200ms ease",
        overflowX: "hidden",
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          p: 0,
          bgcolor: "#F5F7FA",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          flexShrink: 0,
          px: !collapsed ? { xs: 1.5, sm: 2 } : 1,
          transition: "max-width 0.2s ease-in-out, padding 0.2s ease-in-out",

          // outline drawn inside the box
          outline: "2px solid",
          outlineColor: alpha("#0000", 0.1),
          outlineOffset: "-2px",
        }}
      >
        <Image
          src="/branding/BiKTECH.png"
          alt="SME Bank"
          loading="eager"
          priority
          // High base resolution for crisp rendering
          width={200}
          height={200}
          style={{
            width: "100%",
            height: "60%",
            objectFit: "contain",
            transition: "all 0.2s ease-in-out",
          }}
        />
      </Box>

      {/* Navigation */}
      <List sx={{
        pl: collapsed ? 5 : 6, pr: collapsed ? 5 : 6, flex: 1, overflowY: "auto", borderRight: "2px solid",
        borderRightColor: alpha("#000", 0.1),
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
                  borderRadius: `${radius.xl}px`,
                  mb: 0.5,
                  minHeight: 44,
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: collapsed ? 1.5 : 2,
                  color: childActive ? palette.black30 : palette.black30,
                  pr: 4,
                  pl: 4,
                  bgcolor: childActive ? palette.white50 : "transparent",
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: palette.hover[10],
                    color: palette.primary[40],
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 1 : 1.5,
                    justifyContent: "center",
                    color: "inherit",
                  }}
                >
                  <Icon fontSize="small" size={20} sx={{ width: 20, height: 20 }} />
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
                    {childActive && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: palette.success.main,
                          flexShrink: 0,
                          ml: "auto",
                          mr: 1,
                        }}
                      />
                    )}
                    {isOpen ? <ChevronUp size={16} style={{ flexShrink: 0 }} /> : <ChevronDown size={16} style={{ flexShrink: 0 }} />}
                  </>
                )}
              </ListItemButton>
            );

            return (
              <Box key={key}>
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
                              borderRadius: `${radius.xl}px`,
                              mb: 0.5,
                              minHeight: 40,
                              pl: 9,
                              pr: 4,

                              color: childIsActive ? palette.primary[40] : palette.primary[40],
                              bgcolor: childIsActive ? palette.hover[10] : palette.white50,
                              "&:hover": {
                                bgcolor: palette.hover[10],
                                color: palette.primary[40],
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
                borderRadius: `${radius.xl}px`,
                mb: 0.5,
                minHeight: 44,

                justifyContent: collapsed ? "center" : "flex-start",
                px: collapsed ? 1.5 : 2,
                color: active ? palette.primary[40] : palette.black30,
                pr: 4,
                pl: 4,
                bgcolor: active ? palette.hover[10] : palette.white50,
                "&:hover": {
                  bgcolor: palette.hover[10],
                  color: palette.primary[40],
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: collapsed ? 1 : 1.5,
                  justifyContent: "center",
                  color: "inherit",
                }}
              >
                <Icon fontSize="small" size={20} sx={{ width: 20, height: 20 }} />
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

              {active && !collapsed && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: palette.success.main,
                    flexShrink: 0,
                    ml: "auto",
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
          outline: "2px solid",
          outlineColor: alpha("#0000", 0.1),
          outlineOffset: "-2px",
          px: collapsed ? 1.5 : 2,
          py: 2,
          mt: "auto",
        }}
      >
        {collapsed ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "start", gap: 1 }}>
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
                  size={18}
                  strokeWidth={2.5}
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 ,padding:"5px"}}>
            {/* Mobile Activate Card */}
            <Box
              onClick={() => setMobileActivateOpen(true)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1.5px solid",
                borderColor: palette.slate[200],
                borderRadius: "12px",
                px: 2,
                py: 1.25,
                bgcolor: "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: "#F8FAFC",
                  borderColor: palette.slate[300],
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 ,padding:"8px"}}>
                <Circle
                  size={18}
                  strokeWidth={2.5}
                  color={isLinked ? "#00875A" : palette.slate[400]}
                  style={{ flexShrink: 0 }}
                />
                <Typography
                  sx={{
                    fontSize: "15px",
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
                  py: 0.35,
                  bgcolor: isLinked ? "#E6F9F0" : palette.slate[100],
                  border: "1.5px solid",
                  borderColor: isLinked ? "#7FE3B5" : palette.slate[300],
                  borderRadius: "8px",
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
                      fontSize: "15px",
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

      <MobileBindingDialog  open={mobileActivateOpen} linked={Boolean(bindingState?.linked)} deviceModel={bindingState?.deviceModel} lastSeenAt={bindingState?.lastSeenAt} onClose={() => setMobileActivateOpen(false)} />

      <ActivateAppPromptDialog open={activatePromptOpen} onClose={handleCloseActivatePrompt} onGetStarted={handleGetStartedActivate} />
    </Box>
  );
}
