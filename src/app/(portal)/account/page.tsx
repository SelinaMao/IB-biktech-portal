"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Grid } from "@mui/material";

import { resolveBaseDownloadRange, type BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import { resolveBaseFilterRange, type BaseFilterValue } from "@core/components/BaseFilter";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import { showToast } from "@core/components/AppToast";
import { useAppSelector } from "@/store/hooks";
import {
  AccountsSidebar,
  AccountSummaryPanel,
  getAccountIndicatorColor,
  ChangeRolloverOptionDialog,
  NewAccountDialog,
  TransactionDetailsPanel,
  TransactionsList,
  downloadAccountCertificate,
  downloadTransactionStatement,
  generateTransactionReceiptPdf,
  type TransactionDownloadFileType,
  selectAccountInfoDetail,
  selectFixedDepositDetail,
  selectAccountsResponse,
  selectAccountSummaryResponse,
  selectTransactionsForAccount,
  selectAccountTransactions,
  useGetAccountDetailMutation,
  useGetAccountSummaryMutation,
  useListAccountsMutation,
  useListTransactionsMutation,
  type TTransactionDetailResponse,
  type RolloverOption,
  type CoreAccountEntry,
  type IAccountDetailResponses,
  ROLLOVER_OPTIONS,
  mapCoreTransaction,
} from "@/features/account";
import { downloadBlob } from "@/utils/download-file";
import { formatAccountNumber } from "@/utils/format-account-number";
import AccountDetailsCard from "@/features/account/components/AccountDetailCard";
import AccountInformationDetail from "@/features/account/components/AccountInformationDetail";

const DEFAULT_TRANSACTIONS_FILTER: BaseFilterValue = { type: "thisMonth", from: null, to: null };
// "Latest Transactions" rows per page — each page is its own `listTransactions` call.
const TRANSACTIONS_PAGE_SIZE = 5;
// Maps BaseDownloadPanel's format to the API's `fileType` + the extension used for the saved file.
const STATEMENT_DOWNLOAD_FORMATS: Record<BaseDownloadValue["format"], { fileType: TransactionDownloadFileType; extension: string }> = {
  pdf: { fileType: "PDF", extension: "pdf" },
  csv: { fileType: "CSV", extension: "csv" },
  excel: { fileType: "EXCEL", extension: "xlsx" },
};

const SEARCH_DEBOUNCE_MS = 400;

export default function AccountPage() {
  const [listAccounts] = useListAccountsMutation();
  useEffect(() => {
    listAccounts();
  }, [listAccounts]);
  const accountsResponse = useAppSelector(selectAccountsResponse);

  const rawBankAccounts = useMemo(() => accountsResponse?.accounts ?? [], [accountsResponse?.accounts]);
  const coreSummary = accountsResponse?.summary ?? null;

  const bankAccounts = rawBankAccounts;
  const effectiveSummary = coreSummary;

  // Starts with no account pre-selected so on initial visit AccountsSidebar summary is selected
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId || selectedAccountId === "summary") return undefined;
    return bankAccounts.find(
      (account) =>
        account.id === selectedAccountId ||
        `${account.accountNumber}-${account.accountType}` === selectedAccountId ||
        account.accountNumber === selectedAccountId,
    );
  }, [bankAccounts, selectedAccountId]);

  const selectedIndex = useMemo(() => {
    if (!selectedAccountId || selectedAccountId === "summary") return 0;
    const idx = bankAccounts.findIndex(
      (account) =>
        account.id === selectedAccountId ||
        `${account.accountNumber}-${account.accountType}` === selectedAccountId ||
        account.accountNumber === selectedAccountId,
    );
    return idx >= 0 ? idx : 0;
  }, [bankAccounts, selectedAccountId]);

  const selectedAccountColor = useMemo(() => {
    if (!selectedAccount) return "#5AC0A0";
    return getAccountIndicatorColor(selectedAccount, selectedIndex);
  }, [selectedAccount, selectedIndex]);

  const accountNumber = selectedAccount?.accountNumber;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [accountInformationDetail, setaccountInformationDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TTransactionDetailResponse | null>(null);
  const [newAccountOpen, setNewAccountOpen] = useState(false);

  const [txnQuery, setTxnQuery] = useState("");
  const [debouncedTxnQuery, setDebouncedTxnQuery] = useState("");
  const [txnPage, setTxnPage] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTxnQuery(txnQuery);
      setTxnPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [txnQuery]);
  const [txnFilter, setTxnFilter] = useState<BaseFilterValue>(DEFAULT_TRANSACTIONS_FILTER);

  useEffect(() => {
    setTxnQuery("");
    setTxnFilter(DEFAULT_TRANSACTIONS_FILTER);
    setTxnPage(0);
  }, [selectedAccountId]);

  // Combined transactions for all accounts when on the default "Account Summary" view
  const [allAccountsTransactions, setAllAccountsTransactions] = useState<TTransactionDetailResponse[]>([]);
  const [isAllTxnLoading, setIsAllTxnLoading] = useState(false);
  const [allTxnError, setAllTxnError] = useState(false);

  const [pendingRolloverOption, setPendingRolloverOption] = useState<RolloverOption | null>(null);
  const [rolloverQrOpen, setRolloverQrOpen] = useState(false);
  const accounType = selectedAccount?.accountType ?? "";
  const isFixedDeposit = accounType === "TD" || (selectedAccount?.accountName || "").toLowerCase().includes("fixed");
  const isSaving = accounType === "SA";

  const [getAccountDetail] = useGetAccountDetailMutation();

  useEffect(() => {
    if (accountNumber) {
      getAccountDetail({ accountNumber, type: accounType });
    }
  }, [accountNumber, accounType, getAccountDetail]);

  const [getAccountSummary] = useGetAccountSummaryMutation();

  useEffect(() => {
    if (accountNumber) {
      getAccountSummary({ accountNumber, type: accounType });
    }
  }, [accountNumber, accounType, getAccountSummary]);

  const [listTransactions] = useListTransactionsMutation();

  const [isDownloadingTransaction, setIsDownloadingTransaction] = useState(false);
  const [isDownloadingStatement, setIsDownloadingStatement] = useState(false);

  // Single-account transactions fetch: only runs when an individual account is selected
  useEffect(() => {
    if (!selectedAccount?.accountNumber) return;
    const range = resolveBaseFilterRange(txnFilter);
    listTransactions({
      accountNumber: selectedAccount.accountNumber,
      type: selectedAccount.accountType,
      startedDate: range?.start.toISOString(),
      endedDate: range?.end.toISOString(),
      limit: TRANSACTIONS_PAGE_SIZE,
      offset: txnPage * TRANSACTIONS_PAGE_SIZE,
      search: debouncedTxnQuery || undefined,
    });
  }, [
    selectedAccount?.accountNumber,
    selectedAccount?.accountType,
    txnFilter,
    debouncedTxnQuery,
    txnPage,
    listTransactions,
  ]);

  // All-accounts transactions fetch: runs in default Account Summary view (!selectedAccount)
  useEffect(() => {
    if (selectedAccount) return;
    if (bankAccounts.length === 0) {
      setAllAccountsTransactions([]);
      return;
    }

    let isMounted = true;
    setIsAllTxnLoading(true);
    setAllTxnError(false);

    const range = resolveBaseFilterRange(txnFilter);
    const fetchPromises = bankAccounts.map(async (acc) => {
      try {
        const res = await listTransactions({
          accountNumber: acc.accountNumber,
          type: acc.accountType ?? acc.type ?? "",
          startedDate: range?.start.toISOString(),
          endedDate: range?.end.toISOString(),
          limit: 50,
          offset: 0,
        }).unwrap();
        return { account: acc, rows: res.rows };
      } catch {
        return { account: acc, rows: [] };
      }
    });

    Promise.all(fetchPromises)
      .then((results) => {
        if (!isMounted) return;
        const mapped: TTransactionDetailResponse[] = [];
        results.forEach(({ account: acc, rows }) => {
          rows.forEach((entry) => {
            const item = mapCoreTransaction(entry, {
              name: acc.accountName,
              number: acc.accountNumber,
            });
            const label =
              acc.accountName ||
              acc.accountClassDescription ||
              (acc.accountType === "CA" ? "Current Account" : "Savings Account");
            (item as any).accountLabel = `${label} - ${formatAccountNumber(acc.accountNumber)}`;
            (item as any).rawDate = entry.transactionDate;
            mapped.push(item);
          });
        });

        mapped.sort((a, b) => {
          const timeA = (a as any).rawDate ? dayjs((a as any).rawDate).valueOf() : 0;
          const timeB = (b as any).rawDate ? dayjs((b as any).rawDate).valueOf() : 0;
          return timeB - timeA;
        });

        setAllAccountsTransactions(mapped);
      })
      .catch(() => {
        if (isMounted) setAllTxnError(true);
      })
      .finally(() => {
        if (isMounted) setIsAllTxnLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedAccount, bankAccounts, txnFilter, listTransactions]);

  const filteredAllTransactions = useMemo(() => {
    if (!debouncedTxnQuery.trim()) return allAccountsTransactions;
    const q = debouncedTxnQuery.toLowerCase().trim();
    return allAccountsTransactions.filter((t) => {
      const desc = (t.transactionDescription || t.transactionCode || "").toLowerCase();
      const ref = (t.transactionReferenceCode || t.transactionId || "").toLowerCase();
      const toAcc = (t.toAccountNumber || t.toAccountName || "").toLowerCase();
      const fromAcc = (t.fromAccountNumber || t.fromAccountName || "").toLowerCase();
      const label = ((t as any).accountLabel || "").toLowerCase();
      const amt = String(t.transactionAmount ?? "");
      return (
        desc.includes(q) ||
        ref.includes(q) ||
        toAcc.includes(q) ||
        fromAcc.includes(q) ||
        label.includes(q) ||
        amt.includes(q)
      );
    });
  }, [allAccountsTransactions, debouncedTxnQuery]);

  const handleDownloadCertificate = async () => {
    if (!accountNumber) return;
    try {
      const blob = await downloadAccountCertificate({ accountNumber, type: accounType });
      downloadBlob(blob, `${accountNumber}-certificate.pdf`);
    } catch {
      showToast("error", {
        title: "Download failed",
        message: "Could not download the certificate. Please try again.",
      });
    }
  };

  const handleDownloadStatement = async (value: BaseDownloadValue) => {
    if (!accountNumber || isDownloadingStatement) return;
    setIsDownloadingStatement(true);
    try {
      const { start, end } = resolveBaseDownloadRange(value.range);
      const { fileType, extension } = STATEMENT_DOWNLOAD_FORMATS[value.format];

      const blob = await downloadTransactionStatement({
        accountNumber,
        type: accounType,
        startedDate: start.toISOString(),
        endedDate: end.toISOString(),
        fileType,
      });
      downloadBlob(blob, `${accountNumber}-statement.${extension}`);
    } catch {
      showToast("error", {
        title: "Download failed",
        message: "Could not download the statement. Please try again.",
      });
    } finally {
      setIsDownloadingStatement(false);
    }
  };

  const handleDownloadTransactionDetail = async (transaction: TTransactionDetailResponse) => {
    if (isDownloadingTransaction) return;
    setIsDownloadingTransaction(true);
    try {
      const blob = await generateTransactionReceiptPdf(transaction);
      downloadBlob(blob, `transaction-${transaction.transactionId}.pdf`);
    } catch {
      showToast("error", {
        title: "Download failed",
        message: "Could not generate transaction receipt.",
      });
    } finally {
      setIsDownloadingTransaction(false);
    }
  };

  const transactionsResponse = useAppSelector((state) =>
    selectTransactionsForAccount(state, selectedAccount?.accountNumber),
  );

  const apiTransactions = useAppSelector((state) =>
    selectAccountTransactions(state, selectedAccount?.accountNumber, selectedAccount?.accountName),
  );
  const transactionsStatus = transactionsResponse?.status ?? "loading";
  const selectedTransactions = apiTransactions ?? [];
  const transactionsTotal = transactionsResponse?.total ?? selectedTransactions.length;

  const accountInfoDetail = useAppSelector((state) =>
    accountNumber ? selectAccountInfoDetail(state, accountNumber) : undefined,
  );
  const fixedDepositDetail = useAppSelector((state) =>
    accountNumber ? selectFixedDepositDetail(state, accountNumber) : undefined,
  );
  const accountSummaryResponse = useAppSelector(selectAccountSummaryResponse);
  const selectedAccountSummary = useMemo(() => {
    if (!accountNumber || !accountSummaryResponse) return undefined;
    return accountSummaryResponse.accountNumber === accountNumber
      ? accountSummaryResponse.data
      : undefined;
  }, [accountNumber, accountSummaryResponse]);

  const effectiveInfo = accountInfoDetail;
  const effectiveFixedDeposit = fixedDepositDetail;
  const effectiveTransactions = selectedAccount ? selectedTransactions : filteredAllTransactions;
  const effectiveTxnStatus = selectedAccount
    ? transactionsStatus
    : isAllTxnLoading
      ? "loading"
      : allTxnError
        ? "failed"
        : "loaded";
  const effectiveTxnTotal = selectedAccount ? transactionsTotal : filteredAllTransactions.length;

  const selectedCompany = useMemo(
    () =>
      effectiveInfo
        ? {
          name: effectiveInfo.accountName,
          accountNumber: effectiveInfo.accountNumber,
        }
        : selectedAccount
          ? {
            name: selectedAccount.accountName,
            accountNumber: selectedAccount.accountNumber,
          }
          : undefined,
    [effectiveInfo, selectedAccount],
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2.5}>
        {/* Left Column: Accounts Sidebar */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <AccountsSidebar
            summary={effectiveSummary}
            accounts={bankAccounts}
            selectedId={selectedAccountId}
            onSelect={(id) => setSelectedAccountId(id)}
            onSelectSummary={() => setSelectedAccountId(undefined)}
          />
        </Grid>

        {/* Right Column: Account Detail Card + Transactions List */}
        <Grid size={{ xs: 12, lg: 9 }}>
          {selectedAccount ? (
            <Grid container spacing={2.5}>
              {/* Top Right: Account Details Card */}
              <Grid size={12}>
                <AccountDetailsCard
                  key={selectedAccount.id || `${selectedAccount.accountNumber}-${selectedAccount.accountType}`}
                  accounts={bankAccounts}
                  selectedAccount={selectedAccount}
                  accentColor={selectedAccountColor}
                  open={detailsOpen}
                  onClose={() => setDetailsOpen(false)}
                  info={effectiveInfo}
                  stats={effectiveInfo}
                  isFixedDeposit={isFixedDeposit}
                  isSaving={isSaving}
                  fixedDeposit={effectiveFixedDeposit}
                  summary={selectedAccountSummary}
                  onOpenAccountInfo={() => setaccountInformationDetail(true)}
                  onExportStatements={handleDownloadStatement}
                  onDownloadCertificate={handleDownloadCertificate}
                />
              </Grid>

              {/* Bottom Right: Transactions List */}
              <Grid size={12}>
                <TransactionsList
                  key={selectedAccount.id || `${selectedAccount.accountNumber}-${selectedAccount.accountType}`}
                  transactions={effectiveTransactions}
                  accentColor={selectedAccountColor}
                  isLoading={effectiveTxnStatus === "loading"}
                  error={effectiveTxnStatus === "failed"}
                  query={txnQuery}
                  onQueryChange={setTxnQuery}
                  showDateFilter
                  dateFilter={txnFilter}
                  onDateFilterChange={(value) => {
                    setTxnFilter(value);
                    setTxnPage(0);
                  }}
                  page={txnPage}
                  total={effectiveTxnTotal}
                  rowsPerPage={TRANSACTIONS_PAGE_SIZE}
                  onPageChange={setTxnPage}
                  showDownload
                  isDownloading={isDownloadingStatement}
                  onDownload={handleDownloadStatement}
                  onSelectTransaction={setSelectedTransaction}
                  isFixedDeposit={isFixedDeposit}
                  accountName={selectedAccount.accountName || effectiveInfo?.accountName}
                  accountNumber={selectedAccount.accountNumber}
                  accountType={selectedAccount.accountType}
                  onViewCertificate={() => { }}
                  onDownloadCertificate={() => { }}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2.5}>
              {/* Top Right: compact accounts-by-currency summary, shown until a card is clicked */}
              <Grid size={12}>
                <AccountSummaryPanel accounts={bankAccounts} summary={effectiveSummary} />
              </Grid>

              {/* Bottom Right: Transactions List for all accounts (summary view) */}
              <Grid size={12}>
                <TransactionsList
                  key="account-summary-all-transactions"
                  transactions={effectiveTransactions}
                  isLoading={effectiveTxnStatus === "loading"}
                  error={effectiveTxnStatus === "failed"}
                  query={txnQuery}
                  onQueryChange={setTxnQuery}
                  showDateFilter
                  dateFilter={txnFilter}
                  onDateFilterChange={(value) => {
                    setTxnFilter(value);
                    setTxnPage(0);
                  }}
                  page={txnPage}
                  total={effectiveTxnTotal}
                  rowsPerPage={TRANSACTIONS_PAGE_SIZE}
                  onPageChange={setTxnPage}
                  showDownload={false}
                  onSelectTransaction={setSelectedTransaction}
                  isFixedDeposit={false}
                  accountName="All Accounts"
                  accountNumber=""
                  accountType=""
                  accentColor="#5AC0A0"
                  onViewCertificate={() => { }}
                  onDownloadCertificate={() => { }}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Account Information Drawer (for when button is clicked) */}
      {selectedAccount && (effectiveInfo || selectedAccount) && (
        <AccountInformationDetail
          open={accountInformationDetail}
          onClose={() => setaccountInformationDetail(false)}
          info={effectiveInfo}
          fixedDeposit={effectiveFixedDeposit}
          isFixedDeposit={isFixedDeposit}
          selectedAccount={selectedAccount}
          onDownloadCertificate={handleDownloadCertificate}
          onChangeRollover={() => {
            const currentOption =
              ROLLOVER_OPTIONS.find(
                (o: RolloverOption) =>
                  o.label.toLowerCase() ===
                  (effectiveFixedDeposit?.renewalOption || "").toLowerCase(),
              ) ?? ROLLOVER_OPTIONS[0];
            setPendingRolloverOption(currentOption);
          }}
        />
      )}

      {/* Transaction Details Panel */}
      <TransactionDetailsPanel
        open={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        onDownload={handleDownloadTransactionDetail}
        isDownloading={isDownloadingTransaction}
      />

      <NewAccountDialog open={newAccountOpen} onClose={() => setNewAccountOpen(false)} />

      {effectiveFixedDeposit && pendingRolloverOption && (
        <ChangeRolloverOptionDialog
          open={Boolean(pendingRolloverOption)}
          onClose={() => setPendingRolloverOption(null)}
          companyName={selectedCompany?.name}
          accountNumber={selectedCompany?.accountNumber}
          currentOptionLabel={effectiveFixedDeposit.renewalOption || "Principal & Interest Rollover"}
          maturityDate={effectiveFixedDeposit.maturityDate ?? ""}
          initialOption={pendingRolloverOption}
          onSave={() => setRolloverQrOpen(true)}
        />
      )}

      <QrConfirmationDialog
        open={rolloverQrOpen}
        onApprove={() => {
          setRolloverQrOpen(false);
          setPendingRolloverOption(null);
          showToast("success", {
            title: "Rollover option updated",
            message: "The change will take effect at the next maturity date.",
          });
        }}
      />
    </Box>
  );
}
