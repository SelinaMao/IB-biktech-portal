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
  selectTransactionsForAccount,
  selectAccountTransactions,
  useGetAccountDetailMutation,
  useGetAccountSummaryMutation,
  useListAccountsMutation,
  useListTransactionsMutation,
  type TTransactionDetailResponse,
  type CoreAccountEntry,
  type RolloverOption,
} from "@/features/account";
import { downloadBlob } from "@/utils/download-file";
import AccountDetailsCard from "@/features/account/components/AccountDetailCard";
import AccountInformationDetail from "@/features/account/components/AccountInformationDetail";

const DEFAULT_TRANSACTIONS_FILTER: BaseFilterValue = { type: "all", from: null, to: null };
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

  const bankAccounts = accountsResponse?.accounts ?? [];
  const coreSummary = accountsResponse?.summary ?? null;
 
  const [accountNumber, setAccountNumber] = useState<string | undefined>();

  useEffect(() => {
    if (!accountNumber && bankAccounts.length > 0) {
      const defaultAccount = bankAccounts.find((account: CoreAccountEntry) => account.accountType === "CA") ?? bankAccounts[0];
      setAccountNumber(defaultAccount.accountNumber);
    }
  }, [bankAccounts, accountNumber]);

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
  }, [accountNumber]);

  const [pendingRolloverOption, setPendingRolloverOption] = useState<RolloverOption | null>(null);
  const [rolloverQrOpen, setRolloverQrOpen] = useState(false);
  const selectedAccount = bankAccounts.find((account) => account.accountNumber === accountNumber);
  const accounType = selectedAccount?.accountType ?? "";
  const isFixedDeposit = accounType === "TD";
  const isSaving = accounType === "SA";

  const [getAccountDetail] = useGetAccountDetailMutation();

  useEffect(() => {
    if (accountNumber) getAccountDetail({ accountNumber, type: accounType });
  }, [accountNumber, accounType, getAccountDetail]);

  const [getAccountSummary] = useGetAccountSummaryMutation();

  useEffect(() => {
    if (accountNumber) getAccountSummary({ accountNumber, type: accounType });
  }, [accountNumber, accounType, getAccountSummary]);

  const [listTransactions] = useListTransactionsMutation();

  const [isDownloadingTransaction, setIsDownloadingTransaction] = useState(false);
  const [isDownloadingStatement, setIsDownloadingStatement] = useState(false);

  useEffect(() => {
    if (!accountNumber) return;
    const range = resolveBaseFilterRange(txnFilter);
    listTransactions({
      accountNumber,
      type: accounType,
      startedDate: range?.start.toISOString(),
      endedDate: range?.end.toISOString(),
      limit: TRANSACTIONS_PAGE_SIZE,
      offset: txnPage * TRANSACTIONS_PAGE_SIZE,
      search: debouncedTxnQuery || undefined,
    });
  }, [accountNumber, accounType, txnFilter, debouncedTxnQuery, txnPage, listTransactions]);

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
      downloadBlob(blob, `${transaction.transactionId}-receipt.pdf`);
    } catch {
      showToast("error", {
        title: "Download failed",
        message: "Could not download the transaction receipt. Please try again.",
      });
    } finally {
      setIsDownloadingTransaction(false);
    }
  };

  const transactionsResponse = useAppSelector((state) => selectTransactionsForAccount(state, accountNumber));

  const apiTransactions = useAppSelector((state) =>
    selectAccountTransactions(state, accountNumber, selectedAccount?.accountName),
  );
  const transactionsStatus = transactionsResponse?.status ?? "loading";
  const transactionsTotal = transactionsResponse?.total ?? 0;

  const accountInfoDetail = useAppSelector((state) => selectAccountInfoDetail(state, accountNumber));
  const fixedDepositDetail = useAppSelector((state) => selectFixedDepositDetail(state, accountNumber));

  const selectedCompany = useMemo(
    () =>
      accountInfoDetail
        ? {
            name: accountInfoDetail.accountName,
            accountNumber: accountInfoDetail.accountNumber,
          }
        : undefined,
    [accountInfoDetail],
  );
  const selectedTransactions = apiTransactions ?? [];

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2.5}>
        {/* Left Column: Accounts Sidebar */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <AccountsSidebar
            summary={coreSummary}
            accounts={bankAccounts}
            selectedId={accountNumber}
            onSelect={(id) => setAccountNumber(id)}
          />
        </Grid>

        {/* Right Column: Account Detail Card + Transactions List */}
        <Grid size={{ xs: 12, lg: 9 }}>
          <Grid container spacing={2.5}>
            {/* Top Right: Account Details Card */}
            <Grid size={12} sx={{ width: "100%" }}>
              {(accountInfoDetail || selectedAccount) && (
                <AccountDetailsCard
                  accounts={bankAccounts}
                  selectedAccount={selectedAccount}
                  open={detailsOpen}
                  onClose={() => setDetailsOpen(false)}
                  key={accountNumber}
                  info={accountInfoDetail}
                  stats={accountInfoDetail}
                  isFixedDeposit={isFixedDeposit}
                  isSaving={isSaving}
                  fixedDeposit={fixedDepositDetail}
                  onOpenAccountInfo={() => setaccountInformationDetail(true)}
                  onExportStatements={handleDownloadStatement}
                  onDownloadCertificate={handleDownloadCertificate}
                />
              )}
            </Grid>

            {/* Bottom Right: Transactions List */}
            <Grid size={12}>
              <TransactionsList
                key={accountNumber}
                transactions={selectedTransactions}
                isLoading={transactionsStatus === "loading"}
                error={transactionsStatus === "failed"}
                query={txnQuery}
                onQueryChange={setTxnQuery}
                showDateFilter
                dateFilter={txnFilter}
                onDateFilterChange={(value) => {
                  setTxnFilter(value);
                  setTxnPage(0);
                }}
                page={txnPage}
                total={transactionsTotal}
                rowsPerPage={TRANSACTIONS_PAGE_SIZE}
                onPageChange={setTxnPage}
                showDownload
                isDownloading={isDownloadingStatement}
                onDownload={handleDownloadStatement}
                onSelectTransaction={setSelectedTransaction}
                isFixedDeposit={isFixedDeposit}
                accountName={selectedAccount?.accountName || accountInfoDetail?.accountName}
                accountNumber={accountNumber}
                onViewCertificate={() => {}}
                onDownloadCertificate={() => {}}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Account Information Drawer (for when button is clicked) */}
      {(accountInfoDetail || selectedAccount) && (
        <AccountInformationDetail
          open={accountInformationDetail}
          onClose={() => setaccountInformationDetail(false)}
          info={accountInfoDetail}
          fixedDeposit={fixedDepositDetail}
          isFixedDeposit={isFixedDeposit}
          selectedAccount={selectedAccount}
          onDownloadCertificate={handleDownloadCertificate}
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

      {fixedDepositDetail && pendingRolloverOption && (
        <ChangeRolloverOptionDialog
          open={Boolean(pendingRolloverOption)}
          onClose={() => setPendingRolloverOption(null)}
          companyName={selectedCompany?.name}
          accountNumber={selectedCompany?.accountNumber}
          currentOptionLabel="-"
          maturityDate={fixedDepositDetail.maturityDate ?? ""}
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
