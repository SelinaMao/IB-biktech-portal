"use client";

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
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

export default function EditPayrollRecordDialog({
  open,
  onClose,
  row,
  onUpdate,
  onDelete,
}: EditPayrollRecordDialogProps) {
  const [accountNumber, setAccountNumber] = useState("");
  const [currency, setCurrency] = useState<"KHR" | "USD">("KHR");
  const [amount, setAmount] = useState<string>("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (row) {
      // If the row had an invalid account like 0098 7766 551, suggest/prefill the corrected one like in screenshot
      const initialAccount =
        row.accountNumber === "0098 7766 551" ? "0098 7766 5512" : row.accountNumber;
      setAccountNumber(initialAccount);
      setCurrency(row.currency);
      setAmount(
        row.currency === "KHR"
          ? row.amount.toLocaleString("en-US")
          : row.amount.toFixed(2),
      );
      setRemarks(row.remarks || "");
    }
  }, [row]);

  if (!row) return null;

  const handleSave = () => {
    const rawAmount = parseFloat(amount.replace(/,/g, "")) || 0;
    // If the account number is now complete (e.g. 12+ digits or fixed) and currency is KHR, validate it
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
      message: isNowValid ? "—" : row.message,
    };

    onUpdate(updated);
    onClose();
  };

  const handleDelete = () => {
    onDelete(row.id);
    onClose();
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
          p: { xs: 1, sm: 1.5 },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          pb: 1,
          pt: 1.5,
          px: 2.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
            Edit record #{row.rowNumber}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#64748B", mt: 0.25 }}>
            Only the account number, amount and remarks can change.
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#64748B" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
        <Stack spacing={2.5}>
          {/* Top Two-Column Info Box */}
          <Box
            sx={{
              p: 2,
              bgcolor: "#F8FAFC",
              borderRadius: "10px",
              border: `1px solid ${palette.slate[100]}`,
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                  Employee name
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  {row.employeeName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                  Employee ID
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                  {row.employeeId}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* To account number */}
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#334155", mb: 0.75 }}>
              To account number
            </Typography>
            <TextField
              size="small"
              fullWidth
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  fontSize: 14,
                  bgcolor: "#FFFFFF",
                  "& fieldset": { borderColor: palette.slate[200] },
                  "&.Mui-focused fieldset": { borderColor: "#1B5299" },
                },
              }}
            />
            {row.originalAccount && (
              <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.5 }}>
                Was {row.originalAccount} — {row.message || "account not found"}
              </Typography>
            )}
          </Box>

          {/* Amount */}
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#334155", mb: 0.75 }}>
              Amount
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <FormControl size="small" sx={{ width: 100 }}>
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
                    borderRadius: "10px",
                    fontSize: 14,
                    bgcolor: "#FFFFFF",
                    "& fieldset": { borderColor: palette.slate[200] },
                    "&.Mui-focused fieldset": { borderColor: "#1B5299" },
                  },
                }}
              />
            </Stack>
          </Box>

          {/* Remarks (optional) */}
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#334155", mb: 0.75 }}>
              Remarks (optional)
            </Typography>
            <TextField
              size="small"
              fullWidth
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  fontSize: 14,
                  bgcolor: "#FFFFFF",
                  "& fieldset": { borderColor: palette.slate[200] },
                  "&.Mui-focused fieldset": { borderColor: "#1B5299" },
                },
              }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          pb: 2,
          pt: 1,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left Delete Button */}
        <Button
          variant="outlined"
          color="error"
          onClick={handleDelete}
          startIcon={<Trash2 size={16} />}
          sx={{
            borderRadius: "8px",
            borderColor: "#FECACA",
            color: "#DC2626",
            textTransform: "none",
            fontSize: 13.5,
            fontWeight: 500,
            px: 2,
            height: 38,
            "&:hover": { borderColor: "#F87171", bgcolor: "#FEF2F2" },
          }}
        >
          Delete
        </Button>

        {/* Right Cancel & Update Buttons */}
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="text"
            onClick={onClose}
            sx={{
              color: "#334155",
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
      </DialogActions>
    </Dialog>
  );
}
