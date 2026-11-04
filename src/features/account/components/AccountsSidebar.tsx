"use client";

import { Box, Stack, Typography } from "@mui/material";

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

  const savingsAccounts = useMemo(
    () => accounts.filter((a) => !isDepositAccount(a)),
    [accounts],
  );

  const depositAccounts = useMemo(
    () => accounts.filter((a) => isDepositAccount(a)),
    [accounts],
  );

  const renderAccountCard = (
    account: CoreAccountEntry,
    index: number,
    isDeposit: boolean,
  ) => {
    const key = account.id || `${account.accountNumber}-${account.accountType}`;
    const active = Boolean(
      selectedId &&
        (account.id === selectedId ||
          account.accountNumber === selectedId ||
          `${account.accountNumber}-${account.accountType}` === selectedId),
    );

    const barColor = getAccountIndicatorColor(account, index, isDeposit);

    return (
      <Box
        key={key}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={() => onSelect?.(key)}
        onKeyDown={(e) => {
          if (!onSelect) return;
          if (e.key === "Enter" || e.key === " ") onSelect(key);
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          width: "100%",
          height: 72,
          minWidth: 0,
          overflow: "hidden",
          p: "0 10px",
          borderRadius: "16px",
          cursor: onSelect ? "pointer" : "default",
          bgcolor: active ? "#EDF4FC" : "#FFFFFF",
          border: active ? "1.5px solid #85B7E8" : "1.5px solid #EDF2F7",
          transition: "all 0.15s ease-in-out",
          "&:hover": {
            bgcolor: active ? "#EDF4FC" : "#F8FAFC",
            borderColor: active ? "#73A8DC" : "#CBD5E1",
          },
        }}
      >
        {/* Left: Indicator Bar + Account Name & Number */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", minWidth: 0, pr: 1 }}
        >
          <Box
            sx={{
              width: "4px",
              height: "32px",
              borderRadius: "4px",
              bgcolor: barColor,
              flexShrink: 0,
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {account.accountName}
            </Typography>
            <Typography
              sx={{
                fontSize: 13.5,
                fontWeight: 400,
                color: "#64748B",
                mt: "4px",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {formatAccountNumber(account.accountNumber)}
            </Typography>
          </Box>
        </Stack>

        {/* Right: Balance */}
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 700,
            color: "#0F172A",
            textAlign: "right",
            flexShrink: 0,
            maxWidth: "55%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            pl: 1,
          }}
        >
          <BaseBlurText>
            {formatCCY(account.availableBalance, account.ccy)}
          </BaseBlurText>
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "24px",
        p: { xs: 2.5, sm: "20px 15px" },
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
        border: "1px solid #EDF2F7",
      }}
    >
      {/* ───────── Top: Summary Box ───────── */}
      <Box
        sx={{
          bgcolor: "#F4F7FB",
          borderRadius: "12px",
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
