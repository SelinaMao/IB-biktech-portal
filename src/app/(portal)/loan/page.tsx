"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Grid, Stack } from "@mui/material";
import { CirclePlus } from "lucide-react";

import BaseButton from "@core/components/BaseButton";
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
  loanDetailsById,
  loanAccounts as mockLoanAccounts,
  loanSummary as mockLoanSummary,
  type LoanAccountListItem,
  LoanTransactionsCard,
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
  const [listAccounts, listAccountsResult] = useListAccountsMutation();
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

  const [selectedLoanId, setSelectedLoanId] = useState<string | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Auto-select the first loan once the list loads so the overview/transactions panels
  // always show a selected loan.
  useEffect(() => {
    if (loanAccounts.length > 0) {
      const exists = loanAccounts.some(
        (l) => l.id === selectedLoanId || l.number === selectedLoanId,
      );
      if (!exists) {
        setSelectedLoanId(loanAccounts[0].id);
      }
    }
  }, [loanAccounts, selectedLoanId]);

  const selectedLoanAccount = useMemo(() => {
    return (
      loanAccounts.find((l) => l.id === selectedLoanId || l.number === selectedLoanId) ??
      loanAccounts[0]
    );
  }, [loanAccounts, selectedLoanId]);

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
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 3 }}>
          <LoansSidebar
            outstandingKhr={outstandingByCcy.khr}
            outstandingUsd={outstandingByCcy.usd}
            loans={loanAccounts}
            selectedId={selectedLoanAccount?.id ?? selectedLoanId}
            onSelect={(id) => setSelectedLoanId(id)}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 9 }}>
          <Grid container spacing={2.5}>
            <Grid size={12}>
              <LoanDetailCard
                key={selectedLoanAccount?.id ?? selectedLoanId}
                loanName={selectedLoanAccount?.name}
                accountNumber={selectedLoanAccount?.number}
                loanType={selectedLoanAccount?.type || schedule.accountType}
                outstandingAmount={selectedLoanAccount?.balance}
                currency={selectedLoanAccount?.currency || schedule.currency}
                loanReference={
                  selectedLoanAccount?.id === "overdraft"
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
                key={selectedLoanAccount?.id ?? selectedLoanId}
                transactions={selectedLoanDetails.transactions}
              />
            </Grid>
          </Grid>
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
