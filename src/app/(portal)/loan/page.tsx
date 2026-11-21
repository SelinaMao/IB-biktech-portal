"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Alert, Box, CircularProgress, Grid, Stack, Typography } from "@mui/material";

import { resolveBaseDownloadRange, type BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import { DEFAULT_PIE_COLORS } from "@core/components/PieChart";
import { showToast } from "@core/components/AppToast";
import { downloadBlob } from "@/utils/download-file";
import { useAppSelector } from "@/store/hooks";
import {
  downloadTransactionStatement,
  selectAccountsResponse,
  useGetAccountDetailMutation,
  useListAccountsMutation,
  type CoreAccountEntry,
  type IAccountDetailResponses,
} from "@/features/account";
import {
  LoanDetailCard,
  LoanDetailsPanel,
  LoanSummaryPanel,
  LoanTransactionsCard,
  LoansSidebar,
  getLoanIndicatorColor,
  type LoanAccountListItem,
  type LoanScheduleDetails,
  type LoanTransaction,
} from "@/features/loan";

const STATEMENT_DOWNLOAD_FORMATS: Record<
  BaseDownloadValue["format"],
  { fileType: "PDF" | "CSV" | "EXCEL"; extension: string }
> = {
  pdf: { fileType: "PDF", extension: "pdf" },
  csv: { fileType: "CSV", extension: "csv" },
  excel: { fileType: "EXCEL", extension: "xlsx" },
};

const mapLoanAccount = (entry: CoreAccountEntry): LoanAccountListItem => ({
  id: entry.accountNumber,
  name: entry.accountName,
  number: entry.accountNumber,
  type: entry.accountClassDescription || entry.accountType,
  balance: Number(entry.availableBalance) || 0,
  currency: entry.ccy,
});

function currencyAmount(amount: number | undefined, currency: string) {
  return `${currency} ${Number(amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function displayDate(value?: string | null) {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY") : value;
}

function mapInstallments(
  accountNumber: string,
  detail: IAccountDetailResponses,
  currency: string,
): LoanTransaction[] {
  let balance = Number(detail.ledgerBalance ?? detail.currentBalance ?? 0);
  return (detail.instalments ?? []).map((installment) => {
    const principal = Number(installment.principal) || 0;
    const interest = Number(installment.interest) || 0;
    const total = Number(installment.totalInstalment) || principal + interest;
    balance = Math.max(0, balance - principal);
    const date = installment.dueDate ?? "";
    const parsedDate = dayjs(date);
    const status = parsedDate.isValid() && parsedDate.isBefore(dayjs(), "day")
      ? "overdue"
      : parsedDate.isValid() && parsedDate.isSame(dayjs(), "day")
        ? "due"
        : "upcoming";
    const installmentNumber = installment.instNo ?? "";
    return {
      no: installmentNumber,
      title: `Installment ${installmentNumber}`,
      ref: `${accountNumber}-${installmentNumber}`,
      date,
      dueDate: displayDate(date),
      principal: currencyAmount(principal, currency),
      interest: currencyAmount(interest, currency),
      total: currencyAmount(total, currency),
      amount: currencyAmount(total, currency),
      balance: currencyAmount(balance, currency),
      direction: "out",
      status,
    };
  });
}

function mapSchedule(
  account: LoanAccountListItem,
  detail: IAccountDetailResponses,
  settlementAccountName?: string,
): LoanScheduleDetails {
  const installments = detail.instalments ?? [];
  const outstanding = Number(detail.ledgerBalance ?? detail.currentBalance ?? account.balance) || 0;
  const tenor = Number(detail.tenorOriginal) || 0;
  const remaining = Number(detail.totalInstalmentRemain ?? detail.tenorRemaining) || installments.length;
  const overdueCount = installments.filter((item) => dayjs(item.dueDate).isBefore(dayjs(), "day")).length;
  const frequency = detail.installmentFrequency?.replaceAll("_", " ") || "—";
  const tenorLabel = tenor && detail.tenorUnit
    ? `${tenor} ${detail.tenorUnit === "M" ? "months" : detail.tenorUnit}`
    : undefined;

  return {
    approvedLimit: Number(detail.loanAmount ?? account.balance) || 0,
    outstandingPrincipal: outstanding,
    interestRatePct: Number(detail.interestRate) || 0,
    nextInstallmentAmount: Number(detail.installmentAmount) || 0,
    nextInstallmentDate: displayDate(detail.nextPaymentDate),
    disbursementDate: displayDate(detail.disbursementDate),
    maturityDate: displayDate(detail.maturityDate),
    repaymentMethod: frequency,
    repaymentFrequency: frequency,
    remainingInstallments: remaining,
    totalInstallments: tenor || remaining,
    overdueCount,
    currency: account.currency,
    accountType: account.type,
    tenorLabel,
    settlementAccountName,
    settlementAccountNumber: detail.accountSettlementNumber || undefined,
  };
}

export default function LoanPage() {
  const [listAccounts, { isLoading: accountsLoading }] = useListAccountsMutation();
  const [getAccountDetail] = useGetAccountDetailMutation();
  const accountsResponse = useAppSelector(selectAccountsResponse);
  const [loanDetails, setLoanDetails] = useState<Record<string, IAccountDetailResponses>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string>();
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    listAccounts({ type: "CL" })
      .unwrap()
      .catch(() => showToast("error", { title: "Loans unavailable", message: "Could not load loan accounts from CBS." }));
  }, [listAccounts]);

  const liveLoanAccounts = useMemo(() => {
    const rows = accountsResponse?.accounts ?? [];
    return rows
      .filter((account) => account.accountType === "CL" || account.type === "CL")
      .map(mapLoanAccount);
  }, [accountsResponse]);

  useEffect(() => {
    let cancelled = false;
    if (!liveLoanAccounts.length) {
      setLoanDetails({});
      setDetailsLoading(false);
      return;
    }
    setDetailsLoading(true);
    void Promise.all(liveLoanAccounts.map(async (account) => {
      try {
        const detail = await getAccountDetail({ accountNumber: account.number, type: "CL" }).unwrap();
        return [account.number, detail] as const;
      } catch {
        return null;
      }
    })).then((results) => {
      if (cancelled) return;
      const loaded = Object.fromEntries(results.filter((item): item is NonNullable<typeof item> => item !== null));
      setLoanDetails(loaded);
      setDetailsLoading(false);
      if (Object.keys(loaded).length !== liveLoanAccounts.length) {
        showToast("error", { title: "Loan details unavailable", message: "Some CBS loan details could not be loaded." });
      }
    });
    return () => { cancelled = true; };
  }, [liveLoanAccounts, getAccountDetail]);

  const loanAccounts = useMemo(() => liveLoanAccounts.map((account) => {
    const detail = loanDetails[account.number];
    return {
      ...account,
      balance: Number(detail?.ledgerBalance ?? detail?.currentBalance ?? account.balance) || 0,
    };
  }), [liveLoanAccounts, loanDetails]);

  const outstandingByCcy = useMemo(() => loanAccounts.reduce(
    (totals, account) => {
      const currency = account.currency.toUpperCase();
      if (currency === "KHR") totals.khr += account.balance;
      if (currency === "USD") totals.usd += account.balance;
      return totals;
    },
    { khr: 0, usd: 0 },
  ), [loanAccounts]);

  const selectedLoanAccount = loanAccounts.find((account) => account.id === selectedLoanId || account.number === selectedLoanId);
  const selectedIndex = selectedLoanAccount
    ? loanAccounts.findIndex((account) => account.id === selectedLoanAccount.id)
    : 0;
  const selectedLoanColor = selectedLoanAccount
    ? getLoanIndicatorColor(selectedLoanAccount, selectedIndex)
    : DEFAULT_PIE_COLORS[0];
  const accountInfoDetail = selectedLoanAccount ? loanDetails[selectedLoanAccount.number] : undefined;
  const settlementAccountName = accountInfoDetail?.accountSettlementNumber
    ? accountsResponse?.accounts.find((account) => account.accountNumber === accountInfoDetail.accountSettlementNumber)?.accountName
    : undefined;
  const schedule = selectedLoanAccount && accountInfoDetail
    ? mapSchedule(selectedLoanAccount, accountInfoDetail, settlementAccountName)
    : undefined;
  const borrowerStatus = accountInfoDetail?.status?.toUpperCase() === "CLOSED"
    ? "closed"
    : schedule?.overdueCount
      ? "overdue"
      : "active";
  const borrower = selectedLoanAccount && accountInfoDetail ? {
    name: accountInfoDetail.fullName || accountInfoDetail.accountName || selectedLoanAccount.name,
    accountNumber: accountInfoDetail.accountNumber || selectedLoanAccount.number,
    status: borrowerStatus as "active" | "overdue" | "closed",
  } : undefined;
  const repayments = selectedLoanAccount && accountInfoDetail
    ? mapInstallments(selectedLoanAccount.number, accountInfoDetail, selectedLoanAccount.currency)
    : [];

  const handleExportStatements = async (value: BaseDownloadValue) => {
    if (!selectedLoanAccount?.number) return;
    try {
      const format = STATEMENT_DOWNLOAD_FORMATS[value.format];
      const range = resolveBaseDownloadRange(value.range);
      const blob = await downloadTransactionStatement({
        accountNumber: selectedLoanAccount.number,
        type: "CL",
        fileType: format.fileType,
        startedDate: range?.start.toISOString(),
        endedDate: range?.end.toISOString(),
      });
      downloadBlob(blob, `loan-statement-${selectedLoanAccount.number}.${format.extension}`);
      showToast("success", { title: "Download complete", message: `Statement saved as .${format.extension}` });
    } catch {
      showToast("error", { title: "Download failed", message: "Could not export loan statement. Please try again." });
    }
  };

  const downloadSchedule = (rows: LoanTransaction[], fileName: string) => {
    const header = ["Installment", "Due Date", "Principal", "Interest", "Total", "Remaining Balance"];
    const values = rows.map((row) => [row.no ?? "", row.dueDate ?? row.date, row.principal, row.interest, row.total, row.balance]);
    const csvValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [header, ...values].map((row) => row.map(csvValue).join(",")).join("\r\n");
    downloadBlob(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }), fileName);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {accountsLoading && loanAccounts.length === 0 ? (
        <Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">Loading loan accounts from CBS…</Typography>
        </Stack>
      ) : loanAccounts.length === 0 ? (
        <Alert severity="info">No loan accounts were returned by CBS.</Alert>
      ) : (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 3 }}>
            <LoansSidebar
              outstandingKhr={outstandingByCcy.khr}
              outstandingUsd={outstandingByCcy.usd}
              loans={loanAccounts}
              selectedId={selectedLoanAccount?.id}
              onSelect={setSelectedLoanId}
              onSelectSummary={() => setSelectedLoanId(undefined)}
            />
          </Grid>

          <Grid size={{ xs: 12, lg: 9 }}>
            {selectedLoanAccount ? schedule && borrower ? (
              <Grid container spacing={2.5}>
                <Grid size={12}>
                  <LoanDetailCard
                    key={selectedLoanAccount.id}
                    loanName={selectedLoanAccount.name}
                    accountNumber={selectedLoanAccount.number}
                    loanType={selectedLoanAccount.type}
                    outstandingAmount={selectedLoanAccount.balance}
                    currency={selectedLoanAccount.currency}
                    accentColor={selectedLoanColor}
                    schedule={schedule}
                    borrower={borrower}
                    onOpenDetails={() => setDetailsOpen(true)}
                    onOpenAccountInfo={() => setDetailsOpen(true)}
                    onExportStatements={handleExportStatements}
                    onPayNow={() => showToast("info", { title: "Loan Repayment", message: "Repayment is not available from this screen yet." })}
                  />
                </Grid>
                <Grid size={12}>
                  <LoanTransactionsCard
                    key={selectedLoanAccount.id}
                    transactions={repayments}
                    accentColor={selectedLoanColor}
                    borrowerName={borrower.name}
                    borrowerAccountNumber={borrower.accountNumber}
                  />
                </Grid>
              </Grid>
            ) : (
              <Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}>
                <CircularProgress size={28} />
                <Typography color="text.secondary">Loading CBS loan details…</Typography>
              </Stack>
            ) : (
              <Grid container spacing={2.5}>
                <Grid size={12}>
                  <LoanSummaryPanel loans={loanAccounts} totalKHR={outstandingByCcy.khr} totalUSD={outstandingByCcy.usd} />
                </Grid>
                <Grid size={12}>
                  <LoanTransactionsCard transactions={[]} accentColor="#5AC0A0" />
                </Grid>
              </Grid>
            )}
          </Grid>
        </Grid>
      )}

      {selectedLoanAccount && borrower && schedule && (
        <LoanDetailsPanel
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          borrower={borrower}
          schedule={schedule}
          onDownloadSchedule={() => downloadSchedule(repayments, `loan-schedule-${selectedLoanAccount.number}.csv`)}
          onDownloadRemainingInstallments={() => downloadSchedule(repayments, `loan-remaining-installments-${selectedLoanAccount.number}.csv`)}
        />
      )}
      {detailsLoading && loanAccounts.length > 0 && <Typography variant="caption" color="text.secondary">Refreshing loan details from CBS…</Typography>}
    </Box>
  );
}
