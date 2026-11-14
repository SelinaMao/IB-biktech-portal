"use client";

import { useEffect, useMemo, useState } from "react";
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
  MOCK_DEPOSIT_ACCOUNT,
  MOCK_DEPOSIT_DETAIL,
  MOCK_DEPOSIT_TRANSACTIONS,
  ROLLOVER_OPTIONS,
} from "@/features/account";
import { downloadBlob } from "@/utils/download-file";
import AccountDetailsCard from "@/features/account/components/AccountDetailCard";
import AccountInformationDetail from "@/features/account/components/AccountInformationDetail";

const DEFAULT_TRANSACTIONS_FILTER: BaseFilterValue = { type: "last7Days", from: null, to: null };
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

  // Injects mock deposit account if no deposit / fixed deposit account is present in backend response
  const bankAccounts = useMemo(() => {
    const hasDeposit = rawBankAccounts.some(
      (a) =>
        a.accountType === "TD" ||
        a.accountType === "FD" ||
        (a.accountName || "").toLowerCase().includes("fixed") ||
        (a.accountClassDescription || "").toLowerCase().includes("deposit"),
    );

    if (!hasDeposit) {
      const companyName = rawBankAccounts[0]?.accountName || "BIKTECH SOLUTION CO., LTD.";
      const depositAccount: CoreAccountEntry = {
        ...MOCK_DEPOSIT_ACCOUNT,
        accountName: companyName,
      };
      return [...rawBankAccounts, depositAccount];
    }

    return rawBankAccounts;
  }, [rawBankAccounts]);

  const effectiveSummary = useMemo(() => {
    if (!coreSummary) return null;
    const isMockDepositAdded = bankAccounts.some(
      (a) => a.accountNumber === MOCK_DEPOSIT_ACCOUNT.accountNumber,
    );
    return {
      totalBalanceKHR: coreSummary.totalBalanceKHR,
      totalBalanceUSD:
        coreSummary.totalBalanceUSD +
        (isMockDepositAdded ? MOCK_DEPOSIT_ACCOUNT.availableBalance : 0),
    };
  }, [coreSummary, bankAccounts]);

  // Starts with no account pre-selected so on initial visit only AccountsSidebar is shown
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return undefined;
    return bankAccounts.find(
      (account) =>
        account.id === selectedAccountId ||
        `${account.accountNumber}-${account.accountType}` === selectedAccountId ||
        account.accountNumber === selectedAccountId,
    );
  }, [bankAccounts, selectedAccountId]);

  const selectedIndex = useMemo(() => {
    if (!selectedAccountId) return 0;
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

  // Shown before any card is clicked: the Current/USD account if there is one, else the first account.
  const defaultAccount = useMemo(
    () =>
      bankAccounts.find((a) => a.ccy === "USD" && a.accountType === "CA") ??
      bankAccounts.find((a) => a.accountType === "CA") ??
      bankAccounts[0],
    [bankAccounts],
  );
  // Drives the Transactions table: the clicked account once there is one, the default account until then —
  // so the table always has a real account's transactions, matching AccountSummaryPanel's "before selection" view.
  const txnAccount = selectedAccount ?? defaultAccount;
  const txnAccountNumber = txnAccount?.accountNumber;
  const txnAccountType = txnAccount?.accountType ?? "";
  const txnIsMockDeposit = txnAccount?.accountNumber === MOCK_DEPOSIT_ACCOUNT.accountNumber;

  const accountNumber = selectedAccount?.accountNumber;
  const isMockDeposit = selectedAccount?.accountNumber === MOCK_DEPOSIT_ACCOUNT.accountNumber;

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
  }, [txnAccountNumber]);

  const [pendingRolloverOption, setPendingRolloverOption] = useState<RolloverOption | null>(null);
  const [rolloverQrOpen, setRolloverQrOpen] = useState(false);
  const accounType = selectedAccount?.accountType ?? "";
  const isFixedDeposit = accounType === "TD" || (selectedAccount?.accountName || "").toLowerCase().includes("fixed");
  const isSaving = accounType === "SA";

  const [getAccountDetail] = useGetAccountDetailMutation();

  useEffect(() => {
    if (accountNumber && !isMockDeposit) {
      getAccountDetail({ accountNumber, type: accounType });
    }
  }, [accountNumber, accounType, isMockDeposit, getAccountDetail]);

  const [getAccountSummary] = useGetAccountSummaryMutation();

  useEffect(() => {
    if (accountNumber && !isMockDeposit) {
      getAccountSummary({ accountNumber, type: accounType });
    }
  }, [accountNumber, accounType, isMockDeposit, getAccountSummary]);

  const [listTransactions] = useListTransactionsMutation();

  const [isDownloadingTransaction, setIsDownloadingTransaction] = useState(false);
  const [isDownloadingStatement, setIsDownloadingStatement] = useState(false);

  useEffect(() => {
    if (!txnAccountNumber || txnIsMockDeposit) return;
    const range = resolveBaseFilterRange(txnFilter);
    listTransactions({
      accountNumber: txnAccountNumber,
      type: txnAccountType,
      startedDate: range?.start.toISOString(),
      endedDate: range?.end.toISOString(),
      limit: TRANSACTIONS_PAGE_SIZE,
      offset: txnPage * TRANSACTIONS_PAGE_SIZE,
      search: debouncedTxnQuery || undefined,
    });
  }, [txnAccountNumber, txnAccountType, txnFilter, debouncedTxnQuery, txnPage, txnIsMockDeposit, listTransactions]);

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

  const transactionsResponse = useAppSelector((state) => selectTransactionsForAccount(state, txnAccountNumber));

  const apiTransactions = useAppSelector((state) =>
    selectAccountTransactions(state, txnAccountNumber, txnAccount?.accountName),
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

  const mockDepositDetail: IAccountDetailResponses = useMemo(() => ({
    ...MOCK_DEPOSIT_DETAIL,
    accountName: selectedAccount?.accountName || "BIKTECH SOLUTION CO., LTD.",
    accountSettlementNumber: bankAccounts[0]?.accountNumber || "101200000903",
    settlementAccountName: selectedAccount?.accountName || "BIKTECH SOLUTION CO., LTD.",
  }), [selectedAccount, bankAccounts]);

  const effectiveInfo = isMockDeposit ? mockDepositDetail : accountInfoDetail;
  const effectiveFixedDeposit = isMockDeposit ? mockDepositDetail : fixedDepositDetail;
  const effectiveTransactions = txnIsMockDeposit ? MOCK_DEPOSIT_TRANSACTIONS : selectedTransactions;
  const effectiveTxnStatus = txnIsMockDeposit ? "loaded" : transactionsStatus;
  const effectiveTxnTotal = txnIsMockDeposit ? MOCK_DEPOSIT_TRANSACTIONS.length : transactionsTotal;

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

              {/* Bottom Right: Transactions List for the default account */}
              <Grid size={12}>
                <TransactionsList
                  key={txnAccount?.id || txnAccountNumber}
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
                  accountName={txnAccount?.accountName}
                  accountNumber={txnAccount?.accountNumber}
                  accountType={txnAccount?.accountType}
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
