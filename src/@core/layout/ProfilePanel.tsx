"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Slide,
  Stack,
  Typography,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { X } from "lucide-react";

import { useAppSelector } from "@/store/hooks";

export type ProfilePanelProps = {
  open: boolean;
  onClose: () => void;
  avatarSrc?: string;
  companyTitle?: string;
  userSubtitle?: string;
  companyName?: string;
  contactEmail?: string;
  phoneNumber?: string;
  billingAddress?: string;
  authorizedRepresentative?: string;
  dailyTransactionLimit?: string;
  notificationPreferences?: string;
  linkedMasterAccounts?: string;
  onQuickLimitUpdate?: () => void;
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

function DetailRow({
  label,
  value,
  multiline = false,
  valueColor = "#0F172A",
}: {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
  valueColor?: string;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: multiline ? "flex-start" : "center",
        py: 1.45,
        gap: 3,
      }}
    >
      <Typography
        sx={{
          fontSize: 13.5,
          color: "#64748B",
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: "0.1px",
          flexShrink: 0,
          ...(multiline && { pt: "1px" }),
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 13.5,
          fontWeight: 500,
          color: valueColor,
          textAlign: "right",
          whiteSpace: multiline ? "pre-line" : "normal",
          lineHeight: 1.45,
          wordBreak: "break-word",
          maxWidth: "68%",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/**
 * Slide-in Profile Dialog displaying company, user, account holder,
 * and account settings information matching the modern portal dialog specifications.
 */
export default function ProfilePanel({
  open,
  onClose,
  avatarSrc,
  companyTitle = "Shiping co., ltd",
  userSubtitle,
  companyName = "Shiping co., ltd.",
  contactEmail = "ops@shipingcoltd.com",
  phoneNumber = "+1 (555) 234-5678",
  billingAddress = "Suite 402, Maritime Tower,\nBoston MA",
  authorizedRepresentative = "Anna Smith",
  dailyTransactionLimit = "250,000.00 USD",
  notificationPreferences = "SMS & Email Alerts",
  linkedMasterAccounts = "Savings - 000 067 898",
  onQuickLimitUpdate,
}: ProfilePanelProps) {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  const resolvedUserName = user?.name || "Rous Samol";
  const resolvedUserRole = user?.roles?.[0]?.name || "Admin";
  const displayUserSubtitle = userSubtitle || `${resolvedUserName} - ${resolvedUserRole}`;

  const initials = (resolvedUserName || "RS")
    .split(" ")
    .map((part: string) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLimitUpdateClick = () => {
    onClose();
    if (onQuickLimitUpdate) {
      onQuickLimitUpdate();
    } else {
      router.push("/limits");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      slotProps={{
        backdrop: {
          sx: { bgcolor: "rgba(15, 23, 42, 0.4)" },
        },
        paper: {
          sx: {
            position: "fixed",
            top: { xs: 8, sm: 8, md: 14 },
            right: { xs: 8, sm: 8, md: 14 },
            bottom: { xs: 8, sm: 8, md: 14 },
            m: 0,
            width: { xs: "calc(100vw - 16px)", sm: 429 },
            maxWidth: 429,
            height: {
              xs: "calc(100vh - 16px)",
              sm: "calc(100vh - 16px)",
              md: "calc(100vh - 28px)",
            },
            maxHeight: 976,
            borderRadius: "24px",
            bgcolor: "#FFFFFF",
            p: { xs: 2.5, sm: "28px 24px" },
            boxSizing: "border-box",
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "5px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#E2E8F0",
              borderRadius: "999px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.25,
              letterSpacing: "-0.2px",
            }}
          >
            Profile
          </Typography>

          <IconButton
            onClick={onClose}
            size="small"
            aria-label="close"
            sx={{
              color: "#64748B",
              bgcolor: "#F1F5F9",
              borderRadius: "8px",
              p: 0.75,
              "&:hover": { bgcolor: "#E2E8F0" },
            }}
          >
            <X size={18} />
          </IconButton>
        </Stack>

        {/* User / Company Overview */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3.5 }}>
          <Avatar
            src={avatarSrc}
            alt={companyTitle}
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              bgcolor: "#E2E8F0",
              color: "#1E293B",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {initials || "RS"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 15.5,
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.25,
              }}
            >
              {companyTitle}
            </Typography>
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 400,
                color: "#64748B",
                mt: 0.35,
                lineHeight: 1.25,
              }}
            >
              {displayUserSubtitle}
            </Typography>
          </Box>
        </Stack>

        {/* Business Information */}
        <Box>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#0F172A", mb: 1.5, letterSpacing: "0.1px" }}>
            Business Information
          </Typography>
          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
            <DetailRow label="Company Name" value={companyName} />
            <DetailRow label="Contact Email" value={contactEmail} />
            <DetailRow label="Phone Number" value={phoneNumber} />
            <DetailRow label="Billing Address" value={billingAddress} multiline />
          </Stack>
        </Box>

        {/* Account Holder Information */}
        <Box sx={{ mt: 3.5 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#0F172A", mb: 1.5, letterSpacing: "0.1px" }}>
            Account Holder Information
          </Typography>
          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
            <DetailRow label="Authorized Representative" value={authorizedRepresentative} />
            <DetailRow label="Contact Email" value={contactEmail} />
            <DetailRow label="Phone Number" value={phoneNumber} />
            <DetailRow label="Billing Address" value={billingAddress} multiline />
          </Stack>
        </Box>

        {/* Account Settings */}
        <Box sx={{ mt: 3.5, pb: 1 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#0F172A", mb: 1.5, letterSpacing: "0.1px" }}>
            Account Settings
          </Typography>
          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
            <DetailRow label="Daily Transaction Limit" value={dailyTransactionLimit} />
            <DetailRow label="Notification Preferences" value={notificationPreferences} />
            <DetailRow label="Linked Master Accounts" value={linkedMasterAccounts} />
          </Stack>

          <Typography
            onClick={handleLimitUpdateClick}
            sx={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "#5B6B82",
              mt: 3.5,
              display: "inline-block",
              cursor: "pointer",
              transition: "color 0.15s ease",
              "&:hover": { color: "#0F172A" },
            }}
          >
            Quick Limit Update (Authorized Only)
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
