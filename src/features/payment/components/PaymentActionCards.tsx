"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronRight, HandCoins, Smartphone } from "lucide-react";

import { palette } from "@/theme/palette";
import BaseCard from "@core/components/BaseCard";
import type { PaymentActionCardItem, PaymentActionSlug } from "../payment.types";

export interface PaymentActionCardsProps {
  cards: PaymentActionCardItem[];
  onSelectAction: (slug: PaymentActionSlug) => void;
}

/** Custom Receipt icon with dollar sign matching the screenshot */
function ReceiptDollarIcon({ size = 22, color = "#2764A5" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M12 7v10" />
      <path d="M9.5 9.5a2 2 0 0 1 4 0c0 1.2-1 1.7-2 2.2s-2 1-2 2.3a2 2 0 0 0 4 0" />
    </svg>
  );
}

export default function PaymentActionCards({
  cards,
  onSelectAction,
}: PaymentActionCardsProps) {
  const renderIcon = (name: PaymentActionCardItem["iconName"]) => {
    switch (name) {
      case "receipt":
        return <ReceiptDollarIcon size={22} color="#2764A5" />;
      case "smartphone":
        return <Smartphone size={22} color="#2764A5" strokeWidth={1.8} />;
      case "charity":
        return <HandCoins size={22} color="#2764A5" strokeWidth={1.8} />;
      default:
        return <ReceiptDollarIcon size={22} color="#2764A5" />;
    }
  };

  return (
    <Grid container spacing={2.5}>
      {cards.map((item) => (
        <Grid key={item.id} size={{ xs: 12, md: 4 }}>
          <BaseCard
            component="button"
            type="button"
            onClick={() => onSelectAction(item.slug)}
            sx={{
              display: "block",
              width: "100%",
              p: { xs: 2.5, sm: "20px 24px" },
              bgcolor: "#FFFFFF",
              border: `1px solid ${palette.slate[200]}`,
              borderRadius: "16px",
              textAlign: "left",
              font: "inherit",
              cursor: "pointer",
              boxShadow: "none",
              transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
              "&:hover": {
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                borderColor: palette.slate[300],
                transform: "translateY(-1px)",
              },
            }}
          >
            {/* Top row: Icon on left, Chevron on right */}
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  bgcolor: "#EBF3FA",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {renderIcon(item.iconName)}
              </Box>

              <ChevronRight size={18} color={palette.slate[400]} />
            </Stack>

            {/* Title */}
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: 16,
                color: palette.slate[900],
                lineHeight: 1.3,
                mt: 2.25,
                mb: 0.5,
              }}
            >
              {item.title}
            </Typography>

            {/* Subtitle */}
            <Typography
              sx={{
                fontSize: 13,
                color: palette.slate[500],
                lineHeight: 1.4,
              }}
            >
              {item.description}
            </Typography>
          </BaseCard>
        </Grid>
      ))}
    </Grid>
  );
}
