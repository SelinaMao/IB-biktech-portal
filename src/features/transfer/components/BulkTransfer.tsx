"use client";

import React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Download, Globe } from "lucide-react";
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
      successTitle="Sent for checker approval"
      successMessage="The maker authorization is complete. The batch is waiting for a checker; recipients have not been paid yet."
      renderSuccess={({ result, handleClose }) => (
        <Stack spacing={2} sx={{ p: 3, alignItems: "center", textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Sent for checker approval</Typography>
          <Typography color="text.secondary">Batch {result?.referenceId} is waiting for a checker.</Typography>
          <Button variant="contained" onClick={handleClose}>Back to transfers</Button>
        </Stack>
      )}
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
          helperText="CSV or Excel using the bulk transfer template"
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
