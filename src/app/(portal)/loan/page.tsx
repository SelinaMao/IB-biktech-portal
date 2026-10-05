"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Grid, Stack } from "@mui/material";
import { CirclePlus } from "lucide-react";

import BaseButton from "@core/components/BaseButton";
import { useAppSelector } from "@/store/hooks";
import {
  selectAccountDetailResponse,
  selectAccountsResponse,
  useGetAccountDetailMutation,
  useListAccountsMutation,
  type CoreAccountEntry,
} from "@/features/account";
import {
  LoanDetailsPanel,
  LoanOverviewCard,
  LoansSidebar,
  LoanTransactionsCard,
  loanDetailsById,
  type LoanAccountListItem,
} from "@/features/loan";

// No live loan-detail/repayment API yet — the overview + transactions panels
// keep reading this mock entry regardless of which live loan account is
// selected in the sidebar (mirrors `account/page.tsx`'s DEFAULT_ACCOUNT_ID
// fallback for fields with no API yet).
const DEFAULT_LOAN_DETAILS_KEY = "term-loan";

/** Maps a live `accounts` row (filtered to `accountType === "CL"`) to the
 *  shape `LoansSidebar` consumes. */
const mapLoanAccount = (entry: CoreAccountEntry): LoanAccountListItem => ({
  id: entry.accountNumber,
  name: entry.accountName,
  number: entry.accountNumber,
  type: entry.accountClassDescription || entry.accountType,
  balance: entry.availableBalance,
  currency: entry.ccy,
});

export default function LoanPage() {
  // `listAccounts` is a mutation with no fetch-on-mount of its own (same
  // pattern as `account/page.tsx`) — trigger it manually and read the
  // response back from the slice via `selectAccountsResponse`.
  const [listAccounts, listAccountsResult] = useListAccountsMutation();
  useEffect(() => {
    listAccounts({ type: "CL" });
  }, [listAccounts]);
  const accountsResponse = useAppSelector(selectAccountsResponse);

  // The `{ type: "CL" }` filter above means every row back is already
  // a loan account — just map it to the shape `LoansSidebar` consumes.
  const loanAccounts = useMemo(
    () => (accountsResponse?.accounts ?? []).map(mapLoanAccount),
    [accountsResponse],
  );

  const outstandingByCcy = useMemo(
    () => ({
      khr: loanAccounts
        .filter((loan) => loan.currency === "KHR")
        .reduce((sum, loan) => sum + loan.balance, 0),
      usd: loanAccounts
        .filter((loan) => loan.currency === "USD")
        .reduce((sum, loan) => sum + loan.balance, 0),
    }),
    [loanAccounts],
  );

  const [selectedLoanId, setSelectedLoanId] = useState<string | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Auto-select the first loan once the list loads (initial visit or a page
  // reload) so the overview/transactions panels show a loan without the user
  // clicking a row.
  useEffect(() => {
    if (!selectedLoanId && loanAccounts.length > 0) {
      setSelectedLoanId(loanAccounts[0].id);
    }
  }, [loanAccounts, selectedLoanId]);

  const selectedLoanDetails =
    loanDetailsById[selectedLoanId ?? ""] ?? loanDetailsById[DEFAULT_LOAN_DETAILS_KEY];

  // Same pattern as `account/page.tsx`: `getAccountDetail` is a mutation with
  // no fetch-on-mount of its own — trigger it manually whenever the selected
  // loan changes and read the response back from the slice.
  const [getAccountDetail] = useGetAccountDetailMutation();
  useEffect(() => {
    if (selectedLoanId) getAccountDetail({ accountNumber: selectedLoanId, type: "CL" });
  }, [selectedLoanId, getAccountDetail]);

  const accountDetailResponse = useAppSelector(selectAccountDetailResponse);
  const detailReady = Boolean(
    accountDetailResponse && accountDetailResponse.accountNumber === selectedLoanId,
  );
  // Only `accountName`/`accountNumber` come from the live detail call — the
  // rest of the borrower header (status, credit remark) and the whole
  // schedule panel have no live API yet, so they still fall back to
  // `selectedLoanDetails` (mock data keyed by mock loan id).
  const accountInfoDetail = useMemo(
    () => (detailReady ? accountDetailResponse! : undefined),
    [detailReady, accountDetailResponse],
  );
  const borrower = useMemo(
    () => ({
      ...selectedLoanDetails.borrower,
      name: accountInfoDetail?.accountName || selectedLoanDetails.borrower.name,
      accountNumber: accountInfoDetail?.accountNumber || selectedLoanDetails.borrower.accountNumber,
    }),
    [accountInfoDetail, selectedLoanDetails],
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 3 }}>
          <LoansSidebar
            outstandingKhr={outstandingByCcy.khr}
            outstandingUsd={outstandingByCcy.usd}
            loans={loanAccounts}
            selectedId={selectedLoanId}
            onSelect={setSelectedLoanId}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 9 }}>
          <Grid container spacing={2.5}>
            <Grid size={12}>
              <LoanOverviewCard
                key={selectedLoanId}
                borrower={borrower}
                schedule={selectedLoanDetails.schedule}
                onViewDetails={() => setDetailsOpen(true)}
              />
            </Grid>

            <Grid size={12}>
              <LoanTransactionsCard
                key={selectedLoanId}
                transactions={selectedLoanDetails.transactions}
              />
            </Grid>

            <Grid size={12}>
              <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                <BaseButton
                  title="Apply for Loan"
                  variant="contained"
                  startIcon={<CirclePlus size={18} />}
                  onClick={() => {
                    // TODO(nav): open the loan application flow.
                  }}
                />
              </Stack>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <LoanDetailsPanel
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        borrower={borrower}
        schedule={selectedLoanDetails.schedule}
        onDownloadSchedule={() => {
          // TODO(api): request the loan schedule file.
        }}
        onDownloadRemainingInstallments={() => {
          // TODO(api): request the remaining installments file.
        }}
      />
    </Box>
  );
}
