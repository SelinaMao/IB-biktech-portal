"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { palette, radius } from "@/theme/palette";
import BaseIconBadge from "@core/components/BaseIconBadge";
import { HUB_SLUGS, transferOptions } from "../transfer-options.data";

export type TransferTypeSidebarAccount = {
  name?: string;
  accountNumber?: string;
  balance?: string;
  currency?: string;
};

export type TransferTypeSidebarProps = {
  /** The account the active transfer debits; shown in the top "From account" box. */
  fromAccount?: TransferTypeSidebarAccount;
  /** Overrides the slug read from the URL — for an inline (non-routed) preview. */
  activeSlug?: string;
};

function maskAccount(acc?: string) {
  if (!acc) return "•••• 0000";
  const clean = acc.replace(/\D/g, "");
  const last4 = clean.length > 4 ? clean.slice(-4) : clean;
  return `•••• ${last4}`;
}

/**
 * Left column of the transfer split view: the active account summary plus
 * the list of transfer types, styled like the Accounts list (colour-coded,
 * the active one tinted green). Each row links to that type's own
 * `/transfer/{slug}` route, so back/refresh keep you on the right type.
 */
export default function TransferTypeSidebar({ fromAccount, activeSlug }: TransferTypeSidebarProps) {
  const pathname = usePathname();
  const currentSlug = activeSlug ?? pathname?.split("/").filter(Boolean).pop();

  const items = HUB_SLUGS.map((slug) => transferOptions.find((option) => option.slug === slug)).filter(
    (option): option is NonNullable<typeof option> => Boolean(option),
  );

  return (
    <Box sx={{ width: "100%" }}>
      {fromAccount && (
        <Box
          sx={{
            bgcolor: palette.slate[50],
            borderRadius: `${radius.xl}px`,
            border: `1px solid ${palette.slate[200]}`,
            p: "18px 20px",
            mb: 6,
          }}
        >
          <Typography sx={{ fontSize: 12.5, fontWeight: 500, color: palette.slate[500], mb: 1 }}>
            From account
          </Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>
            {fromAccount.name ?? "—"} · {maskAccount(fromAccount.accountNumber)}
          </Typography>
          <Typography sx={{ fontSize: 13, color: palette.slate[500], mt: 1 }}>
            Available {fromAccount.currency ?? ""} {fromAccount.balance ?? "0.00"}
          </Typography>
        </Box>
      )}

      <Stack spacing={3}>
        {items.map((option) => {
          const active = option.slug === currentSlug;
          const color = option.color ?? palette.primary[400];

          return (
            <Box
              key={option.slug}
              component={Link}
              href={`/transfer/${option.slug}`}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 3,
                p: "18px 20px",
                borderRadius: `${radius.xl}px`,
                textDecoration: "none",
                border: `1.5px solid ${active ? palette.slate[52] : palette.slate[200]}`,
                bgcolor: active ? palette.slate[52] : palette.white,
                transition: "border-color 0.15s ease, background-color 0.15s ease",
                "&:hover": active
                  ? {}
                  : { borderColor: palette.slate[300], bgcolor: palette.slate[50] },
              }}
            >
              <BaseIconBadge
                direction="income"
                size={40}
                bgColor={`${color}1A`}
                color={color}
                icon={option.icon}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  {option.label}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: palette.slate[500], mt: 1 }}>
                  {option.description}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
