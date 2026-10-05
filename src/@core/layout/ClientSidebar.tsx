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
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ActivateAppPromptDialog, MobileBindingDialog, useCurrentDeviceBindingQuery } from "@/features/bind";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from "@/theme/layout";
import { font, palette, radius } from "@/theme/palette";
import { MobileFriendlyOutlined } from "@mui/icons-material";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import { ArrowLeftRight, ChevronDown, ChevronUp, CircleDollarSign, CreditCard, HandCoins, Shield, SquareCheckBig, Store, UsersRound } from "lucide-react";
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
  const tBinding = useTranslations("mobileBinding");
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

  const bottomItems = [
    {
      key: "mobile-activate",
      Icon: MobileFriendlyOutlined,
      onClick: () => setMobileActivateOpen(true),
    },
    {
      key: "help",
      href: "/help",
      Icon: HelpOutlineOutlinedIcon,
    },
    // {
    //   key: "logout",
    //   Icon: LogoutOutlinedIcon,
    //   onClick: async () => {
    //     try {
    //       await logout();
    //     } catch (err) {
    //       console.error("Logout failed:", err);
    //     }
    //   },
    // },
  ];

  return (
    <Box
      component="nav"
      sx={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        bgcolor: palette.info[900],
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
          p: 6,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: !collapsed ? { xs: 2, md: 3 } : 1.5,
          px: !collapsed ? { xs: 1.5, sm: 2 } : 1,
          flexShrink: 0,
          width: "100%",
          // Dynamic container sizing based on viewport + collapsed state
          maxWidth: !collapsed ? { xs: 130, sm: 140, md: 160, lg: 200 } : { xs: 36, md: 44 },
          mx: "auto",
          transition: "max-width 0.2s ease-in-out, padding 0.2s ease-in-out",
        }}
      >
        <Image
          src="/branding/logo-gold.png"
          alt="SME Bank"
          loading="eager"
          priority
          // High base resolution for crisp rendering
          width={200}
          height={200}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            transition: "all 0.2s ease-in-out",
          }}
        />
      </Box>

      {/* Navigation */}
      <List sx={{ pl: collapsed ? 5 : 6, pr: collapsed ? 5 : 6, flex: 1, overflowY: "auto" }}>
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
                  color: childActive ? palette.white : palette.navy[300],
                  pr: 4,
                  pl: 4,
                  bgcolor: childActive ? palette.white50 : "transparent",
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: palette.white50,
                    color: palette.white,
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
                              color: childIsActive ? palette.white : palette.navy[300],
                              "&:hover": {
                                bgcolor: palette.white50,
                                color: palette.white,
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
                color: active ? palette.white : palette.navy[300],
                pr: 4,
                pl: 4,
                bgcolor: active ? palette.white50 : "transparent",
                "&:hover": {
                  bgcolor: palette.white50,
                  color: palette.white,
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
          border: `1px solid ${palette.primary.main}`,
          borderRadius: `${radius.xl}px`,
          mx: collapsed ? 1 : 4,
          mb: 1.5,
          p: collapsed ? 1 : 1.5,
          px: collapsed ? 1 : 3,
          mt: "auto",
        }}
      >
        <List sx={{ p: 0 }}>
          {bottomItems.map((itemData) => {
            const { key, href, Icon, onClick } = itemData;
            const hasHref = typeof href === "string";
            const isMobileActivation = key === "mobile-activate";
            const bindingStateLabel = bindingStateLoading ? tBinding("state.checking") : bindingState?.linked ? tBinding("state.linked") : tBinding("state.notLinked");
            const item = (
              <ListItemButton
                key={key}
                component={hasHref ? Link : "div"}
                href={hasHref ? href : undefined}
                onClick={onClick}
                sx={{
                  borderRadius: `${radius.xl}px`,
                  // minHeight: 44,
                  minWidth: 80,
                  py: 1,
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: collapsed ? 1.5 : 2,
                  color: palette.navy[300],
                  mb: 0.5,
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: palette.white50,
                    color: palette.white,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 1.5,
                    justifyContent: "center",
                    color: "inherit",
                  }}
                >
                  {isMobileActivation ? (
                    <Badge variant="dot" color={bindingState?.linked ? "success" : "default"} overlap="circular" invisible={bindingStateLoading}>
                      <Icon fontSize="small" />
                    </Badge>
                  ) : (
                    <Icon fontSize="small" />
                  )}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={t(key)}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: font.size.md,
                          fontWeight: font.weight.medium,
                          whiteSpace: "nowrap",
                        },
                      },
                      secondary: isMobileActivation
                        ? {
                            sx: {
                              color: bindingState?.linked ? palette.success[300] : palette.navy[300],
                              fontSize: font.size.xs,
                            },
                          }
                        : undefined,
                    }}
                    secondary={isMobileActivation ? bindingStateLabel : undefined}
                  />
                )}
              </ListItemButton>
            );

            return collapsed ? (
              <Tooltip key={key} title={isMobileActivation ? `${t(key)} — ${bindingStateLabel}` : t(key)} placement="right">
                {item}
              </Tooltip>
            ) : (
              item
            );
          })}
        </List>
      </Box>

      <MobileBindingDialog open={mobileActivateOpen} linked={Boolean(bindingState?.linked)} deviceModel={bindingState?.deviceModel} lastSeenAt={bindingState?.lastSeenAt} onClose={() => setMobileActivateOpen(false)} />

      <ActivateAppPromptDialog open={activatePromptOpen} onClose={handleCloseActivatePrompt} onGetStarted={handleGetStartedActivate} />
    </Box>
  );
}
