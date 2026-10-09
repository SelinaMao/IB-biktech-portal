"use client";

import { useState } from "react";
import Image from "next/image";
import { Box, Grid } from "@mui/material";
import { Landmark, Settings } from "lucide-react";

import BaseTitle from "@core/components/BaseTitle";
import type { TransferOption } from "../transfer.types";
import { templateTransfers } from "../transfer.data";
import BulkTransferDialog from "./BulkTransferDialog";
import InternationalDialog from "./InternationalDialog";
import LocalTransferDialog from "./LocalTransferDialog";
import OtherSmeBankDialog from "./OtherSmeBankDialog";
import OwnAccountDialog from "./OwnAccountDialog";
import ScheduleTransferDialog from "./ScheduleTransferDialog";
import TemplateTransfersTable from "./TemplateTransfersTable";
import TransferOptionCard from "./TransferOptionCard";

export const transferOptions: TransferOption[] = [
  {
    slug: "own-account",
    label: "Own Account",
    description: "Move funds instantly between your registered accounts .",
    icon: <Image src="/assets/icons/vector.svg" alt="" width={20} height={20} />,
  },
  {
    slug: "other-sme-bank",
    label: "Other SME Account",
    description: "Send money securely to another local commercial bank.",
    icon: <Image src="/assets/icons/vector_right.svg" alt="" width={20} height={20} />,
  },
  {
    slug: "schedule",
    label: "Schedule Transfer",
    description: "Transfer funds to another SME Bank account.",
    icon: <Landmark size={40} />,
  },
  {
    slug: "international",
    label: "International Transfer",
    description: "Send money internationally via fast SWIFT system.",
    icon: <Image src="/assets/icons/globe_x.svg" alt="" width={20} height={20} />,
  },
  {
    slug: "local-bank",
    label: "Local Bank Via Transfer",
    description: "Transfer funds securely to international bank accounts.",
    icon: <Image src="/assets/icons/local_bank.svg" alt="" width={20} height={20} />,
  },
  {
    slug: "bakong",
    label: "To Bakong",
    description: "Transfer funds using the Bakong network.",
    icon: <Settings size={40} />,
  },

  {
    slug: "bulk",
    label: "Bakong Wallet",
    description: "Transfer funds securely to international bank accounts.",
    icon: <Image src="/assets/icons/bakong.svg" alt="" width={20} height={20} />,
  },

];

/** Options shown as hub cards, in display order. */
const HUB_SLUGS = ["own-account", "other-sme-bank", "local-bank", "international", "bulk"];

/** Every slug here opens a dialog from the hub instead of navigating to the /transfer/[slug] placeholder. */
const DIALOG_BY_SLUG: Record<
  string,
  React.ComponentType<{ open: boolean; onClose: () => void }>
> = {
  "own-account": OwnAccountDialog,
  "other-sme-bank": OtherSmeBankDialog,
  schedule: ScheduleTransferDialog,
  international: InternationalDialog,
  "local-bank": LocalTransferDialog,
  bulk: BulkTransferDialog,

};

export default function Transfer() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const hubOptions = HUB_SLUGS.map((slug) =>
    transferOptions.find((option) => option.slug === slug),
  ).filter((option): option is TransferOption => Boolean(option));

  return (

    <Box sx={{ width: "100%" }}>
      <Box sx={{
        mx: -6,
        mt: -6,
        mb: 4,
        px: 6,
        py: 4,
        bgcolor: "background.paper",
        borderBottom: 0.1,
        borderColor: "divider",
      }}>
        <BaseTitle fontSize={24} fontWeight={"bold"} fontFamily={"ui-sans-serif"} >
          Transfer
        </BaseTitle>
      </Box>
      <Grid container spacing={2.5}>
        {hubOptions.map((option) => (
          <Grid key={option.slug} size={{ xs: 12, sm: 6, md: 4 }}>
            <TransferOptionCard
              option={option}
              onClick={
                DIALOG_BY_SLUG[option.slug]
                  ? () => setOpenSlug(option.slug)
                  : undefined
              }
            />
          </Grid>
        ))}
      </Grid>
      {/* 
      <Box sx={{ mt: 4 }}>
        <BaseTitle fontSize={18} fontWeight={600} sx={{ mb: 2.5 }}>
          Templates
        </BaseTitle>
        <TemplateTransfersTable templates={templateTransfers} />
      </Box>

      {Object.entries(DIALOG_BY_SLUG).map(([slug, DialogComponent]) => (
        <DialogComponent
          key={slug}
          open={openSlug === slug}
          onClose={() => setOpenSlug(null)}
        />
      ))} */}
    </Box>
  );
}
