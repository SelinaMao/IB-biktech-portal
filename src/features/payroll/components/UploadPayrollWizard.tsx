"use client";

import React, { useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CreditCard,
  Download,
  FileCheck,
  Lock,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";

import { palette } from "@/theme/palette";
import BaseStep from "@core/components/BaseStep";
import { showToast } from "@core/components/AppToast";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import { INITIAL_REVIEW_ROWS, SOURCE_ACCOUNTS } from "../payroll.data";
import type { PayrollItem, ReviewPayrollRow } from "../payroll.types";
import EditPayrollRecordDialog from "./EditPayrollRecordDialog";

export interface UploadPayrollWizardProps {
  onBackToList: () => void;
  onSuccess: (newPayroll: PayrollItem) => void;
}

export default function UploadPayrollWizard({
  onBackToList,
  onSuccess,
}: UploadPayrollWizardProps) {
  // Wizard steps: 0 = "New", 1 = "Review", 2 = "Transfer"
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Step 1: Form state
  const [sourceAccountId, setSourceAccountId] = useState(SOURCE_ACCOUNTS[0].id);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    sizeStr: string;
    recordsCount: number;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Review records
  const [records, setRecords] = useState<ReviewPayrollRow[]>(INITIAL_REVIEW_ROWS);
  const [editingRow, setEditingRow] = useState<ReviewPayrollRow | null>(null);
  const [processingTiming, setProcessingTiming] = useState<"immediate" | "future">("future");
  const [futureDate, setFutureDate] = useState<string>("");
  const [agreedTerms, setAgreedTerms] = useState<boolean>(true);
  const [qrConfirmOpen, setQrConfirmOpen] = useState(false);
  const [approvalCondition, setApprovalCondition] = useState<"under_approval" | "approved">("under_approval");
  const dateInputRef = useRef<HTMLInputElement>(null);

  const selectedSourceAccount =
    SOURCE_ACCOUNTS.find((acc) => acc.id === sourceAccountId) ?? SOURCE_ACCOUNTS[0];

  // Validation metrics
  const errorCount = useMemo(
    () => records.filter((r) => r.validationState === "error").length,
    [records],
  );
  const warningCount = useMemo(
    () => records.filter((r) => r.validationState === "warning").length,
    [records],
  );
  const attentionCount = errorCount + warningCount;

  // Base numbers for the full uploaded batch (file has 24 total records, with 17 additional unlisted valid records)
  const baseUnlistedRecordsCount = 17;
  const baseUnlistedAmountKhr = 5870000;

  const totalBatchRecordsCount = records.length + baseUnlistedRecordsCount;

  // Total amount calculation
  const totalAmountKhr = useMemo(() => {
    const previewSum = records.reduce((acc, curr) => {
      const amt = curr.currency === "USD" ? curr.amount * 4000 : curr.amount;
      return acc + amt;
    }, 0);
    return previewSum + baseUnlistedAmountKhr;
  }, [records]);

  const feeKhr = totalBatchRecordsCount * 1000;
  const totalDebitKhr = totalAmountKhr + feeKhr;

  const remainingValidCount = useMemo(() => {
    const updatedCount = records.some(
      (r) => r.id === "rev-7" && r.validationState === "valid",
    )
      ? 1
      : 0;
    return baseUnlistedRecordsCount + updatedCount;
  }, [records]);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const order = { error: 0, warning: 1, valid: 2 };
      const diff = order[a.validationState] - order[b.validationState];
      if (diff !== 0) return diff;
      if (a.validationState === "valid" && b.validationState === "valid") {
        if (a.message === "Updated" && b.message !== "Updated") return -1;
        if (b.message === "Updated" && a.message !== "Updated") return 1;
      }
      return a.rowNumber - b.rowNumber;
    });
  }, [records]);

  const rawDateValue = useMemo(() => {
    if (!futureDate) return "";
    const d = dayjs(futureDate);
    return d.isValid() ? d.format("YYYY-MM-DD") : "";
  }, [futureDate]);

  const openDatePicker = () => {
    setProcessingTiming("future");
    try {
      if (dateInputRef.current && "showPicker" in dateInputRef.current) {
        dateInputRef.current.showPicker();
        return;
      }
    } catch {
      // Fallback
    }
    dateInputRef.current?.focus();
  };

  const handleDateChange = (val: string) => {
    if (!val) {
      setFutureDate("");
      return;
    }
    const d = dayjs(val);
    if (d.isValid()) {
      setFutureDate(d.format("D MMM YYYY"));
    } else {
      setFutureDate(val);
    }
  };

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const sizeFormatted =
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024) || 18} KB`;
      setSelectedFile({
        name: f.name,
        sizeStr: sizeFormatted,
        recordsCount: 24,
      });
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      const sizeFormatted =
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024) || 18} KB`;
      setSelectedFile({
        name: f.name,
        sizeStr: sizeFormatted,
        recordsCount: 24,
      });
    }
  };

  const handleDownloadTemplate = (format: "CSV" | "Excel") => {
    try {
      const csvContent =
        "Employee Name,Account Number,Bank,Amount,Currency,Remarks\n" +
        "Vannak Kim,001122334455,Canadia Bank,1200000,KHR,November Salary\n" +
        "Sreymom Pich,002233445566,Canadia Bank,1450000,KHR,November Salary\n" +
        "Bona Chhun,003344556677,Canadia Bank,980000,KHR,November Salary\n";
      const blob = new Blob([csvContent], {
        type: format === "CSV" ? "text/csv;charset=utf-8;" : "application/vnd.ms-excel",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payroll_template.${format === "CSV" ? "csv" : "xlsx"}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // fallback
    }
    showToast("success", {
      title: "Template Download",
      message: `Payroll template (${format}) downloaded successfully.`,
    });
  };

  // Row edit & delete handlers
  const handleUpdateRecord = (updated: ReviewPayrollRow) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r)),
    );
    showToast("success", {
      title: "Record Updated",
      message: `Row #${updated.rowNumber} updated successfully.`,
    });
  };

  const handleDeleteRecord = (rowId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== rowId));
    showToast("info", {
      title: "Record Deleted",
      message: "The record was removed from this payroll batch.",
    });
  };

  // Submission handler
  const handleCompleteTransfer = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const randomSeq = String(Math.floor(1000 + Math.random() * 9000));
    const refNo = `PR${yy}${mm}${dd}${randomSeq}`;

    const newPayroll: PayrollItem = {
      id: `pr-${Date.now()}`,
      processingDate: futureDate || "31 Oct 2026",
      referenceNo: refNo,
      fileName: selectedFile?.name || "payroll_nov_2026.xlsx",
      sourceAccountName: selectedSourceAccount.name,
      sourceAccountNumber: selectedSourceAccount.accountNumber,
      records: totalBatchRecordsCount,
      totalAmount: totalAmountKhr,
      fee: feeKhr,
      totalDebitAmount: totalDebitKhr,
      currency: "KHR",
      status: approvalCondition === "under_approval" ? "Pending" : "Completed",
      title: "November payroll",
      processingType: processingTiming === "future" ? "Scheduled" : "Immediate",
      createdAt: `${dd} Nov 2026 10:00 AM`,
      uploadedBy: "Rous Samol",
      remarks: "November 2026 Batch Payroll",
    };

    onSuccess(newPayroll);
  };

  const handleDownloadSummary = () => {
    showToast("info", {
      title: "Download Summary",
      message: "Payroll summary downloaded successfully.",
    });
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {/* Top Back link only when in Review step */}
      {currentStep === 1 && (
        <Button
          variant="text"
          onClick={() => setCurrentStep(0)}
          startIcon={<ChevronLeft size={18} />}
          sx={{
            color: "#1B5299",
            textTransform: "none",
            fontSize: 14,
            fontWeight: 600,
            p: 0,
            mb: 1,
            minWidth: 0,
            display: "inline-flex",
            alignItems: "center",
            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
          }}
        >
          Back
        </Button>
      )}

      {/* Page Title */}
      <Typography
        variant="h5"
        sx={{
          fontSize: { xs: 22, sm: 26 },
          fontWeight: 700,
          color: "#0F172A",
          mb: 2.5,
        }}
      >
        Upload payroll
      </Typography>

      {/* Steps Header Navigation: New, Review, Submit */}
      <Box sx={{ width: { xs: "100%", sm: 460, md: 500 }, maxWidth: "100%", mb: 3.5 }}>
        <BaseStep
          steps={["New", "Review", "Submit"]}
          activeStep={currentStep}
          onStepClick={(index) => {
            if (index === 0) setCurrentStep(0);
            else if (index === 1 && selectedFile) setCurrentStep(1);
          }}
        />
      </Box>

      {/* ================= STEP 1: NEW (Image 2) ================= */}
      {currentStep === 0 && (
        <Grid container spacing={3}>
          {/* Left Column: Form & File Upload Dropzone */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box
              sx={{
                bgcolor: "#FFFFFF",
                borderRadius: "16px",
                p: { xs: 2.5, sm: 3.5 },
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* From account */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#334155", mb: 1 }}>
                  From account
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    renderValue={(selectedId) => {
                      const acc =
                        SOURCE_ACCOUNTS.find((a) => a.id === selectedId) ?? SOURCE_ACCOUNTS[0];
                      return (
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                          <CreditCard size={16} color="#475569" />
                          <Typography sx={{ fontSize: 14, color: "#0F172A", fontWeight: 500 }}>
                            {acc.name} · {acc.accountNumber} · {acc.currency} {acc.balance}
                          </Typography>
                        </Stack>
                      );
                    }}
                    sx={{
                      borderRadius: "10px",
                      fontSize: 14,
                      bgcolor: "#FFFFFF",
                      "& fieldset": { borderColor: palette.slate[200] },
                    }}
                  >
                    {SOURCE_ACCOUNTS.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                          <CreditCard size={16} color="#475569" />
                          <Typography sx={{ fontSize: 14 }}>
                            {acc.name} · {acc.accountNumber} · {acc.currency} {acc.balance}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Payroll file */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#334155", mb: 1 }}>
                  Payroll file
                </Typography>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                {/* Dropzone */}
                <Box
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  sx={{
                    border: "1.5px dashed",
                    borderColor: dragOver ? "#1B5299" : "#DCE5EF",
                    borderRadius: "12px",
                    p: { xs: 3, sm: 4 },
                    textAlign: "center",
                    bgcolor: dragOver ? "#F0F7FF" : "#F8FAFC",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "#94A3B8",
                      bgcolor: "#F1F5F9",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      bgcolor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 1.5,
                      color: "#1B5299",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <Upload size={18} />
                  </Box>

                  <Typography sx={{ fontSize: 14, color: "#334155", mb: 0.5 }}>
                    Drag & drop your file here, or{" "}
                    <Box
                      component="span"
                      sx={{
                        color: "#1B5299",
                        fontWeight: 600,
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      choose file
                    </Box>
                  </Typography>

                  <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>
                    Excel or CSV in the payroll template format
                  </Typography>
                </Box>

                {/* Uploaded File Item Card (Image 2) */}
                {selectedFile && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: `1px solid ${palette.slate[200]}`,
                      borderRadius: "10px",
                      p: 1.75,
                      mt: 2,
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: "8px",
                          bgcolor: "#ECFDF5",
                          color: "#10B981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FileCheck size={20} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", lineHeight: 1.3 }}>
                          {selectedFile.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.25 }}>
                          {selectedFile.recordsCount} records · {selectedFile.sizeStr} · uploaded just now
                        </Typography>
                      </Box>
                    </Stack>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      sx={{ color: "#EF4444", p: 1, "&:hover": { bgcolor: "#FEF2F2" } }}
                      aria-label="Remove uploaded file"
                    >
                      <Trash2 size={17} />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* Bottom Card Actions */}
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ justifyContent: "flex-end", alignItems: "center", pt: 1 }}
              >
                <Button
                  variant="outlined"
                  onClick={onBackToList}
                  sx={{
                    height: 40,
                    px: 3,
                    borderRadius: "8px",
                    borderColor: palette.slate[200],
                    color: "#0F172A",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "none",
                    "&:hover": { borderColor: palette.slate[300], bgcolor: "#F8FAFC" },
                  }}
                >
                  Back
                </Button>

                <Button
                  variant="contained"
                  disabled={!selectedFile}
                  onClick={() => setCurrentStep(1)}
                  endIcon={<ArrowRight size={16} />}
                  sx={{
                    height: 40,
                    px: 3,
                    borderRadius: "8px",
                    bgcolor: "#1B5299",
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#15427C", boxShadow: "none" },
                    "&.Mui-disabled": {
                      bgcolor: "#8FAAC8",
                      color: "#FFFFFF",
                    },
                  }}
                >
                  Next
                </Button>
              </Stack>
            </Box>
          </Grid>

          {/* Right Column: Payroll template Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                bgcolor: "#FFFFFF",
                borderRadius: "16px",
                p: { xs: 2.5, sm: 3 },
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", mb: 0.5 }}>
                Payroll template
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#64748B", mb: 2.5 }}>
                Use our template so every record is read correctly.
              </Typography>

              {/* Download buttons */}
              <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => handleDownloadTemplate("CSV")}
                  startIcon={<Download size={14} />}
                  sx={{
                    flex: 1,
                    height: 38,
                    borderRadius: "8px",
                    borderColor: palette.slate[200],
                    color: "#0F172A",
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": { borderColor: palette.slate[300], bgcolor: "#F8FAFC" },
                  }}
                >
                  CSV
                </Button>

                <Button
                  variant="contained"
                  onClick={() => handleDownloadTemplate("Excel")}
                  startIcon={<Download size={14} />}
                  sx={{
                    flex: 1,
                    height: 38,
                    borderRadius: "8px",
                    bgcolor: "#249666",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#1E8257", boxShadow: "none" },
                  }}
                >
                  Excel
                </Button>
              </Stack>

              {/* Template Guidelines */}
              <Stack spacing={1.75}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                  <Check size={16} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 13, color: "#334155" }}>
                    One employee per row
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                  <Check size={16} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 13, color: "#334155" }}>
                    Account currency must match the source account (KHR)
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                  <Check size={16} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 13, color: "#334155" }}>
                    Remarks are optional, up to 140 characters
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* ================= STEP 2: REVIEW (Image 3) ================= */}
      {currentStep === 1 && (
        <Stack spacing={3}>
          {/* Main Card: Summary + Banner + Records Table */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "16px",
              p: { xs: 2.5, sm: 3.5 },
              boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Top Summary Tiles */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box
                  sx={{
                    bgcolor: "#F8FAFC",
                    borderRadius: "10px",
                    p: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      mb: 0.5,
                    }}
                  >
                    FROM ACCOUNT
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", mb: 0.25 }}>
                    {selectedSourceAccount.name} · {selectedSourceAccount.accountNumber}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>
                    Available {selectedSourceAccount.currency} {selectedSourceAccount.balance}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box
                  sx={{
                    bgcolor: "#F8FAFC",
                    borderRadius: "10px",
                    p: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748B",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      mb: 0.5,
                    }}
                  >
                    FILE
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", mb: 0.25 }}>
                    {selectedFile?.name || "payroll_nov_2026.xlsx"}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>
                    {selectedFile?.recordsCount || 24} records uploaded
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Attention or Success Banner */}
            {errorCount > 0 ? (
              <Box
                sx={{
                  bgcolor: "#FFFDF5",
                  border: "1px solid #FDE68A",
                  borderRadius: "10px",
                  p: 1.75,
                  mb: 2.5,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                }}
              >
                <AlertTriangle size={18} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", mb: 0.25 }}>
                    {attentionCount} of {totalBatchRecordsCount} records need attention
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>
                    Fix or delete the records in red to continue. Duplicates in yellow can stay.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  bgcolor: "#FFFFFF",
                  border: "1px solid #BBF7D0",
                  borderRadius: "10px",
                  p: 1.75,
                  mb: 2.5,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                }}
              >
                <CheckCircle2 size={18} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#15803D", mb: 0.25 }}>
                    {totalBatchRecordsCount} records ready to pay
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>
                    {warningCount > 0
                      ? "1 duplicate account remains (rows 3 and 15). You can continue — your approver will see this too."
                      : "All records are valid and ready to pay."}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Records Table */}
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#64748B",
                        py: 1.5,
                        borderBottom: `1px solid ${palette.slate[200]}`,
                        whiteSpace: "nowrap",
                      },
                    }}
                  >
                    <TableCell sx={{ width: "6%" }}>Row</TableCell>
                    <TableCell sx={{ width: "24%" }}>Employee name & account</TableCell>
                    <TableCell sx={{ width: "13%" }}>Employee ID</TableCell>
                    <TableCell sx={{ width: "15%" }}>Remarks</TableCell>
                    <TableCell sx={{ width: "14%" }}>Amount</TableCell>
                    <TableCell sx={{ width: "20%" }}>Message</TableCell>
                    <TableCell sx={{ width: "8%" }} align="right">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {sortedRecords.map((row) => {
                    const isError = row.validationState === "error";
                    const isWarning = row.validationState === "warning";
                    const rowBg = isError
                      ? "#FFF5F5"
                      : isWarning
                        ? "#FFFBEB"
                        : "#FFFFFF";

                    return (
                      <TableRow
                        key={row.id}
                        sx={{
                          bgcolor: rowBg,
                          "& td": {
                            py: 1.75,
                            borderBottom: `1px solid ${palette.slate[100]}`,
                            fontSize: 13,
                          },
                        }}
                      >
                        {/* Row */}
                        <TableCell sx={{ fontWeight: 500, color: "#0F172A" }}>
                          #{row.rowNumber}
                        </TableCell>

                        {/* Name & Account */}
                        <TableCell>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A", lineHeight: 1.3 }}>
                            {row.employeeName}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.25 }}>
                            {row.accountNumber}
                            {row.currency === "USD" ? " · USD" : ""}
                          </Typography>
                        </TableCell>

                        {/* Employee ID */}
                        <TableCell sx={{ color: "#0F172A", fontWeight: 500, fontSize: 13 }}>
                          {row.employeeId}
                        </TableCell>

                        {/* Remarks */}
                        <TableCell sx={{ color: "#64748B", fontSize: 13 }}>
                          {row.remarks}
                        </TableCell>

                        {/* Amount */}
                        <TableCell sx={{ fontWeight: 600, color: "#0F172A", fontSize: 13.5 }}>
                          {row.currency === "KHR"
                            ? `KHR ${row.amount.toLocaleString("en-US")}`
                            : `USD ${row.amount.toFixed(2)}`}
                        </TableCell>

                        {/* Message */}
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography
                            noWrap
                            title={row.message}
                            sx={{
                              fontSize: 12.5,
                              color:
                                row.message === "Updated"
                                  ? "#16A34A"
                                  : isError
                                    ? "#DC2626"
                                    : isWarning
                                      ? "#0F172A"
                                      : "#64748B",
                              fontWeight: row.message === "Updated" || isError ? 500 : 400,
                            }}
                          >
                            {row.message}
                          </Typography>
                        </TableCell>

                        {/* Action: Edit & Delete */}
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                            <IconButton
                              size="small"
                              onClick={() => setEditingRow(row)}
                              sx={{ color: "#475569", p: 0.75, "&:hover": { bgcolor: "#E2E8F0", color: "#0F172A" } }}
                              aria-label="Edit record"
                            >
                              <Pencil size={15} />
                            </IconButton>

                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRecord(row.id)}
                              sx={{ color: "#475569", p: 0.75, "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" } }}
                              aria-label="Delete record"
                            >
                              <Trash2 size={15} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography sx={{ fontSize: 12.5, color: "#64748B", mt: 2.5, pl: 0.5, fontWeight: 500 }}>
              + {remainingValidCount} more valid records
            </Typography>
          </Box>

          {/* Processing Date & Transaction Summary Cards */}
          <Grid container spacing={3}>
            {/* Left Card: Processing Date */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  bgcolor: "#FFFFFF",
                  borderRadius: "16px",
                  p: { xs: 2.5, sm: 3 },
                  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
                  height: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", mb: 2 }}>
                  Processing date
                </Typography>

                <RadioGroup
                  value={processingTiming}
                  onChange={(e) => setProcessingTiming(e.target.value as "immediate" | "future")}
                >
                  <FormControlLabel
                    value="immediate"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: palette.slate[400],
                          "&.Mui-checked": { color: "#1B5299" },
                        }}
                      />
                    }
                    label={<Typography sx={{ fontSize: 14, color: "#0F172A", fontWeight: 500 }}>Immediate</Typography>}
                    sx={{ mb: 1.5 }}
                  />

                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <FormControlLabel
                      value="future"
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: palette.slate[400],
                            "&.Mui-checked": { color: "#1B5299" },
                          }}
                        />
                      }
                      label={<Typography sx={{ fontSize: 14, color: "#0F172A", fontWeight: 500 }}>Future date</Typography>}
                      sx={{ mr: 0 }}
                    />
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={openDatePicker}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDatePicker();
                        }
                      }}
                      sx={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        height: 38,
                        borderRadius: "8px",
                        border: `1px solid ${processingTiming === "future" ? "#CBD5E1" : palette.slate[200]}`,
                        bgcolor: "#FFFFFF",
                        minWidth: 155,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: "#1B5299",
                        },
                      }}
                    >
                      <Calendar size={15} color="#64748B" style={{ flexShrink: 0 }} />
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: futureDate ? 500 : 400,
                          color: futureDate ? "#0F172A" : "#64748B",
                          userSelect: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {futureDate || "Select a date"}
                      </Typography>
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={rawDateValue}
                        min={dayjs().format("YYYY-MM-DD")}
                        onChange={(e) => handleDateChange(e.target.value)}
                        style={{
                          position: "absolute",
                          opacity: 0,
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          cursor: "pointer",
                        }}
                      />
                    </Box>
                  </Stack>
                </RadioGroup>
              </Box>
            </Grid>

            {/* Right Card: Transaction Summary */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  bgcolor: "#FFFFFF",
                  borderRadius: "16px",
                  p: { xs: 2.5, sm: 3 },
                  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
                  height: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", mb: 2 }}>
                  Transaction summary
                </Typography>

                {errorCount > 0 ? (
                  <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>
                    Totals appear once every record is valid.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: `1px dashed ${palette.slate[200]}`,
                        pb: 1,
                      }}
                    >
                      <Typography sx={{ fontSize: 13, color: "#64748B" }}>Number of records</Typography>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                        {totalBatchRecordsCount}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: `1px dashed ${palette.slate[200]}`,
                        pb: 1,
                      }}
                    >
                      <Typography sx={{ fontSize: 13, color: "#64748B" }}>Transfer amount</Typography>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                        KHR {totalAmountKhr.toLocaleString("en-US")}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: `1px dashed ${palette.slate[200]}`,
                        pb: 1,
                      }}
                    >
                      <Typography sx={{ fontSize: 13, color: "#64748B" }}>Fee</Typography>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                        KHR {feeKhr.toLocaleString("en-US")}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        pt: 0.25,
                      }}
                    >
                      <Typography sx={{ fontSize: 13, color: "#64748B" }}>Total debit amount</Typography>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#1B5299" }}>
                        KHR {totalDebitKhr.toLocaleString("en-US")}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Bottom Action Bar Card */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "16px",
              p: { xs: 2, sm: "16px 24px" },
              boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  size="small"
                  sx={{
                    color: palette.slate[400],
                    "&.Mui-checked": { color: "#1B5299" },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: 13.5, color: "#0F172A", fontWeight: 500 }}>
                  I agree to the Terms & Conditions
                </Typography>
              }
            />

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Button
                variant="outlined"
                onClick={() => setCurrentStep(0)}
                sx={{
                  height: 40,
                  px: 3,
                  borderRadius: "8px",
                  borderColor: palette.slate[200],
                  color: "#0F172A",
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: "none",
                  "&:hover": { borderColor: palette.slate[300], bgcolor: "#F8FAFC" },
                }}
              >
                Back
              </Button>

              <Button
                variant="contained"
                disabled={errorCount > 0 || !agreedTerms}
                onClick={() => setQrConfirmOpen(true)}
                endIcon={<ArrowRight size={16} />}
                sx={{
                  height: 40,
                  px: 3,
                  borderRadius: "8px",
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  bgcolor: "#1B5299",
                  color: "#FFFFFF",
                  "&:hover": { bgcolor: "#15427C", boxShadow: "none" },
                  "&.Mui-disabled": {
                    bgcolor: "#8FAAC8",
                    color: "#FFFFFF",
                  },
                }}
              >
                Next
              </Button>
            </Stack>
          </Box>
        </Stack>
      )}

      {/* ================= STEP 3: SUBMIT / CONFIRMATION (Images 9 & 10) ================= */}
      {currentStep === 2 && (
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Condition Switcher for Demo / Preview */}
          <Box
            sx={{
              display: "inline-flex",
              bgcolor: "#F1F5F9",
              p: 0.5,
              borderRadius: "10px",
              mb: 3,
            }}
          >
            <Button
              size="small"
              onClick={() => setApprovalCondition("under_approval")}
              sx={{
                textTransform: "none",
                fontSize: 12.5,
                fontWeight: 600,
                borderRadius: "8px",
                px: 2,
                py: 0.5,
                bgcolor: approvalCondition === "under_approval" ? "#FFFFFF" : "transparent",
                color: approvalCondition === "under_approval" ? "#1B5299" : "#64748B",
                boxShadow:
                  approvalCondition === "under_approval"
                    ? "0px 1px 3px rgba(0, 0, 0, 0.08)"
                    : "none",
                "&:hover": {
                  bgcolor: approvalCondition === "under_approval" ? "#FFFFFF" : "#E2E8F0",
                },
              }}
            >
              Sent for approval
            </Button>
            <Button
              size="small"
              onClick={() => setApprovalCondition("approved")}
              sx={{
                textTransform: "none",
                fontSize: 12.5,
                fontWeight: 600,
                borderRadius: "8px",
                px: 2,
                py: 0.5,
                bgcolor: approvalCondition === "approved" ? "#FFFFFF" : "transparent",
                color: approvalCondition === "approved" ? "#1B5299" : "#64748B",
                boxShadow:
                  approvalCondition === "approved"
                    ? "0px 1px 3px rgba(0, 0, 0, 0.08)"
                    : "none",
                "&:hover": {
                  bgcolor: approvalCondition === "approved" ? "#FFFFFF" : "#E2E8F0",
                },
              }}
            >
              Payroll scheduled
            </Button>
          </Box>

          <Box
            sx={{
              maxWidth: 440,
              width: "100%",
              bgcolor: "#FFFFFF",
              borderRadius: "20px",
              p: { xs: 3, sm: 4 },
              boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.06)",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            {/* Top Status Icon */}
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                bgcolor: approvalCondition === "under_approval" ? "#EFF6FF" : "#ECFDF5",
                color: approvalCondition === "under_approval" ? "#0284C7" : "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2.5,
              }}
            >
              {approvalCondition === "under_approval" ? (
                <Clock size={26} strokeWidth={2.2} />
              ) : (
                <CheckCircle2 size={26} strokeWidth={2.2} />
              )}
            </Box>

            {/* Title */}
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#0F172A", mb: 1 }}>
              {approvalCondition === "under_approval" ? "Sent for approval" : "Payroll scheduled"}
            </Typography>

            {/* Subtitle */}
            <Typography sx={{ fontSize: 13.5, color: "#64748B", mb: 2.5, lineHeight: 1.5 }}>
              {approvalCondition === "under_approval"
                ? `An approver from ABC Trading needs to approve this payroll before ${futureDate || "31 Oct 2026"}.`
                : `${totalBatchRecordsCount} employees will be paid on ${futureDate || "31 Oct 2026"}.`}
            </Typography>

            {/* Total Amount Display */}
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#0F172A", mb: 3 }}>
              KHR {totalAmountKhr.toLocaleString("en-US")}
            </Typography>

            {/* Blocked in Payroll Alert Banner (Condition 1 only) */}
            {approvalCondition === "under_approval" && (
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
                    KHR {totalAmountKhr.toLocaleString("en-US")} is Blocked in Payroll
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>
                    It&apos;s released if the payroll is rejected.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Transaction Details List with Dotted Dividers */}
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
                  {totalBatchRecordsCount} employees
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
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                  PR2610190006
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
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                  {selectedSourceAccount.name} · {selectedSourceAccount.accountNumber}
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
                  {futureDate || "31 Oct 2026"}
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
                  KHR {feeKhr.toLocaleString("en-US")}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  pt: 0.25,
                }}
              >
                <Typography sx={{ fontSize: 13, color: "#64748B" }}>Total debit amount</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                  KHR {totalDebitKhr.toLocaleString("en-US")}
                </Typography>
              </Box>
            </Stack>

            {/* Bottom Action Buttons */}
            <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
              <Button
                variant="outlined"
                onClick={handleDownloadSummary}
                startIcon={<Download size={16} />}
                sx={{
                  flex: 1,
                  height: 40,
                  borderRadius: "8px",
                  borderColor: palette.slate[200],
                  color: "#0F172A",
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { borderColor: palette.slate[300], bgcolor: "#F8FAFC" },
                }}
              >
                Download summary
              </Button>

              <Button
                variant="contained"
                onClick={handleCompleteTransfer}
                sx={{
                  flex: 1,
                  height: 40,
                  borderRadius: "8px",
                  bgcolor: "#1B5299",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#15427C", boxShadow: "none" },
                }}
              >
                Back to payroll
              </Button>
            </Stack>
          </Box>
        </Box>
      )}

      {/* Edit Record Modal Dialog (Image 4) */}
      <EditPayrollRecordDialog
        open={Boolean(editingRow)}
        row={editingRow}
        onClose={() => setEditingRow(null)}
        onUpdate={handleUpdateRecord}
        onDelete={handleDeleteRecord}
      />

      {/* Mobile App QR Confirmation Modal */}
      <QrConfirmationDialog
        open={qrConfirmOpen}
        countdownSeconds={120}
        onClose={() => setQrConfirmOpen(false)}
        onApprove={() => {
          setQrConfirmOpen(false);
          setCurrentStep(2);
        }}
        onRenew={async () => {
          showToast("info", {
            title: "QR Code Renewed",
            message: "A new QR confirmation code has been generated.",
          });
        }}
        title="Confirmations"
        instruction="Scan QR Code"
        subtitle="Use Biktech Banking App to scan the QR code and accept this payroll transfer."
        value={`PAYROLL-AUTH-${selectedFile?.name || "batch-nov-2026"}`}
      />
    </Box>
  );
}
