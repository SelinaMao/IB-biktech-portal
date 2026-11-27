"use client";

import React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Clock, Download, Globe, Lock } from "lucide-react";
import { useForm } from "react-hook-form";

import { palette } from "@/theme/palette";
import BaseFromAccount from "@core/components/BaseFromAccount";
import BaseFileUpload from "@core/form/BaseFileUpload";
import PreviewTransfer, { type TransferPreviewField } from "./PreviewTransfer";
import { accountOptionLabel, findAccount } from "../transfer.utils";
import { useTransferAccounts } from "../use-transfer-accounts";
import {
  useLazyDownloadBulkTransferTemplateQuery,
  useRequestBulkTransferAuthenticatorMutation,
  useSubmitBulkTransferFileMutation,
  useValidateBulkTransferFileMutation,
} from "../transfer.api";
import { showToast } from "@core/components/AppToast";
import { toToastError } from "@/utils/api-error";
import { downloadBlob } from "@/utils/download-file";
import type { BulkValidationResult, TransferResult } from "../transfer.types";

export type BulkTransferProps = {
  open: boolean;
  onClose: () => void;
};

const formatAmountValue = (amount?: number) => {
  if (amount === undefined || amount === null) return "0";
  return amount % 1 === 0
    ? amount.toLocaleString("en-US")
    : amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function BulkTransfer({ open, onClose }: BulkTransferProps) {
  const [fromAccountId, setFromAccountId] = React.useState("");
  const [templateFormat, setTemplateFormat] = React.useState<"CSV" | "EXCEL">("CSV");
  const [file, setFile] = React.useState<File | null>(null);
  const [validation, setValidation] = React.useState<BulkValidationResult | null>(null);
  const [validateFile, { isLoading: validating }] = useValidateBulkTransferFileMutation();
  const [submitFile] = useSubmitBulkTransferFileMutation();
  const [requestBulkAuthenticator] = useRequestBulkTransferAuthenticatorMutation();
  const [downloadTemplate, { isFetching: downloadingTemplate }] = useLazyDownloadBulkTransferTemplateQuery();
  const { accounts } = useTransferAccounts(open);
  const { control, watch, setValue, reset } = useForm({ defaultValues: { fromAccountId: "" } });

  const watchedFromId = watch("fromAccountId");
  const accountId = watchedFromId || fromAccountId || accounts[0]?.id || "";
  const fromAccount = findAccount(accounts, accountId);

  React.useEffect(() => {
    if (!watchedFromId && accounts[0]?.id) {
      setFromAccountId(accounts[0].id);
      setValue("fromAccountId", accounts[0].id);
    }
  }, [accounts, watchedFromId, setValue]);

  React.useEffect(() => {
    if (!file || !fromAccount) {
      setValidation(null);
      return;
    }
    let cancelled = false;
    const body = new FormData();
    body.append("fromAccountNumber", fromAccount.number);
    body.append("file", file);
    void validateFile({ body, idempotencyKey: crypto.randomUUID() })
      .unwrap()
      .then((result) => {
        if (!cancelled) setValidation(result);
      })
      .catch((error) => {
        if (!cancelled) {
          setValidation(null);
          showToast("error", toToastError(error, "Could not validate the bulk transfer file"));
        }
      });
    return () => { cancelled = true; };
  }, [file, fromAccount?.number, validateFile]);

  const handleDownloadTemplate = async (format: "CSV" | "EXCEL") => {
    try {
      const blob = await downloadTemplate(format).unwrap();
      downloadBlob(blob, `bulk_transfer_template.${format.toLowerCase() === "excel" ? "xlsx" : "csv"}`);
    } catch (error) {
      showToast("error", toToastError(error, "Could not download bulk transfer template"));
    }
  };

  const previewFields: TransferPreviewField[] = [
    { label: "From Account", value: fromAccount ? accountOptionLabel(fromAccount) : "-" },
    { label: "Recipients File", value: file?.name ?? "-" },
    { label: "Records", value: validation?.summary.records ?? "Checking…" },
    ...(validation ? [{ label: "Transfer Amount", value: `${validation.summary.currency} ${validation.summary.transferAmount.toLocaleString("en-US")}` }] : []),
  ];

  const submit = async (idempotencyKey?: string): Promise<TransferResult> => {
    if (!file || !fromAccount || !idempotencyKey) throw new Error("Select an account and a valid file first.");
    const body = new FormData();
    body.append("fromAccountNumber", fromAccount.number);
    body.append("file", file);
    const response = await submitFile({ body, idempotencyKey }).unwrap();
    return {
      referenceId: response.referenceId,
      transferType: "BULK",
      method: "MANUAL",
      functionCode: "TRANSFER:BULK",
      status: response.status,
      failureReason: response.failureReason,
      workflowInstanceId: response.workflowInstanceId,
      fromAccountNumber: response.fromAccountNumber,
      fromAccountName: response.fromAccountName,
      amount: Number(response.amount),
      currency: response.currency,
      schedule: response.schedule,
      createdAt: response.createdAt,
      executedAt: response.executedAt,
      authenticator: response.authenticator,
    };
  };

  const validForAccount = validation?.fromAccountNumber === fromAccount?.number;
  const hasInvalidRows = (validation?.summary.invalidRecords ?? 0) > 0;

  const renewAuthenticator = async (referenceId: string, idempotencyKey: string) => {
    const result = await requestBulkAuthenticator({ body: referenceId, idempotencyKey }).unwrap();
    if (!result.authenticator) throw new Error("The service did not return a new authenticator QR.");
    return result.authenticator;
  };

  return (
    <PreviewTransfer
      splitView
      open={open}
      onClose={onClose}
      title="Bulk Transfer"
      icon={<Globe size={18} />}
      fromAccount={fromAccount ? { name: fromAccount.name, accountNumber: fromAccount.number, balance: fromAccount.balance, currency: fromAccount.currency } : undefined}
      toAccount={{ name: "Bulk Recipients", accountNumber: file?.name ?? "Batch file" }}
      topSection={<BaseFromAccount name="fromAccountId" control={control} accounts={accounts} />}
      canSubmit={Boolean(fromAccount && file && validForAccount && !hasInvalidRows && !validating)}
      previewFields={previewFields}
      successTitle="Bulk transfer sent for checker approval"
      successMessage="Maker authorization is complete. This transfer is now waiting for a checker; no recipient transfer has completed yet."
      renderSuccess={({ result, handleClose }) => {
        const currency = validation?.summary.currency ?? result?.currency ?? fromAccount?.currency ?? "USD";
        const rawAmount = validation?.summary.transferAmount ?? (result?.amount ? Number(result.amount) : 260);
        const formattedAmount = formatAmountValue(rawAmount);
        const recordsCount = validation?.summary.records ?? 3;
        const referenceId = result?.referenceId || "CORPEUVZV4Z2DAAD";
        const fromAccountDisplay = fromAccount
          ? `${fromAccount.name} · ${fromAccount.number}`
          : "SEAVINH HOLDINGS CO., LTD. · 1012000008021";

        const handleDownloadSummary = () => {
          const content = [
            `BULK TRANSFER SUMMARY`,
            `========================================`,
            `Status: Sent for checker approval`,
            `Reference: ${referenceId}`,
            `From: ${fromAccountDisplay}`,
            `Records: ${recordsCount} recipients`,
            `Processing Date: Immediate`,
            `Fee: ${currency} 0`,
            `Total Amount: ${currency} ${formattedAmount}`,
            `Total Debit Amount: ${currency} ${formattedAmount}`,
            `========================================`,
            `Note: ${currency} ${formattedAmount} is held pending approval. It's released if the transfer is rejected.`,
          ].join("\n");

          const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
          downloadBlob(blob, `bulk_transfer_${referenceId}.txt`);
          showToast("success", {
            title: "Download complete",
            message: `Summary for batch ${referenceId} has been downloaded.`,
          });
        };

        return (
          <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <Box
              sx={{
                width: { xs: "100%", sm: 460, md: 500 },
                maxWidth: "100%",
                bgcolor: "#FFFFFF",
                borderRadius: "20px",
                p: { xs: 3, sm: 4 },
                boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.06)",
                textAlign: "center",
                boxSizing: "border-box",
                mx: "auto",
              }}
            >
              {/* Top Status Icon (Clock in light blue circle) */}
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  bgcolor: "#EFF6FF",
                  color: "#0284C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2.5,
                }}
              >
                <Clock size={26} strokeWidth={2.2} />
              </Box>

              {/* Title */}
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#0F172A", mb: 1, textAlign: "center" }}>
                Bulk transfer sent for checker approval
              </Typography>

              {/* Subtitle */}
              <Typography sx={{ fontSize: 13.5, color: "#64748B", mb: 2.5, lineHeight: 1.5, textAlign: "center" }}>
                Maker authorization is complete. This transfer is now waiting for a checker; no recipient transfer has completed yet.
              </Typography>

              {/* Total Amount Display */}
              <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#0F172A", mb: 2.5, textAlign: "center" }}>
                {currency} {formattedAmount}
              </Typography>

              {/* Held Alert Banner */}
              <Box
                sx={{
                  bgcolor: "#FFFDF5",
                  border: "1px solid #FEF3C7",
                  borderRadius: "10px",
                  p: 1.75,
                  mb: 3,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  textAlign: "left",
                }}
              >
                <Lock size={16} color="#0F172A" style={{ marginTop: 2, flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", mb: 0.25 }}>
                    {currency} {formattedAmount} is held pending approval
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>
                    It&apos;s released if the transfer is rejected.
                  </Typography>
                </Box>
              </Box>

              {/* Details List with Dashed Dividers */}
              <Stack spacing={1.5} sx={{ mb: 3.5, width: "100%", textAlign: "left" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px dashed ${palette.slate[200]}`,
                    pb: 1.25,
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: "#64748B" }}>Records</Typography>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                    {recordsCount} recipients
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px dashed ${palette.slate[200]}`,
                    pb: 1.25,
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: "#64748B" }}>Reference</Typography>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                    {referenceId}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px dashed ${palette.slate[200]}`,
                    pb: 1.25,
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: "#64748B" }}>From</Typography>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", textAlign: "right" }}>
                    {fromAccountDisplay}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px dashed ${palette.slate[200]}`,
                    pb: 1.25,
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: "#64748B" }}>Processing date</Typography>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                    Immediate
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px dashed ${palette.slate[200]}`,
                    pb: 1.25,
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: "#64748B" }}>Fee</Typography>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                    {currency} 0
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pt: 0.5,
                  }}
                >
                  <Typography sx={{ fontSize: 13, color: "#64748B" }}>Total debit amount</Typography>
                  <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#0F172A" }}>
                    {currency} {formattedAmount}
                  </Typography>
                </Box>
              </Stack>

              {/* Action Buttons: Download summary & Back to transfers */}
              <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Download size={16} />}
                  onClick={handleDownloadSummary}
                  sx={{
                    height: 44,
                    borderRadius: "10px",
                    borderColor: "#CBD5E1",
                    color: "#0F172A",
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "#94A3B8",
                      bgcolor: "#F8FAFC",
                    },
                  }}
                >
                  Download summary
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleClose}
                  sx={{
                    height: 44,
                    borderRadius: "10px",
                    bgcolor: "#1B5299",
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#15427C",
                    },
                  }}
                >
                  Back to transfers
                </Button>
              </Stack>
            </Box>
          </Box>
        );
      }}
      submit={submit}
      renewAuthenticator={renewAuthenticator}
      onReset={() => {
        setFile(null);
        setValidation(null);
        setFromAccountId(accounts[0]?.id ?? "");
        reset({ fromAccountId: accounts[0]?.id ?? "" });
      }}
      onBackToMain={onClose}
    >
      <Stack spacing={2.5}>
        <BaseFileUpload
          label="Recipients File"
          value={file ? [file] : []}
          onChange={(files) => setFile(files[0] ?? null)}
          accept=".csv,.xlsx,.xls"
          helperText="Use Transfer Type, To Account / Bakong ID, Bank Code, Receiver Name, Amount, Currency, and Remark. International transfers are not supported in bulk files."
        />
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1.5}>
            {(["CSV", "EXCEL"] as const).map((format) => {
              const selected = templateFormat === format;
              return (
                <Button
                  key={format}
                  fullWidth
                  variant={selected ? "contained" : "outlined"}
                  onClick={() => setTemplateFormat(format)}
                  sx={{
                    height: 38,
                    borderRadius: "8px",
                    borderColor: selected ? "#1B5299" : palette.slate[200],
                    bgcolor: selected ? "#1B5299" : "#FFFFFF",
                    color: selected ? "#FFFFFF" : "#0F172A",
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "#1B5299",
                      bgcolor: selected ? "#15427C" : "#F8FAFC",
                      boxShadow: "none",
                    },
                  }}
                >
                  {format === "EXCEL" ? "Excel" : format}
                </Button>
              );
            })}
          </Stack>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Download size={14} />}
            disabled={downloadingTemplate}
            onClick={() => void handleDownloadTemplate(templateFormat)}
            sx={{
              height: 38,
              borderRadius: "8px",
              borderColor: palette.slate[200],
              bgcolor: "#FFFFFF",
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { borderColor: palette.slate[300], bgcolor: "#F8FAFC", boxShadow: "none" },
            }}
          >
            {downloadingTemplate ? "Downloading…" : `Download ${templateFormat === "EXCEL" ? "Excel" : "CSV"} template`}
          </Button>
        </Stack>
        {validating && <Alert severity="info">Checking each row against the selected source account…</Alert>}
        {validation && (
          <Stack spacing={1}>
            <Alert severity={hasInvalidRows ? "error" : "success"}>
              {validation.summary.validRecords} valid, {validation.summary.duplicateRecords} duplicate, {validation.summary.invalidRecords} invalid of {validation.summary.records} rows.
              {hasInvalidRows ? " Correct the invalid rows in the file and upload it again." : " Ready to submit for approval."}
            </Alert>
            {validation.rows.filter((row) => row.status === "INVALID").slice(0, 5).map((row) => (
              <Typography key={row.rowNumber} variant="caption" color="error">
                Row {row.rowNumber}: {row.message || "Check the account, currency, and amount."}
              </Typography>
            ))}
          </Stack>
        )}
      </Stack>
    </PreviewTransfer>
  );
}
