"use client";

import { Box, Stack, Typography } from "@mui/material";
import { ChevronRight, Wallet } from "lucide-react";

import { font, palette } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import { formatCCY } from "@/utils/format-ccy";
import { formatAccountNumber } from "@/utils/format-account-number";
import SummaryCard from "./SummaryCard";
import type { CoreAccountEntry, CoreAccountsResponse, SummaryCardProps } from "../account.types";
import { adjustLightness } from "@/utils/get-color-light";

export interface AccountsSidebarProps {
  summary: CoreAccountsResponse["summary"] | null;
  accounts: CoreAccountEntry[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export default function AccountsSidebar({
  summary,
  accounts,
  selectedId,
  onSelect,
}: AccountsSidebarProps) {
  // Prefer the core API's reported totals; fall back to summing the list
  // client-side (e.g. before the first `listAccounts` response lands).
  const { totalBalanceKHR, totalBalanceUSD } = summary ?? {
    totalBalanceKHR: 0,
    totalBalanceUSD: 0,
  };

  const availableBalanceCard: SummaryCardProps = {
    label: "Summary",
    value: formatCCY(totalBalanceUSD, "USD"),
    sub: formatCCY(totalBalanceKHR, "KHR"),
    icon: <Wallet color={palette.success.main} size={20} />,
    tone: "success",
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        {/* <Typography sx={{ fontSize: 24, fontWeight: 400, color: "text.primary", mb: 1.5 }}>
          Summary
        </Typography> */}
        <SummaryCard {...availableBalanceCard} />
      </Box>

      <Box sx={{
        border:"0px solid",
        bgcolor:"white",
        borderRadius:"20px",
        padding:3
      }}>
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: "text.primary", mb: 1.5 }}>
          Accounts
        </Typography>
        <Stack spacing={2}>
          {accounts.map((account) => {
            const active = account.accountNumber === selectedId;
            return (
              <BaseCard
                key={`${account.accountNumber}-${account.ccy}`}
                role={onSelect ? "button" : undefined}
                tabIndex={onSelect ? 0 : undefined}
                onClick={() => onSelect?.(account.accountNumber)}
                onKeyDown={(e) => {
                  if (!onSelect) return;
                  if (e.key === "Enter" || e.key === " ") onSelect(account.accountNumber);
                }}
                sx={{
                  padding:"5px",
                  cursor: onSelect ? "pointer" : "default",
                  // border: `0px solid ${active ? `${account.color}` : "0px"}`,
                  backgroundColor: active ? "#2764A514" : "white",
                  border:"none"
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    position: 'relative',
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                    paddingLeft: '10px',
                    // "&::before": {
                    //   content: '""',
                    //   top: '-20px',
                    //   left: '-20px',
                    //   position: "absolute",
                    //   width: "15px",
                    //   height: "80px",
                    //   borderTopLeftRadius: active ? "14px" : "16px",
                    //   borderBottomRightRadius: '12px',
                    //   backgroundColor: account.color || "#F2C94C"
                    // }
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: font.weight.regular, fontSize: font.size.base, color: palette.primary[1000] }}>
                      {account.accountName}
                    </Typography>
                    <Typography sx={{ fontSize: font.size.xs, color: palette.text.secondary, mt: 0.25 }}>
                      {formatAccountNumber(account.accountNumber)}
                    </Typography>
                  </Box>
                  {/* <ChevronRight
                    size={18}
                    color={active ? palette.navy[800] : palette.slate[400]}
                  /> */}
                  <Typography sx={{ fontWeight: font.weight.bold, fontSize: font.size.sm, color: palette.text.primary, paddingLeft: '10px',margin:"5px" }}>
                  <BaseBlurText>{formatCCY(account.availableBalance, account.ccy)}</BaseBlurText>
                </Typography>
                </Stack>
                
              </BaseCard>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}
