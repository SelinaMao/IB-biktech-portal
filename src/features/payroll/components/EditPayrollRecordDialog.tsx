"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Trash2, X } from "lucide-react";

import { palette } from "@/theme/palette";
import type { ReviewPayrollRow } from "../payroll.types";

export interface EditPayrollRecordDialogProps {
  open: boolean;
  onClose: () => void;
  row: ReviewPayrollRow | null;
  onUpdate: (updatedRow: ReviewPayrollRow) => void;
  onDelete: (rowId: string) => void;
}

interface EditRecordFormProps {
  row: ReviewPayrollRow;
  onClose: () => void;
  onUpdate: (updatedRow: ReviewPayrollRow) => void;
  onDelete: (rowId: string) => void;
}

function EditRecordForm({ row, onClose, onUpdate, onDelete }: EditRecordFormProps) {
  const [accountNumber, setAccountNumber] = useState<string>(() => {
    return row.accountNumber === "0098 7788 551" || row.accountNumber === "0098 7766 551"
      ? "0098 7766 5512"
      : row.accountNumber;
  });
  const [currency, setCurrency] = useState<"KHR" | "USD">(row.currency);
  const [amount, setAmount] = useState<string>(() => {
    return row.currency === "KHR"
      ? row.amount.toLocaleString("en-US")
      : row.amount.toFixed(2);
  });
  const [remarks, setRemarks] = useState<string>(row.remarks || "");

  const handleSave = () => {
    const rawAmount = parseFloat(amount.replace(/,/g, "")) || 0;
    const isNowValid =
      accountNumber.trim().length >= 11 &&
      !accountNumber.endsWith("551") &&
      currency === "KHR";

    const updated: ReviewPayrollRow = {
      ...row,
      accountNumber: accountNumber.trim(),
      currency,
      amount: rawAmount,
      remarks: remarks.trim(),
      validationState: isNowValid ? "valid" : row.validationState,
      message: isNowValid ? "Updated" : row.message,
    };

    onUpdate(updated);
    onClose();
  };

  const handleDelete = () => {
    onDelete(row.id);
    onClose();
  };

  return (
    <>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
            Edit record #{row.rowNumber}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#64748B", mt: 0.5 }}>
            Only the account number, amount and remarks can change.
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: "#64748B",
            p: 0.5,
            "&:hover": { color: "#0F172A", bgcolor: "#F1F5F9" },
          }}
          aria-label="Close"
        >
          <X size={18} />
        </IconButton>
      </Box>

      {/* Body Content */}
      <Stack spacing={2}>
        {/* Top Two-Column Info Boxes */}
        <Stack direction="row" spacing={1.5}>
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              bgcolor: "#F8FAFC",
              borderRadius: "10px",
            }}
          >
            <Typography sx={{ fontSize: 11.5, color: "#64748B", mb: 0.25 }}>
              Employee name
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
              {row.employeeName}
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              p: 1.5,
              bgcolor: "#F8FAFC",
              borderRadius: "10px",
            }}
          >
            <Typography sx={{ fontSize: 11.5, color: "#64748B", mb: 0.25 }}>
              Employee ID
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
              {row.employeeId}
            </Typography>
          </Box>
        </Stack>

        {/* To account number */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A", mb: 0.75 }}>
            To account number
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 42,
                borderRadius: "8px",
                fontSize: 14,
                bgcolor: "#FFFFFF",
                "& fieldset": { borderColor: "#60A5FA", borderWidth: "1px" },
                "&:hover fieldset": { borderColor: "#3B82F6" },
                "&.Mui-focused fieldset": { borderColor: "#1B5299", borderWidth: "1px !important" },
              },
            }}
          />
          {row.originalAccount && (
            <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.75 }}>
              Was {row.originalAccount} — {row.message ? row.message.toLowerCase() : "account not found"}
            </Typography>
          )}
        </Box>

        {/* Amount */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A", mb: 0.75 }}>
            Amount
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <FormControl size="small" sx={{ width: 95 }}>
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "KHR" | "USD")}
                sx={{
                  height: 42,
                  borderRadius: "8px",
                  fontSize: 14,
                  bgcolor: "#FFFFFF",
                  "& fieldset": { borderColor: palette.slate[200] },
                  "&:hover fieldset": { borderColor: palette.slate[300] },
                  "&.Mui-focused fieldset": { borderColor: "#1B5299" },
                }}
              >
                <MenuItem value="KHR">KHR</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              fullWidth
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 42,
                  borderRadius: "8px",
                  fontSize: 14,
                  bgcolor: "#FFFFFF",
                  "& fieldset": { borderColor: palette.slate[200] },
                  "&:hover fieldset": { borderColor: palette.slate[300] },
                  "&.Mui-focused fieldset": { borderColor: "#1B5299" },
                },
              }}
            />
          </Stack>
        </Box>

        {/* Remarks (optional) */}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A", mb: 0.75 }}>
            Remarks (optional)
          </Typography>
          <TextField
            size="small"
            fullWidth
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 42,
                borderRadius: "8px",
                fontSize: 14,
                bgcolor: "#FFFFFF",
                "& fieldset": { borderColor: palette.slate[200] },
                "&:hover fieldset": { borderColor: palette.slate[300] },
                "&.Mui-focused fieldset": { borderColor: "#1B5299" },
              },
            }}
          />
        </Box>
      </Stack>

      {/* Footer Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 3,
        }}
      >
        {/* Left Delete Button */}
        <Button
          variant="outlined"
          onClick={handleDelete}
          startIcon={<Trash2 size={15} color="#EF4444" />}
          sx={{
            borderRadius: "8px",
            borderColor: "#FECACA",
            color: "#EF4444",
            textTransform: "none",
            fontSize: 13.5,
            fontWeight: 500,
            px: 2,
            height: 38,
            bgcolor: "#FFFFFF",
            "&:hover": { borderColor: "#F87171", bgcolor: "#FEF2F2" },
          }}
        >
          Delete
        </Button>

        {/* Right Cancel & Update Buttons */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Button
            variant="text"
            onClick={onClose}
            sx={{
              color: "#0F172A",
              textTransform: "none",
              fontSize: 14,
              fontWeight: 500,
              px: 2,
              height: 38,
              "&:hover": { bgcolor: "#F1F5F9" },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              borderRadius: "8px",
              bgcolor: "#1B5299",
              color: "#FFFFFF",
              textTransform: "none",
              fontSize: 14,
              fontWeight: 600,
              px: 2.75,
              height: 38,
              boxShadow: "none",
              "&:hover": { bgcolor: "#15427C", boxShadow: "none" },
            }}
          >
            Update
          </Button>
        </Stack>
      </Box>
    </>
  );
}

export default function EditPayrollRecordDialog({
  open,
  onClose,
  row,
  onUpdate,
  onDelete,
}: EditPayrollRecordDialogProps) {
  if (!row) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: { bgcolor: "rgba(15, 23, 42, 0.4)" },
        },
        paper: {
          sx: {
            borderRadius: "16px",
            bgcolor: "#FFFFFF",
            p: 3,
            boxSizing: "border-box",
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
            maxWidth: 520,
            width: "100%",
            m: 2,
          },
        },
      }}
    >
      <EditRecordForm
        key={row.id}
        row={row}
        onClose={onClose}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </Dialog>
  );
}
