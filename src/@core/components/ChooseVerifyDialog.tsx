"use client";

import React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  QrCode,
  Smartphone,
} from "lucide-react";

import { palette } from "@/theme/palette";

export type VerifyMethod = "mobile_app" | "sms" | "qr";

export type ChooseVerifyDialogProps = {
  open: boolean;
  onClose?: () => void;
  onBack?: () => void;
  targetPhone?: string;
  subtitle?: string;
  onSelectMethod?: (method: VerifyMethod) => void;
  onSelectMobileApp?: () => void;
  onSelectSms?: () => void;
  onSelectQr?: () => void;
};

/**
 * 2-Step verification method selection dialog:
 * Displays options to verify via mobile app push, SMS code, or QR code scanning.
 */
export default function ChooseVerifyDialog({
  open,
  onClose,
  onBack,
  targetPhone = "0*****975",
  subtitle,
  onSelectMethod,
  onSelectMobileApp,
  onSelectSms,
  onSelectQr,
}: ChooseVerifyDialogProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    }
  };

  const handleMobileApp = () => {
    onSelectMobileApp?.();
    onSelectMethod?.("mobile_app");
  };

  const handleSms = () => {
    onSelectSms?.();
    onSelectMethod?.("sms");
  };

  const handleQr = () => {
    onSelectQr?.();
    onSelectMethod?.("qr");
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose?.();
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
            padding:5,
          borderRadius: "28px",
          px: { xs: 3, sm: 4.5 },
          pt: { xs: 3.5, sm: 4 },
          pb: { xs: 3.5, sm: 4 },
          position: "relative",
          bgcolor: "#FFFFFF",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.12)",
          maxWidth: 420,
          mx: 2,
        },
      }}
    >
      {/* Top Left Back Action */}
      <IconButton
        onClick={handleBack}
        aria-label="Back"
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          width: 32,
          height: 32,
          bgcolor: "#EDF0F4",
          color: "#1E293B",
          borderRadius: "50%",
          p: 0,
          transition: "all 0.15s ease-in-out",
          "&:hover": {
            bgcolor: "#E2E8F0",
          },
        }}
      >
        <ChevronLeft size={18} />
      </IconButton>

      <Box
        sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding:"15px"
        }}
      >
        {/* 3D Illustration */}
        <Box sx={{ mt: 3, mb: 1.5, display: "flex", justifyContent: "center" }}>
          <Image
            src="/assets/images/iconKey.png"
            alt="2-Step Verification"
            width={110}
            height={106}
            style={{ objectFit: "contain" }}
            priority
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "22px", sm: "24px" },
            color: "#0F172A",
            lineHeight: 1.3,
            letterSpacing: "-0.015em",
          }}
        >
          Choose 2-Step verification
          <br />
          method
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="body2"
          sx={{
            color: "#475569",
            fontSize: "14px",
            fontWeight: 400,
            mt: 2.5,
            mb: 3,
          }}
        >
          {subtitle ?? `We’ll use ${targetPhone} for`}
        </Typography>

        {/* Options List */}
        <Box sx={{ width: "100%" }}>
          {/* Send on mobile app */}
          <ButtonBase
            onClick={handleMobileApp}
            sx={{
                marginTop:"5px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 2.5,
                px: 1,
                borderRadius: "12px",
                textAlign: "left",
                transition: "background-color 0.15s ease",
                "&:hover": {
                bgcolor: "#F8FAFC",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "#F5F7FA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1E293B",
                  flexShrink: 0,
                }}
              >
                <Smartphone size={18} />
              </Box>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#0F172A",
                }}
              >
                Send on mobile app
              </Typography>
            </Box>

            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "#EDF0F4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#777A7E",
                flexShrink: 0,
              }}
            >
              <ChevronRight size={16} />
            </Box>
          </ButtonBase>

          {/* Divider */}
          <Box
            sx={{
              width: "100%",
              height: "1px",
              bgcolor: "#F1F5F9",
              my: 0.5,
            }}
          />

          {/* Send code by SMS */}
          <ButtonBase
            onClick={handleSms}
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 1.5,
              px: 1,
              borderRadius: "12px",
              textAlign: "left",
              transition: "background-color 0.15s ease",
              "&:hover": {
                bgcolor: "#F8FAFC",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "#F5F7FA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1E293B",
                  flexShrink: 0,
                }}
              >
                <MessageSquareText size={18} />
              </Box>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#0F172A",
                }}
              >
                Send code by SMS
              </Typography>
            </Box>

            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "#EDF0F4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#777A7E",
                flexShrink: 0,
              }}
            >
              <ChevronRight size={16} />
            </Box>
          </ButtonBase>
        </Box>

        {/* Separator */}
        <Typography
          sx={{
            color: "#94A3B8",
            fontSize: "14px",
            fontWeight: 400,
            my: 2.25,
          }}
        >
          Or
        </Typography>

        {/* QR Code Verify Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleQr}
          startIcon={<QrCode size={18} />}
          sx={{
            bgcolor: palette.primary[40] || "#2764A5",
            color: "#FFFFFF",
            borderRadius: "28px",
            py: 2.4,
            fontSize: "15px",
            fontWeight: 200,
            textTransform: "none",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#1E5289",
              boxShadow: "none",
            },
          }}
        >
          QR code verify
        </Button>
      </Box>
    </Dialog>
  );
}
