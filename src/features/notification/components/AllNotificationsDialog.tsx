"use client";

import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { CheckCheck, Filter, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { BaseInput } from "@core/form";
import { NotificationCategory, NotificationItem } from "../notification.types";
import { palette } from "@/theme/palette";

export interface AllNotificationsDialogProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead?: () => void;
  onItemClick?: (item: NotificationItem) => void;
}

const CATEGORY_TABS: { key: NotificationCategory; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "TRANSACTION", label: "Transaction" },
  { key: "ALERT", label: "Alert" },
  { key: "ANNOUNCEMENT", label: "Announcement" },
];

export default function AllNotificationsDialog({
  open,
  onClose,
  notifications,
  onMarkAllAsRead,
  onItemClick,
}: AllNotificationsDialogProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>("ALL");
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredItems = useMemo(() => {
    return notifications.filter((item) => {
      if (activeCategory !== "ALL" && item.category !== activeCategory) {
        return false;
      }
      if (filterUnreadOnly && item.read) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [notifications, activeCategory, filterUnreadOnly, searchQuery]);

  const handleItemClick = (item: NotificationItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
    if (item.link) {
      onClose();
      router.push(item.link);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            borderRadius: "16px",
            border: `1px solid ${palette.slate[200]}`,
            boxShadow: "0 12px 36px rgba(15, 23, 42, 0.16)",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "#FFFFFF",
          },
        },
      }}
    >
      {/* Dialog Title & Header */}
      <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1.5, m: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                All Notifications
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} unread`}
                  size="small"
                  sx={{
                    bgcolor: "#EBF3FC",
                    color: palette.primary.main,
                    fontWeight: 700,
                    fontSize: "11px",
                    height: 22,
                  }}
                />
              )}
            </Stack>
            <Typography sx={{ fontSize: "13px", color: "#64748B", mt: 0.25 }}>
              Account activity, approvals, transfers, and system announcements
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {unreadCount > 0 && (
              <Button
                variant="text"
                size="small"
                onClick={onMarkAllAsRead}
                startIcon={<CheckCheck size={15} />}
                sx={{
                  color: "#0F172A",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  "&:hover": { color: palette.primary.main },
                }}
              >
                Mark all as read
              </Button>
            )}
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                color: palette.slate[500],
                "&:hover": { bgcolor: palette.slate[100] },
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Filter Bar */}
        <Box sx={{ mt: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            {/* Category tabs */}
            <Box
              sx={{
                bgcolor: "#F1F5F9",
                p: "4px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "2px",
                overflowX: "auto",
              }}
            >
              {CATEGORY_TABS.map((tab) => {
                const isActive = activeCategory === tab.key;
                const count =
                  tab.key === "ALL"
                    ? notifications.length
                    : notifications.filter((n) => n.category === tab.key).length;

                return (
                  <ButtonBase
                    key={tab.key}
                    onClick={() => setActiveCategory(tab.key)}
                    sx={{
                      py: "5px",
                      px: "10px",
                      borderRadius: "7px",
                      fontSize: "12.5px",
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#FFFFFF" : "#64748B",
                      bgcolor: isActive ? palette.primary.main : "transparent",
                      boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      "&:hover": {
                        color: isActive ? "#FFFFFF" : "#0F172A",
                        bgcolor: isActive ? palette.primary.main : "rgba(0,0,0,0.03)",
                      },
                    }}
                  >
                    <span>{tab.label}</span>
                    <Box
                      component="span"
                      sx={{
                        fontSize: "10px",
                        px: 0.6,
                        py: 0.05,
                        borderRadius: "10px",
                        bgcolor: isActive ? "rgba(255,255,255,0.25)" : "#E2E8F0",
                        color: isActive ? "#FFFFFF" : "#475569",
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </Box>
                  </ButtonBase>
                );
              })}
            </Box>

            {/* Unread toggle */}
            <ButtonBase
              onClick={() => setFilterUnreadOnly((prev) => !prev)}
              sx={{
                py: "5px",
                px: 1.25,
                borderRadius: "8px",
                border: `1px solid ${filterUnreadOnly ? palette.primary.main : palette.slate[200]}`,
                bgcolor: filterUnreadOnly ? palette.primary.light : "#FFFFFF",
                color: filterUnreadOnly ? palette.primary.main : "#64748B",
                fontSize: "12.5px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Filter size={14} />
              Unread
            </ButtonBase>
          </Stack>

          {/* Search Input */}
          <Box sx={{ mt: 1.5 }}>
            <BaseInput
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#94A3B8" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </Box>
      </DialogTitle>

      <Divider />

      {/* Notifications List Content */}
      <DialogContent sx={{ p: 0, overflowY: "auto", flex: 1 }}>
        {filteredItems.length === 0 ? (
          <Box sx={{ py: 8, px: 3, textAlign: "center" }}>
            <Typography sx={{ fontSize: "15px", fontWeight: 600, color: "#334155" }}>
              No notifications found
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#64748B", mt: 0.5 }}>
              Try adjusting your search query or category filter.
            </Typography>
          </Box>
        ) : (
          filteredItems.map((item) => (
            <Box
              key={item.id}
              onClick={() => handleItemClick(item)}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                px: 3,
                py: 2,
                borderBottom: `1px solid ${palette.slate[200]}`,
                cursor: "pointer",
                bgcolor: item.read ? "#FFFFFF" : "#F8FAFC",
                transition: "background-color 0.15s ease",
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
                  mr: 2,
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
      </DialogContent>
    </Dialog>
  );
}
