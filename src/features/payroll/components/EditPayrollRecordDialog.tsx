"use client";

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { TransitionProps } from "@mui/material/transitions";
import { Trash2, X } from "lucide-react";

import { palette } from "@/theme/palette";
import type { ReviewPayrollRow } from "../payroll.types";

/** Slide in from the right transition matching Account TransactionDetails */
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

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
      TransitionComponent={Transition}
      slotProps={{
        backdrop: {
          sx: { bgcolor: "rgba(15, 23, 42, 0.4)" },
        },
        paper: {
          sx: {
            position: "fixed",
            top: { xs: 8, sm: 8, md: 14 },
            right: { xs: 8, sm: 8, md: 14 },
            bottom: { xs: 8, sm: 8, md: 14 },
            m: 0,
            width: { xs: "calc(100vw - 16px)", sm: 460, md: 490 },
            maxWidth: 490,
            height: {
              xs: "calc(100vh - 16px)",
              sm: "calc(100vh - 16px)",
              md: "calc(100vh - 28px)",
            },
            borderRadius: "24px",
            bgcolor: "#FFFFFF",
            p: 0,
            boxSizing: "border-box",
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          pb: 1.5,
          pt: 2.5,
          px: 3,
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
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: "#64748B",
            bgcolor: "#F1F5F9",
            borderRadius: "8px",
            "&:hover": { bgcolor: "#E2E8F0" },
          }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: palette.slate[100] }} />

      <DialogContent sx={{ px: 3, py: 2.5, flex: 1 }}>
        <Stack spacing={2.5}>
          {/* Top Two-Column Info Box */}
          <Box
            sx={{
              p: 2,
              bgcolor: "#F8FAFC",
              borderRadius: "12px",
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

      <Divider sx={{ borderColor: palette.slate[100] }} />

      <DialogActions
        sx={{
          px: 3,
          py: 2,
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
