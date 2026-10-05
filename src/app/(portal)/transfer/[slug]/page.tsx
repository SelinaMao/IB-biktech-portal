"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Box, Stack, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";

import BaseCard from "@core/components/BaseCard";
import BaseIconButton from "@core/components/BaseIconButton";
import { transferOptions } from "@/features/transfer";

export default function TransferDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const option = transferOptions.find((o) => o.slug === params.slug);

  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2.5 }}>
        <BaseIconButton
          icon={<ArrowBackRoundedIcon />}
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
  );
}
