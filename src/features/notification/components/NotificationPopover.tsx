"use client";

import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";

import { NotificationCategory, NotificationItem } from "../notification.types";
import { palette } from "@/theme/palette";

export interface NotificationPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead?: () => void;
  onItemClick?: (item: NotificationItem) => void;
  onViewAll?: () => void;
}

const CATEGORY_TABS: { key: NotificationCategory; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "TRANSACTION", label: "Transaction" },
  { key: "ALERT", label: "Alert" },
  { key: "ANNOUNCEMENT", label: "Announcement" },
];

export default function NotificationPopover({
  open,
  anchorEl,
  onClose,
  notifications,
  onMarkAllAsRead,
  onItemClick,
  onViewAll,
}: NotificationPopoverProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("ALL");

  const filteredNotifications = useMemo(() => {
    if (activeCategory === "ALL") return notifications;
    return notifications.filter((item) => item.category === activeCategory);
  }, [notifications, activeCategory]);

  const handleItemClick = (item: NotificationItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
    if (item.link) {
      onClose();
      router.push(item.link);
    }
  };

  const handleViewAll = () => {
    onClose();
    onViewAll?.();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            mt: 1.5,
            width: { xs: 340, sm: 390 },
            borderRadius: "16px",
            border: `1px solid ${palette.slate[200]}`,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
            overflow: "hidden",
            bgcolor: "#FFFFFF",
          },
        },
      }}
    >
      {/* Top Header */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.2,
            }}
          >
            Notifications
          </Typography>

          <Typography
            onClick={onMarkAllAsRead}
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#0F172A",
              cursor: "pointer",
              userSelect: "none",
              transition: "color 0.15s ease",
              "&:hover": {
                color: palette.primary.main,
              },
            }}
          >
            Mark all as read
          </Typography>
        </Stack>

        {/* Category Filter Pills */}
        <Box
          sx={{
            mt: 2,
            bgcolor: "#F1F5F9",
            p: "4px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.key;
            return (
              <ButtonBase
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                sx={{
                  flex: 1,
                  py: "6px",
                  px: "10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#FFFFFF" : "#64748B",
                  bgcolor: isActive ? palette.primary.main : "transparent",
                  boxShadow: isActive ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    color: isActive ? "#FFFFFF" : "#0F172A",
                    bgcolor: isActive ? palette.primary.main : "rgba(0,0,0,0.03)",
                  },
                }}
              >
                {tab.label}
              </ButtonBase>
            );
          })}
        </Box>
      </Box>

      {/* Notifications List */}
      <Box
        sx={{
          maxHeight: 380,
          overflowY: "auto",
          borderTop: `1px solid ${palette.slate[200]}`,
        }}
      >
        {filteredNotifications.length === 0 ? (
          <Box sx={{ py: 6, px: 2, textAlign: "center" }}>
            <Typography sx={{ fontSize: "14px", color: "#64748B" }}>
              No notifications in this category
            </Typography>
          </Box>
        ) : (
          filteredNotifications.map((item) => (
            <Box
              key={item.id}
              onClick={() => handleItemClick(item)}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                px: 2.5,
                py: 1.75,
                borderBottom: `1px solid ${palette.slate[200]}`,
                cursor: "pointer",
                transition: "background-color 0.15s ease",
                bgcolor: item.read ? "#FFFFFF" : "#F8FAFC",
                "&:hover": {
                  bgcolor: "#F1F5F9",
                },
              }}
            >
              {/* Avatar circle */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: item.avatarBg || "#E8EEF5",
                  color: item.avatarColor || "#0F172A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "13px",
                  flexShrink: 0,
                  mr: 1.75,
                }}
              >
                {item.avatar}
              </Box>

              {/* Text content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="baseline"
                  spacing={1}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0F172A",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        color: "#64748B",
                        lineHeight: 1,
                      }}
                    >
                      {item.time}
                    </Typography>

                    {/* Unread indicator green dot */}
                    {!item.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "#10B981",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Stack>
                </Stack>

                <Typography
                  sx={{
                    fontSize: "12.5px",
                    color: "#64748B",
                    lineHeight: 1.4,
                    mt: 0.5,
                  }}
                >
                  {item.description}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Footer: View all notifications */}
      <Box
        onClick={handleViewAll}
        sx={{
          py: 1.75,
          px: 2,
          textAlign: "center",
          cursor: "pointer",
          userSelect: "none",
          transition: "background-color 0.15s ease",
          borderTop: `1px solid ${palette.slate[200]}`,
          bgcolor: "#FFFFFF",
          "&:hover": {
            bgcolor: "#F8FAFC",
          },
        }}
      >
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#0F172A",
          }}
        >
          View all notifications
        </Typography>
      </Box>
    </Popover>
  );
}
