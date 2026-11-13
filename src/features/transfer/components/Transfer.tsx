"use client";

import { Box, Grid } from "@mui/material";

import BaseTitle from "@core/components/BaseTitle";
import type { TransferOption } from "../transfer.types";
import { templateTransfers } from "../transfer.data";
import { HUB_SLUGS, transferOptions } from "../transfer-options.data";
import Bakong from "./Bakong";
import BulkTransfer from "./BulkTransfer";
import International from "./International";
import LocalTransfer from "./LocalTransfer";
import OtherSmeBank from "./OtherSmeBank";
import OwnAccount from "./OwnAccount";
import ScheduleTransfer from "./ScheduleTransfer";
import TemplateTransfersTable from "./TemplateTransfersTable";
import TransferOptionCard from "./TransferOptionCard";

export { transferOptions, HUB_SLUGS };

/** Every slug here opens an inline page view from the hub. */
export const TRANSFER_VIEW_BY_SLUG: Record<
  string,
  React.ComponentType<{ open: boolean; onClose: () => void }>
> = {
  "own-account": OwnAccount,
  "other-sme-bank": OtherSmeBank,
  schedule: ScheduleTransfer,
  "local-bank": LocalTransfer,
  bakong: Bakong,
  bulk: BulkTransfer,
  international: International,
};

export default function Transfer() {
  const hubOptions = HUB_SLUGS.map((slug) =>
    transferOptions.find((option) => option.slug === slug),
  ).filter((option): option is TransferOption => Boolean(option));

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          mx: -6,
          mt: -6,
          mb: 4,
          px: 6,
          py: 4,
          // bgcolor: "background.paper",
          // borderBottom: 0.1,
          // borderColor: "divider",
        }}
      >
        <BaseTitle fontSize={24} fontWeight={"bold"} fontFamily={"var(--font-noto-khmer), sans-serif"}>
          Choose Type Of Transfer
        </BaseTitle>
      </Box>
      <Grid container spacing={2.5}>
        {hubOptions.map((option) => (
          <Grid key={option.slug} size={{ xs: 12, sm: 6, md: 4 }}>
            <TransferOptionCard option={option} />
          </Grid>
        ))}
      </Grid>

      {/* <Box sx={{ mt: 4 }}>
        <BaseTitle fontSize={18} fontWeight={600} sx={{ mb: 2.5 }}>
          Templates
        </BaseTitle>
        <TemplateTransfersTable templates={templateTransfers} />
      </Box> */}
    </Box>
  );
}
