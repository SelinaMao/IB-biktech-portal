"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Download, FileText, Upload, X } from "lucide-react";

import { palette } from "@/theme/palette";
import { SOURCE_ACCOUNTS } from "../payroll.data";
import type { PayrollItem } from "../payroll.types";

export interface UploadPayrollDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: (newPayroll: PayrollItem) => void;
}

export default function UploadPayrollDialog({
  open,
  onClose,
  onUploadSuccess,
}: UploadPayrollDialogProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(SOURCE_ACCOUNTS[0].id);
  const [currency, setCurrency] = useState<"KHR" | "USD">("KHR");
  const [processingDate, setProcessingDate] = useState("2026-04-20");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setRemarks("");
    setIsSubmitting(false);
  };

  const handleSubmit = () => {
    if (!selectedFile) return;

    setIsSubmitting(true);

    const sourceAccount =
      SOURCE_ACCOUNTS.find((acc) => acc.id === selectedAccountId) ?? SOURCE_ACCOUNTS[0];

    // Format processing date nicely (e.g. "20 Apr 2026")
    const dateObj = new Date(processingDate);
    const day = dateObj.getDate();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formattedDate = `${day} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

    // Generate random realistic reference
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const randomSeq = String(Math.floor(1000 + Math.random() * 9000));
    const refNo = `PR${yy}${mm}${dd}${randomSeq}`;

    const newRecord: PayrollItem = {
      id: `pr-${Date.now()}`,
      processingDate: formattedDate,
      referenceNo: refNo,
      fileName: selectedFile.name,
      sourceAccountName: sourceAccount.name,
      sourceAccountNumber: sourceAccount.accountNumber,
      records: 20,
      totalAmount: currency === "KHR" ? 6500000 : 1600,
      currency,
      status: "Pending",
      createdAt: `${formattedDate} 10:00 AM`,
      uploadedBy: "Rous Samol",
      remarks: remarks || "Batch Payroll Upload",
    };

    setTimeout(() => {
      onUploadSuccess(newRecord);
      handleReset();
      onClose();
    }, 600);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          pt: 2,
          px: 3,
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
          Upload Payroll File
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "#64748B" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
        <Stack spacing={2.5}>
          {/* Source Account Field */}
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#334155", mb: 0.75 }}>
              Source Account *
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                sx={{
                  borderRadius: "10px",
                  fontSize: 14,
                  bgcolor: "#FFFFFF",
                  "& fieldset": { borderColor: palette.slate[200] },
                }}
              >
                {SOURCE_ACCOUNTS.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span>
                        {acc.name} - {acc.accountNumber}
                      </span>
                      <span style={{ color: "#64748B", fontSize: 13 }}>
                        {acc.currency} {acc.balance}
                      </span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Currency and Date */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#334155", mb: 0.75 }}>
                Currency *
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "KHR" | "USD")}
                  sx={{
                    borderRadius: "10px",
                    fontSize: 14,
                    bgcolor: "#FFFFFF",
                    "& fieldset": { borderColor: palette.slate[200] },
                  }}
                >
                  <MenuItem value="KHR">KHR (Cambodian Riel)</MenuItem>
                  <MenuItem value="USD">USD (US Dollar)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#334155", mb: 0.75 }}>
                Processing Date *
              </Typography>
              <TextField
                type="date"
                size="small"
                fullWidth
                value={processingDate}
                onChange={(e) => setProcessingDate(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: 14,
                    "& fieldset": { borderColor: palette.slate[200] },
                  },
                }}
              />
            </Box>
          </Stack>

          {/* File Upload Dropzone */}
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Payroll File (.csv, .xlsx) *
              </Typography>
              <Button
                variant="text"
                size="small"
                startIcon={<Download size={14} />}
                sx={{
                  textTransform: "none",
                  fontSize: 12,
                  color: "#1B5299",
                  p: 0,
                  "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                }}
              >
                Download template
              </Button>
            </Box>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <Box
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: "2px dashed",
                borderColor: dragOver ? "#1B5299" : palette.slate[200],
                borderRadius: "12px",
                p: 3,
                textAlign: "center",
                bgcolor: dragOver ? "#F0F7FF" : "#F8FAFC",
                cursor: "pointer",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: "#F0F7FF",
                  borderColor: "#1B5299",
                },
              }}
            >
              {selectedFile ? (
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "center" }}>
                  <FileText size={28} color="#1B5299" />
                  <Box sx={{ textAlign: "left" }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                      {selectedFile.name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748B" }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Box>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      bgcolor: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 1.5,
                      boxShadow: "0px 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    <Upload size={20} color="#1B5299" />
                  </Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", mb: 0.5 }}>
                    Click or drag & drop payroll file here
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#64748B" }}>
                    Supports CSV or Excel spreadsheets (up to 10MB)
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Remarks */}
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#334155", mb: 0.75 }}>
              Remarks (Optional)
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. April 2026 Monthly Salaries"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  fontSize: 14,
                  "& fieldset": { borderColor: palette.slate[200] },
                },
              }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderRadius: "10px",
            borderColor: palette.slate[200],
            color: "#334155",
            textTransform: "none",
            fontSize: 14,
            fontWeight: 500,
            px: 2.5,
            height: 40,
            "&:hover": { borderColor: palette.slate[300], bgcolor: "#F8FAFC" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!selectedFile || isSubmitting}
          onClick={handleSubmit}
          sx={{
            borderRadius: "10px",
            bgcolor: "#1B5299",
            color: "#FFFFFF",
            textTransform: "none",
            fontSize: 14,
            fontWeight: 500,
            px: 3,
            height: 40,
            boxShadow: "none",
            "&:hover": { bgcolor: "#15427C", boxShadow: "none" },
            "&.Mui-disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" },
          }}
        >
          {isSubmitting ? "Uploading..." : "Upload payroll"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
