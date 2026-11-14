import Image from "next/image";
import { Landmark, Settings } from "lucide-react";

import { palette } from "@/theme/palette";
import type { TransferOption } from "./transfer.types";

/**
 * Transfer type catalogue — shared by the hub grid (Transfer.tsx) and the
 * split view's sidebar (TransferTypeSidebar.tsx). Lives in its own data-only
 * module so the sidebar can read it without importing the hub component
 * (which pulls in every transfer view and would create an import cycle back
 * through PreviewTransfer).
 */
export const transferOptions: TransferOption[] = [
  {
    slug: "own-account",
    label: "Own Account",
    description: "Move funds instantly between your registered accounts .",
    icon: <Image src="/assets/icons/vector.svg" alt="" width={20} height={20} />,
    color: palette.success.main,
  },
  {
    slug: "other-sme-bank",
    label: "Other SME Account",
    description: "Send money securely to another local commercial bank.",
    icon: <Image src="/assets/icons/vector_right.svg" alt="" width={20} height={20} />,
    color: palette.orange,
  },
  {
    slug: "schedule",
    label: "Schedule Transfer",
    description: "Transfer funds to another BiKTECH BANK account.",
    icon: <Landmark size={40} />,
  },
  {
    slug: "international",
    label: "International Transfer",
    description: "Send money internationally via fast SWIFT system.",
    icon: <Image src="/assets/icons/globe_x.svg" alt="" width={20} height={20} />,
    color: palette.primary[400],
  },
  {
    slug: "local-bank",
    label: "Local Bank Via Transfer",
    description: "Transfer funds securely to international bank accounts.",
    icon: <Image src="/assets/icons/local_bank.svg" alt="" width={20} height={20} />,
    color: palette.slate[700],
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
    color: palette.danger.main,
  },
];

/** Options shown as hub cards and in the split view's sidebar, in display order. */
export const HUB_SLUGS = ["own-account", "other-sme-bank", "local-bank", "international", "bulk"];
