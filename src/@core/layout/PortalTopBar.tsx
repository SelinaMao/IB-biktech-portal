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
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { useAuth } from "@/features/auth";
import { toggleHideAmount } from "@/store/global/global.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { TOPBAR_HEIGHT } from "@/theme/layout";
import { font, padding, palette } from "@/theme/palette";
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
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import Badge from "@mui/material/Badge";
import Image from "next/image";

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

export type PortalTopBarProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
  hideAmount?: boolean;
  onToggleHideAmount?: () => void;
};

/**
 * White top bar: sidebar toggle · language switcher · user menu (logout).
 * Colors come from the theme (paper background, divider border) — no
 * hardcoded values here.
 */

export default function PortalTopBar({ collapsed, onToggleSidebar, hideAmount, onToggleHideAmount }: PortalTopBarProps) {
  const t = useTranslations("topbar");
  const router = useRouter();
  const { logout } = useAuth();
  const user = useAppSelector((state) => state.auth.user);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const closeSettingsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Local state fallback if prop/context is not passed
  const [localHideAmount, setLocalHideAmount] = useState(false);

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

  const isHidden = onToggleHideAmount ? hideAmount : localHideAmount;

  // Set hide amount
  const dispatch = useAppDispatch();

  const handleToggle = onToggleHideAmount ? () => dispatch(toggleHideAmount()) : () => setLocalHideAmount((prev) => !prev);

  const initials = (user?.name ?? "?")
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
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ minHeight: `${TOPBAR_HEIGHT}px !important`, gap: "17px" }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            edge="start"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            sx={{
              padding: 0,
            }}
          >
            <Image src={collapsed ? "/assets/icons/expand.svg" : "/assets/icons/collapse.svg"} alt="Toggle Collapse Menu" width={40} height={40} />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: palette.navy[800] }}>
            SME Bank <span style={{ color: palette.primary.main }}>Biz</span>
          </Typography>
        </Stack>

        <Box sx={{ flex: 1 }} />
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: "center",
            cursor: "pointer",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            height: 40,
            px: 2,
            bgcolor: "white",
          }}
          onClick={handleToggle}
        >
          {" "}
          {isHidden ? (
            <>
              <Visibility sx={{ fontSize: 20, color: palette.slate[500] }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Show
              </Typography>
            </>
          ) : (
            <>
              <VisibilityOff sx={{ fontSize: 20, color: palette.slate[500] }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Hide
              </Typography>
            </>
          )}
        </Stack>

        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: "center",
            cursor: "pointer",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            height: 40,
            px: 2,
            bgcolor: "white",
          }}
        >
          <IconButton
            sx={{ p: 0, color: palette.slate[500] }}
            aria-label="Notifications"
            onClick={(e) => setNotifAnchorEl(e.currentTarget)}
          >
            <Badge badgeContent={NOTIFICATIONS.length} color="error">
              <NotificationsNoneRounded sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>
        </Stack>

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
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: `${padding.xl}px`, borderBottom: 1, borderColor: "divider" }}
          >
            <Typography sx={{ fontWeight: font.weight.semibold, fontSize: font.size.xl }}>
              Notifications
            </Typography>
            <IconButton size="small" onClick={() => setNotifAnchorEl(null)} aria-label="Close notifications">
              <CloseRounded sx={{ fontSize: 18, color: palette.slate[500] }} />
            </IconButton>
          </Stack>

          <Stack sx={{ maxHeight: 340, overflowY: "auto" }}>
            {NOTIFICATIONS.map((notif, index) => (
              <Box key={notif.id}>
                <Stack direction="row" spacing={4} sx={{ p: `${padding.xl}px` }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      fontSize: font.size.sm,
                      color: palette.white,
                      bgcolor: palette.navy[800],
                    }}
                  >
                    {initials}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      <Typography
                        sx={{
                          fontSize: font.size.xs,
                          fontWeight: font.weight.semibold,
                          color: "text.secondary",
                          textTransform: "uppercase",
                          letterSpacing: 0.4,
                        }}
                      >
                        {notif.category}
                      </Typography>
                      <Typography sx={{ fontSize: font.size.xs, color: "text.secondary", whiteSpace: "nowrap" }}>
                        {notif.time}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: "text.primary", mt: 0.5 }}>
                      {notif.title}
                    </Typography>
                    {notif.description && (
                      <Typography sx={{ fontSize: font.size.sm, color: "text.secondary", mt: 0.25 }}>
                        {notif.description}
                      </Typography>
                    )}
                  </Box>
                </Stack>
                {index < NOTIFICATIONS.length - 1 && <Divider />}
              </Box>
            ))}
          </Stack>
        </Popover>

        <SwitchLanguageMenu />

        <Divider
          orientation="vertical"
          flexItem
          sx={{
            display: { xs: "none", md: "block" },
            margin: 0,
            height: 40,
            alignSelf: "center",
            borderColor: "#EDEDEC",
            borderRightWidth: "2px",
          }}
        />

        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          gap={1}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 34,
              height: 34,
              fontSize: font.size.md,
              color: palette.white,
              bgcolor: palette.navy[800],
            }}
          >
            {initials}
          </Avatar>

          <Box sx={{ display: { xs: "none", md: "block" }, lineHeight: 1.2, ml: "8px" }}>
            <Typography
              sx={{
                fontWeight: font.weight.semibold,
                color: "text.primary",
                fontSize: 13,
              }}
            >
              {user?.name}
            </Typography>
            <Typography variant="caption">{user?.roles?.[0]?.name || "ADMIN"}</Typography>
          </Box>

          <KeyboardArrowDownRounded
            sx={{
              fontSize: 18,
              color: "text.secondary",
              transition: "transform 0.15s ease",
              transform: Boolean(anchorEl) ? "rotate(180deg)" : "none",
            }}
          />
        </Stack>

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
                overflow: "hidden",
                ul: {
                  py: 0,
                },
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
            <ListItemIcon>
              <PersonOutlineRounded fontSize="small" />
            </ListItemIcon>
            <Box component="span" sx={{ flex: 1 }}>
              {t("profile")}
            </Box>
            <ChevronRightRounded fontSize="small" sx={{ color: "text.secondary" }} />
          </MenuItem>

          <MenuItem
            sx={{ py: 1.5, gap: 1.25, bgcolor: Boolean(settingsAnchorEl) ? "action.hover" : undefined }}
            onMouseEnter={openSettingsSubmenu}
            onMouseLeave={scheduleCloseSettingsSubmenu}
            onClick={openSettingsSubmenu}
          >
            <ListItemIcon>
              <SettingsOutlined fontSize="small" />
            </ListItemIcon>
            <Box component="span" sx={{ flex: 1 }}>
              {t("settings")}
            </Box>
            <ChevronRightRounded fontSize="small" sx={{ color: "text.secondary" }} />
          </MenuItem>

          <MenuItem sx={{ py: 1.5, gap: 1.25 }} onClick={closeUserMenu}>
            <ListItemIcon>
              <LockOutlined fontSize="small" />
            </ListItemIcon>
            <Box component="span" sx={{ flex: 1 }}>
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
            <ListItemIcon sx={{ color: "inherit" }}>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {t("logout")}
          </MenuItem>
        </Menu>

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
      </Toolbar>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </AppBar>
  );
}
