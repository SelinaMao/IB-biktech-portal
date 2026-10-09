"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Grid, Stack } from "@mui/material";

import BaseButton from "@core/components/BaseButton";
import { resolveBaseDownloadRange, type BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import { resolveBaseFilterRange, type BaseFilterValue } from "@core/components/BaseFilter";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import { showToast } from "@core/components/AppToast";
import { useAppSelector } from "@/store/hooks";
import {
  AccountDetails,
  AccountOverviewCard,
  AccountOverviewCardSkeleton,
  AccountsSidebar,
  ChangeRolloverOptionDialog,
  NewAccountDialog,
  TDAccountOverviewCard,
  TransactionDetailsPanel,
  TransactionsList,
  mapCashFlowPoints,
  matchRolloverOptionCode,
  downloadAccountCertificate,
  downloadTransactionStatement,
  generateTransactionReceiptPdf,
  type TransactionDownloadFileType,
  selectAccountInfoDetail,
  selectFixedDepositDetail,
  selectAccountSummaryResponse,
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
import { CirclePlus } from "lucide-react";
import AccountDetailsCard from "@/features/account/components/AccountDetailCard";

const DEFAULT_TRANSACTIONS_FILTER: BaseFilterValue = { type: "all", from: null, to: null };
// "Latest Transactions" rows per page — each page is its own `listTransactions` call.
const TRANSACTIONS_PAGE_SIZE = 10;
// Maps BaseDownloadPanel's format to the API's `fileType` + the extension used for the saved file.
const STATEMENT_DOWNLOAD_FORMATS: Record<BaseDownloadValue["format"], { fileType: TransactionDownloadFileType; extension: string }> = {
  pdf: { fileType: "PDF", extension: "pdf" },
  csv: { fileType: "CSV", extension: "csv" },
  excel: { fileType: "EXCEL", extension: "xlsx" },
};

const SEARCH_DEBOUNCE_MS = 400;

const DEFAULT_ACCOUNT_ID = "current";

/** Maps a core `typeAcct` code to the mock detail key that best represents it. */
const TYPE_ACCT_TO_DETAILS_KEY: Record<string, string> = {
  CA: "current",
  CL: "loan",
  TD: "fixed-deposit",
};

export default function AccountPage() {

  const [listAccounts, listAccountsResult] = useListAccountsMutation();
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
  const selectedDetailsKey = TYPE_ACCT_TO_DETAILS_KEY[accounType] ?? DEFAULT_ACCOUNT_ID;

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
    console.log("handleDownloadTransactionDetail", transaction);

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
  // Live term-deposit terms, when the selected account is a TD.
  const fixedDepositDetail = useAppSelector((state) => selectFixedDepositDetail(state, accountNumber));

  const accountSummaryResponse = useAppSelector(selectAccountSummaryResponse);
  const cashFlowData = useMemo(() => (accountSummaryResponse && accountSummaryResponse.accountNumber === accountNumber ? mapCashFlowPoints(accountSummaryResponse.data) : undefined), [accountSummaryResponse, accountNumber]);

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
        <Grid size={{ xs: 12, lg: 3 }}>
          <AccountsSidebar summary={coreSummary} accounts={bankAccounts} selectedId={accountNumber} onSelect={(id) => setAccountNumber(id)} />
        </Grid>

        <Grid size={{ xs: 12, lg: 9 }}>
          <Grid container spacing={2.5}
            sx={{
              bgcolor:"while",
              border:"1px solid"
            }}
          >
            <Grid size={12} sx={{
              width: "100%",
              bgcolor:"white",
              borderRadius:"20px"

            }}>
              {/* {accountInfoDetail && (
                <AccountDetailsCard
                  key={accountNumber}
                  open={detailsOpen}
                  onClose={() => setDetailsOpen(false)}
                  info={accountInfoDetail}
                  fixedDeposit={fixedDepositDetail}
                  onDownloadCertificate={handleDownloadCertificate}
                />
              )} */}

              {/* {!accountInfoDetail || !selectedCompany ? (
                    <AccountOverviewCardSkeleton />
                  ) : isFixedDeposit ? (
                    fixedDepositDetail && (
                      <TDAccountOverviewCard
                        key={accountNumber}
                        fixedDeposit={fixedDepositDetail}
                        company={selectedCompany}
                        onViewDetails={() => setDetailsOpen(true)}
                        currentRolloverCode={matchRolloverOptionCode("-")}
                        onChangeRollover={(option) => setPendingRolloverOption(option)}
                    />
                  )
                ) : (
                  <AccountOverviewCard key={accountNumber} company={selectedCompany} data={cashFlowData} stats={accountInfoDetail} onViewDetails={() => setDetailsOpen(true)} />
                )} */}
            </Grid>

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
                onViewCertificate={(format) => {
                  // TODO(api): open the term deposit certificate viewer in the chosen format.
                }}
                onDownloadCertificate={(format) => {
                  // TODO(api): request the term deposit certificate file in the chosen format.
                }}
              />
            </Grid>

            <Grid size={12}>
              <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                <BaseButton title="New Account" variant="contained" startIcon={<CirclePlus size={18} />} onClick={() => setNewAccountOpen(true)} />
              </Stack>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* {accountInfoDetail && (
        <AccountDetails
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          info={accountInfoDetail}
          fixedDeposit={fixedDepositDetail}
          onDownloadCertificate={handleDownloadCertificate}
        />
      )} */}

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
