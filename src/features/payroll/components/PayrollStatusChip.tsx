"use client";

import Box from "@mui/material/Box";
import type { PayrollStatus } from "../payroll.types";

export interface PayrollStatusChipProps {
  status: PayrollStatus;
}

export default function PayrollStatusChip({ status }: PayrollStatusChipProps) {
  let bgColor = "#E68A00"; // Rich warm amber/orange matching screenshot
  let textColor = "#FFFFFF";

  switch (status) {
    case "Pending":
      bgColor = "#E68A00";
      textColor = "#FFFFFF";
      break;
    case "Completed":
    case "Approved":
      bgColor = "#16A34A";
      textColor = "#FFFFFF";
      break;
    case "Rejected":
      bgColor = "#DC2626";
      textColor = "#FFFFFF";
      break;
    default:
      bgColor = "#E68A00";
      textColor = "#FFFFFF";
  }

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 0.5,
        minWidth: 84,
        height: 28,
        borderRadius: "8px",
        bgcolor: bgColor,
        color: textColor,
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "0.2px",
        textTransform: "none",
        boxShadow: "none",
      }}
    >
      {status}
    </Box>
  );
}
