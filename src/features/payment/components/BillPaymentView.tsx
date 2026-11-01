"use client";

import { useMemo, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChevronRight, Search } from "lucide-react";

import { palette } from "@/theme/palette";
import BaseCard from "@core/components/BaseCard";
import { BILL_CATEGORIES, INITIAL_BILL_PROVIDERS } from "../payment.data";
import type { BillCategory, BillProvider } from "../payment.types";

export interface BillPaymentViewProps {
  onSelectProvider: (provider: BillProvider) => void;
}

export default function BillPaymentView({
  onSelectProvider,
}: BillPaymentViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<BillCategory>("All");
  const [search, setSearch] = useState("");

  const filteredProviders = useMemo(() => {
    return INITIAL_BILL_PROVIDERS.filter((provider) => {
      const matchesCategory =
        selectedCategory === "All" ||
        provider.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch =
        !search.trim() ||
        provider.name.toLowerCase().includes(search.toLowerCase()) ||
        provider.category.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Main Heading */}
      <Typography
        sx={{
          fontSize: { xs: 24, sm: 28 },
          fontWeight: 700,
          color: palette.slate[900],
          lineHeight: 1.2,
          mb: 3,
        }}
      >
        Bill Payment
      </Typography>

      {/* Filter and Search Bar Row */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          mb: 3.5,
        }}
      >
        {/* Segmented Pill Filter Track */}
        <Box
          sx={{
            bgcolor: palette.hover[10],
            borderRadius: "10px",
            p: "4px",
            display: "inline-flex",
            alignItems: "center",
            width: "fit-content",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          {BILL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <ButtonBase
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                sx={{
                  px: 2,
                  py: 1.75,
                  borderRadius: "8px",
                  fontSize: 13.5,
                  fontWeight: isSelected ? 600 : 500,
                  bgcolor: isSelected ? "#FFFFFF" : "transparent",
                  color: isSelected ? palette.slate[900] : palette.slate[500],
                  boxShadow: isSelected ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    color: palette.slate[900],
                  },
                }}
              >
                {cat}
              </ButtonBase>
            );
          })}
        </Box>

        {/* Search Input */}
        <TextField
          size="small"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            width: { xs: "100%", md: 220 },
            "& .MuiOutlinedInput-root": {
              height: 40,
              borderRadius: "10px",
              borderColor: palette.slate[200],
              backgroundColor: "#ffffff",
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={17} color={palette.slate[400]} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      {/* Providers Grid (3 Columns) */}
      <Grid container spacing={2.5}>
        {filteredProviders.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                bgcolor: "#FFFFFF",
                border: `1px solid ${palette.slate[200]}`,
                borderRadius: "16px",
                p: 6,
                textAlign: "center",
                boxShadow: "none",
              }}
            >
              <Typography sx={{ color: palette.slate[500], fontSize: 14 }}>
                No bill providers found in this category.
              </Typography>
            </Box>
          </Grid>
        ) : (
          filteredProviders.map((provider) => (
            <Grid key={provider.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <BaseCard
                component="button"
                type="button"
                onClick={() => onSelectProvider(provider)}
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
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: "#EDF2F7",
                      color: palette.slate[900],
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {provider.initials}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: palette.slate[900],
                        lineHeight: 1.3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {provider.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: palette.slate[500],
                        mt: 0.35,
                        lineHeight: 1.4,
                      }}
                    >
                      {provider.category}
                    </Typography>
                  </Box>

                  <ChevronRight
                    size={18}
                    color={palette.slate[400]}
                    style={{ flexShrink: 0, marginLeft: 8 }}
                  />
                </Stack>
              </BaseCard>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
