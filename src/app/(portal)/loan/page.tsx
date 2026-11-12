"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { resolveBaseDownloadRange, type BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import { showToast } from "@core/components/AppToast";
import { useAppSelector } from "@/store/hooks";
import { downloadBlob } from "@/utils/download-file";
import {
  downloadTransactionStatement,
  type TransactionDownloadFileType,
  selectAccountDetailResponse,
  selectAccountsResponse,
  useGetAccountDetailMutation,
  useListAccountsMutation,
  type CoreAccountEntry,
} from "@/features/account";
import {
  LoanDetailsPanel,
  LoanDetailCard,
  LoansSidebar,
  getLoanIndicatorColor,
  loanDetailsById,
  loanAccounts as mockLoanAccounts,
  loanSummary as mockLoanSummary,
  type LoanAccountListItem,
  LoanTransactionsCard,
  LoanSummary,
} from "@/features/loan";

const STATEMENT_DOWNLOAD_FORMATS: Record<
  BaseDownloadValue["format"],
  { fileType: TransactionDownloadFileType; extension: string }
> = {
  pdf: { fileType: "PDF", extension: "pdf" },
  csv: { fileType: "CSV", extension: "csv" },
  excel: { fileType: "EXCEL", extension: "xlsx" },
};

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
  const [listAccounts] = useListAccountsMutation();
  useEffect(() => {
    listAccounts({ type: "CL" });
  }, [listAccounts]);
  const accountsResponse = useAppSelector(selectAccountsResponse);

  const liveLoanAccounts = useMemo(() => {
    const accounts = accountsResponse?.accounts ?? [];
    if (accounts.length === 0) return [];
    const clAccounts = accounts.filter(
      (a) => a.accountType === "CL" || a.type === "CL",
    );
    if (clAccounts.length > 0) {
      return clAccounts.map(mapLoanAccount);
    }
    const hasOtherTypes = accounts.some(
      (a) => a.accountType === "CA" || a.accountType === "TD",
    );
    if (hasOtherTypes) {
      return [];
    }
    return accounts.map(mapLoanAccount);
  }, [accountsResponse]);

  const loanAccounts = useMemo(() => {
    return liveLoanAccounts.length > 0 ? liveLoanAccounts : mockLoanAccounts;
  }, [liveLoanAccounts]);

  const outstandingByCcy = useMemo(() => {
    const totals = loanAccounts.reduce(
      (acc, loan) => {
        const currency = loan.currency?.toUpperCase();
        const balance = Number(loan.balance) || 0;
        if (currency === "KHR") acc.khr += balance;
        if (currency === "USD") acc.usd += balance;
        return acc;
      },
      { khr: 0, usd: 0 },
    );
    if (totals.khr === 0 && totals.usd === 0 && mockLoanSummary) {
      return {
        khr: mockLoanSummary.outstandingKhr,
        usd: mockLoanSummary.outstandingUsd,
      };
    }
    return totals;
  }, [loanAccounts]);

  // Starts with no loan pre-selected so on initial page load only LoansSidebar is visible
  const [selectedLoanId, setSelectedLoanId] = useState<string | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const selectedLoanAccount = useMemo(() => {
    if (!selectedLoanId) return undefined;
    return loanAccounts.find(
      (l) => l.id === selectedLoanId || l.number === selectedLoanId,
    );
  }, [loanAccounts, selectedLoanId]);

  const selectedIndex = useMemo(() => {
    if (!selectedLoanAccount) return 0;
    const idx = loanAccounts.findIndex(
      (l) => l.id === selectedLoanAccount.id || l.number === selectedLoanAccount.number,
    );
    return idx >= 0 ? idx : 0;
  }, [loanAccounts, selectedLoanAccount]);

  const selectedLoanColor = useMemo(() => {
    if (!selectedLoanAccount) return "#5CAFE4";
    return getLoanIndicatorColor(selectedLoanAccount, selectedIndex);
  }, [selectedLoanAccount, selectedIndex]);

  const selectedLoanDetails = useMemo(() => {
    if (selectedLoanId && loanDetailsById[selectedLoanId]) {
      return loanDetailsById[selectedLoanId];
    }
    if (selectedLoanAccount) {
      const byNumber = Object.values(loanDetailsById).find(
        (d) => d.borrower?.accountNumber === selectedLoanAccount.number,
      );
      if (byNumber) return byNumber;

      const isOverdraft =
        selectedLoanAccount.type?.toLowerCase().includes("overdraft") ||
        selectedLoanAccount.name?.toLowerCase().includes("overdraft") ||
        selectedLoanAccount.id === "overdraft";
      if (isOverdraft && loanDetailsById["overdraft"]) {
        return loanDetailsById["overdraft"];
      }
    }
    return loanDetailsById[DEFAULT_LOAN_DETAILS_KEY] ?? Object.values(loanDetailsById)[0];
  }, [selectedLoanId, selectedLoanAccount]);

  // Same pattern as `account/page.tsx`: `getAccountDetail` is a mutation with
  // no fetch-on-mount of its own — trigger it manually whenever the selected
  // loan changes and read the response back from the slice.
  const [getAccountDetail] = useGetAccountDetailMutation();
  useEffect(() => {
    if (selectedLoanAccount?.number) {
      getAccountDetail({ accountNumber: selectedLoanAccount.number, type: "CL" });
    }
  }, [selectedLoanAccount?.number, getAccountDetail]);

  const accountDetailResponse = useAppSelector(selectAccountDetailResponse);
  const detailReady = Boolean(
    accountDetailResponse &&
    (accountDetailResponse.accountNumber === selectedLoanAccount?.number ||
      accountDetailResponse.accountNumber === selectedLoanId),
  );
  const accountInfoDetail = useMemo(
    () => (detailReady ? accountDetailResponse! : undefined),
    [detailReady, accountDetailResponse],
  );

  const borrower = useMemo(
    () => ({
      ...selectedLoanDetails.borrower,
      name:
        accountInfoDetail?.accountName ||
        selectedLoanAccount?.name ||
        selectedLoanDetails.borrower.name,
      accountNumber:
        accountInfoDetail?.accountNumber ||
        selectedLoanAccount?.number ||
        selectedLoanDetails.borrower.accountNumber,
    }),
    [accountInfoDetail, selectedLoanAccount, selectedLoanDetails],
  );

  const schedule = useMemo(() => {
    return {
      ...selectedLoanDetails.schedule,
      outstandingPrincipal:
        selectedLoanAccount?.balance ?? selectedLoanDetails.schedule.outstandingPrincipal,
      currency:
        selectedLoanAccount?.currency ?? selectedLoanDetails.schedule.currency,
      accountType:
        selectedLoanAccount?.type ?? selectedLoanDetails.schedule.accountType,
      settlementAccountName: borrower.name,
      settlementAccountNumber: borrower.accountNumber,
    };
  }, [selectedLoanDetails, selectedLoanAccount, borrower]);

  const loanCashFlow = useMemo(
    () =>
      selectedLoanDetails.cashFlow.reduce(
        (totals, point) => ({
          expense: totals.expense + point.outflow,
          income: totals.income + point.inflow,
        }),
        { expense: 0, income: 0 },
      ),
    [selectedLoanDetails.cashFlow],
  );

  const handleExportStatements = async (value: BaseDownloadValue) => {
    if (!selectedLoanAccount?.number) return;
    try {
      const formatCfg = STATEMENT_DOWNLOAD_FORMATS[value.format];
      const range = resolveBaseDownloadRange(value.range);
      const blob = await downloadTransactionStatement({
        accountNumber: selectedLoanAccount.number,
        type: "CL",
        fileType: formatCfg.fileType,
        startedDate: range?.start.toISOString(),
        endedDate: range?.end.toISOString(),
      });
      downloadBlob(blob, `loan-statement-${selectedLoanAccount.number}.${formatCfg.extension}`);
      showToast("success", {
        title: "Download complete",
        message: `Statement saved as .${formatCfg.extension}`,
      });
    } catch {
      showToast("error", {
        title: "Download failed",
        message: "Could not export loan statement. Please try again.",
      });
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <LoanSummary
        totalKHR={outstandingByCcy.khr}
        totalUSD={outstandingByCcy.usd}
        loans={loanAccounts}
        expenseAmount={loanCashFlow.expense}
        incomeAmount={loanCashFlow.income}
        currency={schedule.currency ?? selectedLoanAccount?.currency ?? "USD"}
      />
      <Grid>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 700,
            color: "#5A6B82",
            lineHeight: 1.2,
            mb: 1.5,
            px: 0.5,
          }}
        >
          Loan Accounts
        </Typography>
      </Grid>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 3 }}>
          <LoansSidebar
            outstandingKhr={outstandingByCcy.khr}
            outstandingUsd={outstandingByCcy.usd}
            loans={loanAccounts}
            hideSummary
            selectedId={selectedLoanAccount?.id}
            onSelect={(id) => setSelectedLoanId(id)}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 9 }}>
          {selectedLoanAccount && (
            <Grid container spacing={2.5}>
              <Grid size={12}>
                <LoanDetailCard
                  key={selectedLoanAccount.id}
                  loanName={selectedLoanAccount.name}
                  accountNumber={selectedLoanAccount.number}
                  loanType={selectedLoanAccount.type || schedule.accountType}
                  outstandingAmount={selectedLoanAccount.balance}
                  currency={selectedLoanAccount.currency || schedule.currency}
                  accentColor={selectedLoanColor}
                  loanReference={
                    selectedLoanAccount.id === "overdraft"
                      ? "OD-2026-00014"
                      : "LN-2026-00087"
                  }
                  borrower={borrower}
                  schedule={schedule}
                  onOpenDetails={() => setDetailsOpen(true)}
                  onOpenAccountInfo={() => setDetailsOpen(true)}
                  onExportStatements={handleExportStatements}
                  onPayNow={() => {
                    showToast("info", {
                      title: "Loan Repayment",
                      message: "Proceeding to repayment...",
                    });
                  }}
                />
              </Grid>

              <Grid size={12}>
                <LoanTransactionsCard
                  key={selectedLoanAccount.id}
                  transactions={selectedLoanDetails.transactions}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>

      <LoanDetailsPanel
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        borrower={borrower}
        schedule={schedule}
        onDownloadSchedule={() => {
          showToast("info", {
            title: "Download Schedule",
            message: "Downloading loan schedule...",
          });
        }}
        onDownloadRemainingInstallments={() => {
          showToast("info", {
            title: "Download Installments",
            message: "Downloading remaining installments...",
          });
        }}
      />
    </Box>
  );
}
