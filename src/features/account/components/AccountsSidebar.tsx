"use client";

import { Box, Stack, Typography } from "@mui/material";
import { WalletCards } from "lucide-react";

import BaseBlurText from "@core/components/BaseBlurText";
import { formatCCY } from "@/utils/format-ccy";
import { formatAccountNumber } from "@/utils/format-account-number";
import type {
  CoreAccountEntry,
  CoreAccountsResponse,
} from "../account.types";
import { font, palette } from "@/theme/palette";

export interface AccountsSidebarProps {
  summary: CoreAccountsResponse["summary"] | null;
  accounts: CoreAccountEntry[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export default function AccountsSidebar({
  accounts,
  selectedId,
  onSelect,
}: AccountsSidebarProps) {
  // Group accounts by type
  const accountsList = [
    {
      name: "Savings",
      accounts: accounts.filter(
        (account) =>
          account.accountType === "SA" || account.accountType === "CA"
      ),
    },
    {
      name: "Fixed Deposit",
      accounts: accounts.filter(
        (account) => account.accountType === "FD"
      ),
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "16px",
        p: { xs: 2, sm: 2.5 },
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
        border: "1px solid #EDF2F7",
      }}
    >
      {/* ───────── Top: Summary Box ───────── */}
      <Box
        sx={{
          bgcolor: "#F4F7FB",
          borderRadius: "18px",
          p: "18px 20px",
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 500,
            color: "#718096",
            mb: 1.25,
            lineHeight: 1.2,
          }}
        >
          Summary
        </Typography>

        {/* White Summary Content */}
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: "24px",
            p: "16px",
          }}
        >
          <Stack spacing={2}>
            {/* Account Balances Summary */}
            <Box
              sx={{
                p: "16px",
                backgroundColor: "#2764A514",
                borderRadius: "12px",
              }}
            >
              <Typography
                sx={{
                  color: "#6B7685",
                  mb: 1,
                }}
              >
                Summary
              </Typography>

              {accounts.map((account) => (
                <Box
                  key={account.accountNumber}
                  sx={{
                    display: "flex",
                    gap: "5px",
                    mb: 0.5,
                  }}
                >
                  <Typography
                    sx={{
                      color: palette.black30,
                      fontWeight: 600,
                    }}
                  >
                    {account.ccy}
                  </Typography>

                  <Typography
                    sx={{
                      color: palette.black30,
                    }}
                  >
                    {formatCCY(account.availableBalance)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Account Groups */}
            {accountsList.map(
              (accountGroup) =>
                accountGroup.accounts.length > 0 && (
                  <Stack
                    key={accountGroup.name}
                    spacing={1}
                  >
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
                        onClick={() =>
                          onSelect?.(account.accountNumber)
                        }
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
                          "&:hover": onSelect
                            ? { backgroundColor: "#F8FAFC" }
                            : {},
                        }}
                      >
                        {/* Account Indicator */}
                        <Box
                          sx={{
                            backgroundColor:
                              account.color || "#3391D0",
                            width: "4px",
                            height: "40px",
                            borderRadius: "4px",
                            flexShrink: 0,
                          }}
                        />

                        {/* Account Information */}
                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
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
                              {account.ccy}{" "}
                              {formatCCY(account.availableBalance)}
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
                )
            )}
          </Stack>
        </Box>
      </Box>
      {/* ───────── End Summary Box ───────── */}

     
    </Box>
  );
}
