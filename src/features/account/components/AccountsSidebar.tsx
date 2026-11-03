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
import { display } from "html2canvas/dist/types/css/property-descriptors/display";

export interface AccountsSidebarProps {
  summary: CoreAccountsResponse["summary"] | null;
  accounts: CoreAccountEntry[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export default function AccountsSidebar({ summary, accounts, selectedId, onSelect }: AccountsSidebarProps) {
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

  const accountsList = [
    {
      name: "Savings",
      accounts: accounts.filter((account) => account.accountType === "SA" || account.accountType === "CA"),
    },
    {
      name: "Fixed Deposit",
      accounts: accounts.filter((account) => account.accountType === "FD"),
    },
  ];

  return (
    <Stack spacing={2.5}>
      {/* <Box>
        <Typography sx={{ fontSize: 24, fontWeight: 400, color: "text.primary", mb: 1.5 }}>
          Summary
        </Typography>
        <SummaryCard {...availableBalanceCard} />
      </Box> */}

      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "24px",
          p: "16px",
        }}
      >
        <Stack spacing={2}>
          {/* Summary */}
          <Box
            sx={{
              p: "16px",
              backgroundColor: "#2764A514",
              borderRadius: "12px",
            }}
          >
            <Typography sx={{ color: "#6B7685", mb: 1 }}>Summary</Typography>

            {accounts.map((account) => (
              <Box
                key={account.accountNumber}
                sx={{
                  display: "flex",
                  gap: "5px",
                  mb: 0.5,
                }}
              >
                <Typography sx={{ color: palette.black30, fontWeight: 600 }}>{account.ccy}</Typography>

                <Typography sx={{ color: palette.black30 }}>{formatCCY(account.availableBalance)}</Typography>
              </Box>
            ))}
          </Box>

          {/* Account groups */}
          {accountsList.map(
            (accountGroup) =>
              accountGroup.accounts.length > 0 && (
                <Stack key={accountGroup.name} spacing={1}>
                  <Typography
                    sx={{
                      color: "#6B7685",
                      fontSize: "15px",
                      fontWeight: font.weight.semibold,
                      py: "10px",
                    }}
                  >
                    {accountGroup.name}
                  </Typography>

                  {accountGroup.accounts.map((account) => (
                    <Box
                      key={account.accountNumber}
                      onClick={() => onSelect?.(account.accountNumber)}
                      sx={{
                        cursor: onSelect ? "pointer" : "default",
                        width: "100%",
                        boxSizing: "border-box",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #2764A514",
                        p: "16px",
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        "&:hover": onSelect ? { backgroundColor: "#F8FAFC" } : {},
                      }}
                    >
                      {/* Account indicator */}
                      <Box
                        sx={{
                          backgroundColor: account.color || "#3391D0",
                          width: "4px",
                          height: "40px",
                          borderRadius: "4px",
                          flexShrink: 0,
                        }}
                      />

                      {/* Account information */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "15px",
                              color: palette.black30,
                              fontWeight: 600,
                            }}
                          >
                            {account.accountName}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: "15px",
                              color: palette.black30,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {account.ccy} {formatCCY(account.availableBalance)}
                          </Typography>
                        </Box>

                        <Typography
                          sx={{
                            fontSize: font.size.xs,
                            color: palette.text.secondary,
                            mt: 0.25,
                          }}
                        >
                          {account.accountNumber}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ),
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
