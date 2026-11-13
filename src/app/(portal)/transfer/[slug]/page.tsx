"use client";

import { Box, Grid, Stack, Typography } from "@mui/material";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import BaseCard from "@core/components/BaseCard";
import BaseIconButton from "@core/components/BaseIconButton";
import { transferOptions, TRANSFER_VIEW_BY_SLUG, TransferTypeSidebar } from "@/features/transfer";

export default function TransferDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const option = transferOptions.find((o) => o.slug === params.slug);
  const TransferViewComponent = params.slug ? TRANSFER_VIEW_BY_SLUG[params.slug] : undefined;

  return (

    <Grid container spacing={3} >
      {/* Left Column: Transfer Type Sidebar — stays mounted across type changes */}
      <Grid size={{ xs: 12, lg: 3 }}>
        <TransferTypeSidebar activeSlug={params.slug} />
      </Grid>

      {/* Right Column: Transfer Form — only this swaps when the type changes */}
      <Grid size={{ xs: 12, lg: 7 }}>
        {TransferViewComponent ? (
          <TransferViewComponent open={true} onClose={() => router.push("/transfer")} />
        ) : (
          <Box sx={{ width: "100%" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2.5 }}>
              <BaseIconButton
                icon={<ChevronLeft size={18} />}
                tooltip="Back to Transfer"
                onClick={() => router.push("/transfer")}
              />
              <Typography>{option?.label ?? "Transfer"}</Typography>
            </Stack>

            <BaseCard sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {option
                  ? `${option.description} This form is not built yet.`
                  : "Unknown transfer type."}
              </Typography>
            </BaseCard>
          </Box>
        )}
      </Grid>
    </Grid>

  );
}
