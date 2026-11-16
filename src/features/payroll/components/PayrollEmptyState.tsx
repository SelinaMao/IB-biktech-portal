"use client";

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Landmark, Plus, Smartphone, UserRound, Users, Wallet } from "lucide-react";

import { palette } from "@/theme/palette";

export interface PayrollEmptyStateProps {
  onMakePayroll: () => void;
}

const CHECKLIST_ITEMS = [
  {
    icon: Landmark,
    text: "Business details — as registered with your bank",
  },
  {
    icon: UserRound,
    text: "Employee details and bank account numbers",
  },
  {
    icon: Wallet,
    text: "An active account to fund salary payments",
  },
  {
    icon: Smartphone,
    text: "Your phone, to review and approve payroll",
  },
];

export default function PayrollEmptyState({ onMakePayroll }: PayrollEmptyStateProps) {
  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      {/* Page Header above the card */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontSize: { xs: 22, sm: 26 },
            fontWeight: 700,
            color: "#0F172A",
            lineHeight: 1.25,
            mb: 0.5,
          }}
        >
          Payroll
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontSize: 14,
            color: "#64748B",
          }}
        >
          Accept KHQR payments and collect bills from your customers.
        </Typography>
      </Box>

      {/* Centered White Card */}
      <Box
        sx={{
          maxWidth: 600,
          mx: "auto",
          bgcolor: "#FFFFFF",
          borderRadius: "20px",
          p: { xs: 3, sm: 4.5, md: 5.5 },
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
          textAlign: "center",
        }}
      >
        {/* Top Icon Circle */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "#F0F7FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2.5,
            color: "#1B5299",
          }}
        >
          <Users size={26} strokeWidth={2} />
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 700,
            color: "#0F172A",
            mb: 1.25,
          }}
        >
          Payroll
        </Typography>

        {/* Description */}
        <Typography
          sx={{
            fontSize: 14,
            color: "#64748B",
            lineHeight: 1.6,
            maxWidth: 440,
            mx: "auto",
            mb: 3.5,
          }}
        >
          Manage payroll in one place. Calculate salaries, track deductions, and pay
          your team accurately and on time.
        </Typography>

        {/* Checklist Box */}
        <Box
          sx={{
            bgcolor: "#F1F5F9",
            borderRadius: "14px",
            p: { xs: 2.25, sm: 2.75 },
            textAlign: "left",
            mb: 4,
          }}
        >
          <Stack spacing={2}>
            {CHECKLIST_ITEMS.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1.75}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#1B5299",
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={18} strokeWidth={2} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "#0F172A",
                      lineHeight: 1.4,
                    }}
                  >
                    {item.text}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          onClick={onMakePayroll}
          startIcon={<Plus size={18} />}
          sx={{
            height: 42,
            px: 3.5,
            borderRadius: "10px",
            bgcolor: "#1B5299",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 600,
            textTransform: "none",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#15427C",
              boxShadow: "none",
            },
          }}
        >
          Make Payroll
        </Button>
      </Box>
    </Box>
  );
}
