"use client";

import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Paper from "@mui/material/Paper";
import Popover from "@mui/material/Popover";
import Popper from "@mui/material/Popper";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Bell, ChevronLeft, ChevronsLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useTopBar } from "./TopBarContext";
import { useAuth } from "@/features/auth";
import { toggleHideAmount } from "@/store/global/global.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "@/theme/layout";
import { font, palette } from "@/theme/palette";
import { SwitchLanguageMenu } from "@core/components/SwitchLanguageMenu";
import {
  ChevronRightRounded,
  CloseRounded,
  KeyboardArrowDownRounded,
  LockOutlined,
  NotificationsNoneRounded,
  PersonOutlineRounded,
  SettingsOutlined,
  TuneRounded,
} from "@mui/icons-material";

import ProfilePanel from "./ProfilePanel";

type NotificationItem = {
  id: string;
  category: string;
  time: string;
  title: string;
  description?: string;
};

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    category: "Account Activity",
    time: "4:50 PM",
    title: "You received 30.00 USD from Sok Sambo",
  },
  {
    id: "2",
    category: "Account Activity",
    time: "4:50 PM",
    title: "Your $50.00 purchase of payment is complete.",
    description: "Your payment purchase is now available for $50.00.",
  },
  {
    id: "3",
    category: "Account Activity",
    time: "4:50 PM",
    title: "Your $50.00 purchase of payment is complete.",
    description: "Your payment purchase is now available for $50.00.",
  },
  {
    id: "4",
    category: "Account Activity",
    time: "4:50 PM",
    title: "Your $50.00 purchase of payment is complete.",
    description: "Your payment purchase is now available for $50.00.",
  },
];

const ROUTE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Dashboard" },
  { prefix: "/transfer", title: "Transfer" },
  { prefix: "/approval", title: "Approvals" },
  { prefix: "/approval-workflow/requests", title: "Approvals" },
  { prefix: "/approval-workflow/approvers", title: "Approver" },
  { prefix: "/approval-workflow", title: "Approval Matrix" },
  { prefix: "/account", title: "Accounts" },
  { prefix: "/loan", title: "Loan" },
  { prefix: "/limits", title: "Limits" },
  { prefix: "/users", title: "Users" },
  { prefix: "/rbac", title: "Roles & Permissions" },
  { prefix: "/help", title: "Help & Support" },
  { prefix: "/payments", title: "Payments" },
  { prefix: "/schedule", title: "Schedule" },
  { prefix: "/payroll", title: "Payroll" },
  { prefix: "/merchant", title: "Merchant" },
  { prefix: "/components", title: "Components" },
];

export type PortalTopBarProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
  hideAmount?: boolean;
  onToggleHideAmount?: () => void;
  title?: string;
};

/**
 * Top bar: Left panel toggle icon + BiKTECH Solution logo.
 * Right: Notification bell · Language switcher · User profile.
 */
export default function PortalTopBar({
  collapsed,
  onToggleSidebar,
  hideAmount,
  onToggleHideAmount,
  title: customTitle,
}: PortalTopBarProps) {
  const t = useTranslations("topbar");
  const pathname = usePathname();
  const pageTitle = useMemo(() => {
    if (customTitle) return customTitle;
    if (!pathname) return "";
    const matched = ROUTE_TITLES.find((r) => pathname.startsWith(r.prefix));
    return matched ? matched.title : "";
  }, [pathname, customTitle]);
  const router = useRouter();
  const { breadcrumb } = useTopBar();

  const handleBack = () => {
    if (breadcrumb?.onBack) {
      breadcrumb.onBack();
    } else if (breadcrumb?.backHref) {
      router.push(breadcrumb.backHref);
    } else {
      router.back();
    }
  };

  const { logout } = useAuth();
  const user = useAppSelector((state) => state.auth.user);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const closeSettingsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelCloseSettings = () => {
    if (closeSettingsTimeout.current) {
      clearTimeout(closeSettingsTimeout.current);
      closeSettingsTimeout.current = null;
    }
  };
  const openSettingsSubmenu = (e: React.MouseEvent<HTMLElement>) => {
    cancelCloseSettings();
    setSettingsAnchorEl(e.currentTarget);
  };
  const scheduleCloseSettingsSubmenu = () => {
    closeSettingsTimeout.current = setTimeout(() => setSettingsAnchorEl(null), 150);
  };
  const closeUserMenu = () => {
    setAnchorEl(null);
    setSettingsAnchorEl(null);
  };

  const initials = (user?.name ?? "RS")
    .split(" ")
    .map((part: string) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        color: "text.primary",
        borderBottom: `1px solid ${palette.slate[200]}`,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: `${TOPBAR_HEIGHT}px !important`,
          pr: { xs: 2, sm: 3 },
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Left Side: Toggle Icon + Logo + Full-Height Vertical Ruler to the right of logo */}
        <Box
          sx={{
            width: {
              xs: "auto",
              sm: `${collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px`,
            },
            minWidth: {
              xs: 0,
              sm: `${collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px`,
            },
            maxWidth: {
              xs: "none",
              sm: `${collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px`,
            },
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: `${TOPBAR_HEIGHT}px`,
            px: collapsed ? 1 : { xs: 2, sm: 6.5 },
            borderRight: { xs: "none", sm: `1px solid ${palette.slate[200]}` },
            flexShrink: 0,
            transition: "width 200ms ease, min-width 200ms ease, max-width 200ms ease, padding 200ms ease",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => router.push("/dashboard")}
          >
            {collapsed ? (
              <Image
                src="/branding/BikTech Official Logo 2.png"
                alt="BiKTECH"
                width={50}
                height={50}
                style={{
                  marginLeft: "10px",
                  height: "50px",
                  width: "50px",
                  objectFit: "contain",
                }}
                priority
              />
            ) : (
              <Image
                src="/branding/BiKTECH.png"
                alt="BiKTECH Solution"
                width={140}
                height={28}
                style={{
                  height: "28px",
                  width: "auto",
                  objectFit: "contain",
                }}
                priority
              />
            )}
          </Box>
          <IconButton
            edge="start"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            sx={{
              marginTop: "2px",
              marginLeft: collapsed ? "5px" : "0px",
              p: collapsed ? 0 : 1.75,
              color: palette.slate[700],
              borderRadius: "8px",
              flexShrink: 0,
              transition: "background-color 0.15s ease",
              // "&:hover": {
              //   bgcolor: palette.slate[100],
              // },
            }}
          >
            {collapsed ? <Image
              src="/assets/icons/double_arrow_left.svg"
              alt="double_right"
              width={140}
              height={28}
              style={{
                height: "22px",
                width: "auto",
                objectFit: "contain",
              }}
              priority
            /> : <Image
              src="/assets/icons/double_arrow_right.svg"
              alt="double_right"
              width={140}
              height={28}
              style={{
                height: "28px",
                width: "auto",
                objectFit: "contain",
              }}
              priority
            />}
          </IconButton>
        </Box>

        {/* Page / Section Title or Breadcrumbs */}
        {breadcrumb ? (
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ pl: 2.5 }}>
            {/* Circular Back Button */}
            <IconButton
              size="small"
              onClick={handleBack}
              aria-label="Back"
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: "#EEF2F6",
                color: "#334155",
                p: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.15s ease",
                "&:hover": {
                  bgcolor: "#E2E8F0",
                },
              }}
            >
              <ChevronLeft size={18} />
            </IconButton>

            {/* Prefix (e.g. Accounts) */}
            <Typography
              onClick={handleBack}
              sx={{
                fontSize: "15px",
                fontWeight: 500,
                color: "#94A3B8",
                cursor: "pointer",
                lineHeight: 1.2,
                "&:hover": {
                  color: "#0F172A",
                },
              }}
            >
              {breadcrumb.prefix}
            </Typography>

            {/* Separator Slash */}
            <Typography
              sx={{
                fontSize: "16px",
                color: "#94A3B8",
                fontWeight: 400,
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              /
            </Typography>

            {/* SubPrefix (e.g. Account Information) */}
            <Typography
              sx={{
                fontSize: "17px",
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              {breadcrumb.subPrefix}
            </Typography>
          </Stack>
        ) : pageTitle ? (
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ pl: 2.5 }}>
            {/* <IconButton
              size="small"
              aria-label="Back"
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: "#EEF2F6",
                color: "#334155",
                p: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.15s ease",
                "&:hover": {
                  bgcolor: "#E2E8F0",
                },
              }}
            >
              <ChevronLeft size={18} />
            </IconButton> */}
            <Typography
              sx={{
                padding: "10px",
                fontSize: "17px",
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              {pageTitle}
            </Typography>
          </Stack>
        ) : null}

        <Box sx={{ flex: 1 }} />

        {/* Right Side: Notification + Language + Profile */}
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Notification Bell */}
          <Box
            onClick={(e) => setNotifAnchorEl(e.currentTarget)}
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              bgcolor: palette.slate[100],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              transition: "background-color 0.15s ease",
              "&:hover": {
                bgcolor: palette.slate[200],
              },
            }}
          >
            <Bell />
            <Box
              sx={{
                position: "absolute",
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                borderRadius: "50%",
                bgcolor: "#E11D48",
                color: "#FFFFFF",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 0.5,
                border: "2px solid #FFFFFF",
              }}
            >
              10
            </Box>
          </Box>

          <Popover
            open={Boolean(notifAnchorEl)}
            anchorEl={notifAnchorEl}
            onClose={() => setNotifAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  mt: 1,
                  width: 360,
                  maxHeight: 420,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  boxShadow: "0 6px 16px rgba(16,24,40,0.08)",
                  overflow: "hidden",
                },
              },
            }}
          >
            <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
            </Box>
            <Box sx={{ maxHeight: 340, overflowY: "auto" }}>
              {NOTIFICATIONS.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:hover": { bgcolor: "action.hover" },
                    cursor: "pointer",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600 }}>
                      {item.category}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {item.time}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {item.title}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Popover>

          {/* Language Switcher */}
          <SwitchLanguageMenu />

          {/* User Profile */}
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              cursor: "pointer",
              gap: 1.25,
            }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                bgcolor: "#E2E8F0",
                color: "#1E293B",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {initials || "RS"}
            </Avatar>

            <Box sx={{ display: { xs: "none", md: "block" }, lineHeight: 1.2 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: palette.slate[900],
                  fontSize: 13,
                  lineHeight: 1.2,
                }}
              >
                Shiiping co., ltd
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  color: palette.slate[500],
                  lineHeight: 1.2,
                  mt: 0.25,
                }}
              >
                {user?.name || "Rous Samol"} - {user?.roles?.[0]?.name || "Admin"}
              </Typography>
            </Box>


          </Stack>

          {/* User Menu Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={closeUserMenu}
            disableAutoFocusItem
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  mt: 1,
                  minWidth: 224,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 6px 16px rgba(16,24,40,0.08)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  ul: { py: 0 },
                },
              },
            }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              sx={{ py: 1.5, gap: 1.25 }}
              onClick={() => {
                closeUserMenu();
                setProfileOpen(true);
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: palette.slate[700],
                }}
              >
                <PersonOutlineRounded fontSize="small" />
              </ListItemIcon>
              <Box component="span" sx={{ flex: 1, fontSize: 14 }}>
                {t("profile")}
              </Box>
              <ChevronRightRounded fontSize="small" sx={{ color: "text.secondary" }} />
            </MenuItem>

            <MenuItem
              sx={{
                py: 1.5,
                gap: 1.25,
                bgcolor: Boolean(settingsAnchorEl) ? "action.hover" : undefined,
              }}
              onMouseEnter={openSettingsSubmenu}
              onMouseLeave={scheduleCloseSettingsSubmenu}
              onClick={openSettingsSubmenu}
            >
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: palette.slate[700],
                }}
              >
                <SettingsOutlined fontSize="small" />
              </ListItemIcon>
              <Box component="span" sx={{ flex: 1, fontSize: 14 }}>
                {t("settings")}
              </Box>
              <ChevronRightRounded fontSize="small" sx={{ color: "text.secondary" }} />
            </MenuItem>

            <MenuItem sx={{ py: 1.5, gap: 1.25 }} onClick={closeUserMenu}>
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: palette.slate[700],
                }}
              >
                <LockOutlined fontSize="small" />
              </ListItemIcon>
              <Box component="span" sx={{ flex: 1, fontSize: 14 }}>
                {t("changePassword")}
              </Box>
              <ChevronRightRounded fontSize="small" sx={{ color: "text.secondary" }} />
            </MenuItem>

            <Divider sx={{ my: 0.5 }} />

            <MenuItem
              sx={{ py: 1.5, gap: 1.25, color: "error.main" }}
              onClick={() => {
                closeUserMenu();
                void logout();
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
                <LogoutOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <Box component="span" sx={{ fontSize: 14, fontWeight: 500 }}>
                {t("logout")}
              </Box>
            </MenuItem>
          </Menu>

          {/* Settings Submenu */}
          <Popper
            open={Boolean(anchorEl) && Boolean(settingsAnchorEl)}
            anchorEl={settingsAnchorEl}
            placement="right-start"
            modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
            sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
          >
            <Paper
              elevation={0}
              onMouseEnter={cancelCloseSettings}
              onMouseLeave={scheduleCloseSettingsSubmenu}
              sx={{
                minWidth: 240,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 6px 16px rgba(16,24,40,0.08)",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <MenuList sx={{ py: 0 }}>
                <MenuItem
                  sx={{ py: 1.5, gap: 1.25 }}
                  onClick={() => {
                    closeUserMenu();
                    router.push("/limits");
                  }}
                >
                  <ListItemIcon>
                    <TuneRounded fontSize="small" />
                  </ListItemIcon>
                  <Box component="span" sx={{ flex: 1 }}>
                    {t("limitManagement")}
                  </Box>
                  <ChevronRightRounded fontSize="small" sx={{ color: "text.secondary" }} />
                </MenuItem>
                <MenuItem sx={{ py: 1.5, gap: 1.25 }} onClick={closeUserMenu}>
                  <ListItemIcon>
                    <NotificationsNoneRounded fontSize="small" />
                  </ListItemIcon>
                  <Box component="span" sx={{ flex: 1 }}>
                    {t("notificationsManagement")}
                  </Box>
                  <ChevronRightRounded fontSize="small" sx={{ color: "text.secondary" }} />
                </MenuItem>
              </MenuList>
            </Paper>
          </Popper>
        </Stack>
      </Toolbar>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </AppBar>
  );
}
