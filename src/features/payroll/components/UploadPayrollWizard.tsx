"use client";

import React, { useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";

import { palette } from "@/theme/palette";
import BaseStep from "@core/components/BaseStep";
import { showToast } from "@core/components/AppToast";
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
  } | null>({
    name: "payroll_nov_2026.xlsx",
    sizeStr: "1.8 KB",
    recordsCount: 24,
  });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Review records
  const [records, setRecords] = useState<ReviewPayrollRow[]>(INITIAL_REVIEW_ROWS);
  const [editingRow, setEditingRow] = useState<ReviewPayrollRow | null>(null);
  const [processingTiming, setProcessingTiming] = useState<"immediate" | "future">("immediate");
  const [futureDate, setFutureDate] = useState<string>("");
  const [agreedTerms, setAgreedTerms] = useState<boolean>(false);

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

  // Total amount calculation
  const totalAmountKhr = useMemo(() => {
    return records.reduce((acc, curr) => {
      const amt = curr.currency === "USD" ? curr.amount * 4000 : curr.amount;
      return acc + amt;
    }, 0);
  }, [records]);

  const feeKhr = 24000;
  const totalDebitKhr = totalAmountKhr + feeKhr;

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile({
        name: f.name,
        sizeStr: `${(f.size / 1024).toFixed(1)} KB`,
        recordsCount: 24,
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setSelectedFile({
        name: f.name,
        sizeStr: `${(f.size / 1024).toFixed(1)} KB`,
        recordsCount: 24,
      });
    }
  };

  const handleDownloadTemplate = (format: "CSV" | "Excel") => {
    showToast("success", {
      title: "Template Download",
      message: `Downloading payroll template as ${format}...`,
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
      processingDate:
        processingTiming === "future" && futureDate
          ? futureDate
          : `${dd} Nov 2026`,
      referenceNo: refNo,
      fileName: selectedFile?.name || "payroll_nov_2026.xlsx",
      sourceAccountName: selectedSourceAccount.name,
      sourceAccountNumber: selectedSourceAccount.accountNumber,
      records: records.length,
      totalAmount: totalAmountKhr,
      fee: feeKhr,
      totalDebitAmount: totalDebitKhr,
      currency: "KHR",
      status: "Pending",
      title: "November payroll",
      processingType: processingTiming === "future" ? "Scheduled" : "Immediate",
      createdAt: `${dd} Nov 2026 10:00 AM`,
      uploadedBy: "Rous Samol",
      remarks: "November 2026 Batch Payroll",
    };

    onSuccess(newPayroll);
  };

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {/* Back button link */}
      <Button
        variant="text"
        onClick={() => {
          if (currentStep > 0) setCurrentStep((prev) => prev - 1);
          else onBackToList();
        }}
        startIcon={<ArrowLeft size={16} />}
        sx={{
          color: "#1B5299",
          textTransform: "none",
          fontSize: 14,
          fontWeight: 600,
          p: 0,
          mb: 1.5,
          "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
        }}
      >
        Back
      </Button>

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

      {/* Steps Header Navigation using BaseStep matching the Transfer page */}
      <Box sx={{ width: { xs: "100%", sm: 460, md: 500 }, maxWidth: "100%", mb: 3.5 }}>
        <BaseStep
          steps={["New", "Review", "Transfer"]}
          activeStep={currentStep}
          onStepClick={(index) => {
            if (index === 0) setCurrentStep(0);
            else if (index === 1 && selectedFile) setCurrentStep(1);
            else if (index === 2 && currentStep === 1 && errorCount === 0 && agreedTerms) {
              setCurrentStep(2);
            }
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
                    sx={{
                      borderRadius: "10px",
                      fontSize: 14,
                      bgcolor: "#FFFFFF",
                      "& fieldset": { borderColor: palette.slate[200] },
                    }}
                  >
                    {SOURCE_ACCOUNTS.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.name} · {acc.accountNumber} · {acc.currency} {acc.balance}
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
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  sx={{
                    border: "2px dashed",
                    borderColor: dragOver ? "#1B5299" : "#DCE5EF",
                    borderRadius: "12px",
                    p: 4,
                    textAlign: "center",
                    bgcolor: dragOver ? "#F0F7FF" : "#FFFFFF",
                    mb: 2,
                    transition: "all 0.15s ease",
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      bgcolor: "#F0F7FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 1.5,
                      color: "#1B5299",
                    }}
                  >
                    <Upload size={20} />
                  </Box>

                  <Typography sx={{ fontSize: 14, color: "#334155", mb: 0.5 }}>
                    Drag & drop your file here, or{" "}
                    <Box
                      component="span"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        color: "#1B5299",
                        fontWeight: 600,
                        cursor: "pointer",
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

                {/* Uploaded File Item Card */}
                {selectedFile && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: `1px solid ${palette.slate[200]}`,
                      borderRadius: "10px",
                      p: 1.75,
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "8px",
                          bgcolor: "#ECFDF5",
                          color: "#10B981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FileSpreadsheet size={18} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                          {selectedFile.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#64748B" }}>
                          {selectedFile.recordsCount} records · {selectedFile.sizeStr} · uploaded just now
                        </Typography>
                      </Box>
                    </Stack>

                    <IconButton
                      size="small"
                      onClick={() => setSelectedFile(null)}
                      sx={{ color: "#EF4444", "&:hover": { bgcolor: "#FEF2F2" } }}
                    >
                      <Trash2 size={16} />
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
                    color: "#334155",
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
                    "&.Mui-disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" },
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
                    fontWeight: 500,
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
                    bgcolor: "#2E9D68",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 500,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#248356", boxShadow: "none" },
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
          {/* Top Summary Bar */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box
                sx={{
                  bgcolor: "#FFFFFF",
                  borderRadius: "14px",
                  p: 2.25,
                  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", mb: 0.5 }}>
                  FROM ACCOUNT
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
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
                  bgcolor: "#FFFFFF",
                  borderRadius: "14px",
                  p: 2.25,
                  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", mb: 0.5 }}>
                  FILE
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  {selectedFile?.name || "payroll_nov_2026.xlsx"}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>
                  {records.length} records uploaded
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Attention Banner if warning or errors exist */}
          {attentionCount > 0 && (
            <Alert
              severity="warning"
              icon={<AlertTriangle size={20} color="#D97706" />}
              sx={{
                bgcolor: "#FFFBEB",
                border: "1px solid #FCD34D",
                borderRadius: "12px",
                color: "#92400E",
                "& .MuiAlert-message": { width: "100%" },
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>
                {attentionCount} of {records.length} records need attention
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#B45309" }}>
                Fix or delete the records in red to continue. Duplicates in yellow can stay.
              </Typography>
            </Alert>
          )}

          {/* Records Table Card */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "16px",
              p: { xs: 2, sm: 3 },
              boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
            }}
          >
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
                    <TableCell sx={{ width: "12%" }}>Employee ID</TableCell>
                    <TableCell sx={{ width: "16%" }}>Remarks</TableCell>
                    <TableCell sx={{ width: "14%" }}>Amount</TableCell>
                    <TableCell sx={{ width: "20%" }}>Message</TableCell>
                    <TableCell sx={{ width: "8%" }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {records.map((row) => {
                    const isError = row.validationState === "error";
                    const isWarning = row.validationState === "warning";
                    const rowBg = isError
                      ? "#FEF2F2"
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
                        <TableCell sx={{ fontWeight: 600, color: "#64748B" }}>
                          #{row.rowNumber}
                        </TableCell>

                        {/* Name & Account */}
                        <TableCell>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                            {row.employeeName}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: "#64748B" }}>
                            {row.accountNumber}
                            {row.currency === "USD" ? " · USD" : ""}
                          </Typography>
                        </TableCell>

                        {/* Employee ID */}
                        <TableCell sx={{ color: "#334155" }}>
                          {row.employeeId}
                        </TableCell>

                        {/* Remarks */}
                        <TableCell sx={{ color: "#64748B" }}>
                          {row.remarks}
                        </TableCell>

                        {/* Amount */}
                        <TableCell sx={{ fontWeight: 600, color: "#0F172A" }}>
                          {row.currency === "KHR"
                            ? `KHR ${row.amount.toLocaleString("en-US")}`
                            : `USD ${row.amount.toFixed(2)}`}
                        </TableCell>

                        {/* Message */}
                        <TableCell>
                          <Typography
                            sx={{
                              fontSize: 12.5,
                              color: isError
                                ? "#DC2626"
                                : isWarning
                                  ? "#475569"
                                  : "#94A3B8",
                              fontWeight: isError ? 500 : 400,
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
                              sx={{ color: "#64748B", "&:hover": { bgcolor: "#E2E8F0" } }}
                            >
                              <Pencil size={15} />
                            </IconButton>

                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRecord(row.id)}
                              sx={{ color: "#64748B", "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" } }}
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

            <Typography sx={{ fontSize: 12.5, color: "#64748B", mt: 2, pl: 0.5 }}>
              + 17 more valid records
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
                  p: 3,
                  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
                  height: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
                  Processing date
                </Typography>

                <RadioGroup
                  value={processingTiming}
                  onChange={(e) => setProcessingTiming(e.target.value as "immediate" | "future")}
                >
                  <FormControlLabel
                    value="immediate"
                    control={<Radio size="small" sx={{ color: "#1B5299", "&.Mui-checked": { color: "#1B5299" } }} />}
                    label={<Typography sx={{ fontSize: 14, color: "#0F172A" }}>Immediate</Typography>}
                    sx={{ mb: 1 }}
                  />

                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <FormControlLabel
                      value="future"
                      control={<Radio size="small" sx={{ color: "#1B5299", "&.Mui-checked": { color: "#1B5299" } }} />}
                      label={<Typography sx={{ fontSize: 14, color: "#0F172A" }}>Future date</Typography>}
                    />
                    <TextField
                      type="date"
                      size="small"
                      disabled={processingTiming !== "future"}
                      value={futureDate}
                      onChange={(e) => setFutureDate(e.target.value)}
                      sx={{
                        width: 170,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          fontSize: 13,
                          height: 36,
                          "& fieldset": { borderColor: palette.slate[200] },
                        },
                      }}
                    />
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
                  p: 3,
                  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
                  height: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
                  Transaction summary
                </Typography>

                {errorCount > 0 ? (
                  <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>
                    Totals appear once every record is valid.
                  </Typography>
                ) : (
                  <Stack spacing={1.25}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>Payroll amount</Typography>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                        KHR {totalAmountKhr.toLocaleString("en-US")}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>Fee</Typography>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                        KHR {feeKhr.toLocaleString("en-US")}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", pt: 0.5 }}>
                      <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>Total debit amount</Typography>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#1B5299" }}>
                        KHR {totalDebitKhr.toLocaleString("en-US")}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Bottom Action Bar */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
              pt: 1,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  size="small"
                  sx={{ color: "#1B5299", "&.Mui-checked": { color: "#1B5299" } }}
                />
              }
              label={
                <Typography sx={{ fontSize: 13.5, color: "#0F172A", fontWeight: 500 }}>
                  I agree to the Terms & Conditions
                </Typography>
              }
            />

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={() => setCurrentStep(0)}
                sx={{
                  height: 40,
                  px: 3,
                  borderRadius: "8px",
                  borderColor: palette.slate[200],
                  color: "#334155",
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
                onClick={() => setCurrentStep(2)}
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
                  "&.Mui-disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" },
                }}
              >
                Next
              </Button>
            </Stack>
          </Box>
        </Stack>
      )}

      {/* ================= STEP 3: TRANSFER ================= */}
      {currentStep === 2 && (
        <Box
          sx={{
            maxWidth: 580,
            mx: "auto",
            bgcolor: "#FFFFFF",
            borderRadius: "16px",
            p: 4.5,
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "#ECFDF5",
              color: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <CheckCircle2 size={32} />
          </Box>

          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#0F172A", mb: 1 }}>
            Ready to Submit Payroll
          </Typography>

          <Typography sx={{ fontSize: 14, color: "#64748B", mb: 3 }}>
            You are authorizing payroll transfer of {records.length} records totaling{" "}
            <strong>KHR {totalAmountKhr.toLocaleString("en-US")}</strong> from {selectedSourceAccount.name} ({selectedSourceAccount.accountNumber}).
          </Typography>

          <Box
            sx={{
              bgcolor: "#F8FAFC",
              borderRadius: "12px",
              p: 2.5,
              mb: 4,
              textAlign: "left",
            }}
          >
            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 13, color: "#64748B" }}>Source Account</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                  {selectedSourceAccount.name} · {selectedSourceAccount.accountNumber}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 13, color: "#64748B" }}>Total Recipients</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                  {records.length} Employees
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 13, color: "#64748B" }}>Debit Amount</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#1B5299" }}>
                  KHR {totalDebitKhr.toLocaleString("en-US")}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={() => setCurrentStep(1)}
              sx={{
                height: 42,
                px: 3,
                borderRadius: "8px",
                borderColor: palette.slate[200],
                color: "#334155",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
              }}
            >
              Back
            </Button>

            <Button
              variant="contained"
              onClick={handleCompleteTransfer}
              sx={{
                height: 42,
                px: 4,
                borderRadius: "8px",
                bgcolor: "#1B5299",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": { bgcolor: "#15427C", boxShadow: "none" },
              }}
            >
              Confirm & Submit
            </Button>
          </Stack>
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
    </Box>
  );
}
