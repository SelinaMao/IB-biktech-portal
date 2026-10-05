"use client";

import React from "react";
import { Box, Stack } from "@mui/material";
import { ChevronRightRounded } from "@mui/icons-material";

import { palette, radius } from "@/theme/palette";
import BaseCard from "@core/components/BaseCard";
import { banners } from "../dashboard.data";

export default function Banner() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const prev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);
  const next = () => setIndex((i) => (i + 1) % banners.length);

  return (
    <BaseCard sx={{ p: 0, overflow: "hidden", position: "relative" }}>
      <Box sx={{ position: "relative", width: "100%", height: { xs: 140, sm: 160 } }}>
        {banners.map((b, i) => (
          <Box
            key={b.image + i}
            component="img"
            src={b.image}
            alt={b.alt}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === index ? 1 : 0,
              transition: "opacity 0.5s ease",
            }}
          />
        ))}
      </Box>

      {banners.length > 1 && (
        <>
          <Box
            onClick={prev}
            sx={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: palette.white,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: 1,
            }}
          >
            <ChevronRightRounded sx={{ transform: "rotate(180deg)", fontSize: 20 }} />
          </Box>
          <Box
            onClick={next}
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: palette.white,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: 1,
            }}
          >
            <ChevronRightRounded sx={{ fontSize: 20 }} />
          </Box>

          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              position: "absolute",
              bottom: 10,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {banners.map((_, i) => (
              <Box
                key={i}
                onClick={() => setIndex(i)}
                sx={{
                  width: i === index ? 18 : 6,
                  height: 6,
                  borderRadius: `${radius.pill}px`,
                  bgcolor: i === index ? palette.white : palette.white50,
                  cursor: "pointer",
                  transition: "width 0.3s ease",
                }}
              />
            ))}
          </Stack>
        </>
      )}
    </BaseCard>
  );
}
