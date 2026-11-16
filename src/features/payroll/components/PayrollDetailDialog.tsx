"use client";

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { CheckCircle2, Download, FileSpreadsheet, X, XCircle } from "lucide-react";

import { palette } from "@/theme/palette";
import type { PayrollItem } from "../payroll.types";
import PayrollStatusChip from "./PayrollStatusChip";

export interface PayrollDetailDialogProps {
  open: boolean;
  onClose: () => void;
  item: PayrollItem | null;
  onApprove?: (item: PayrollItem) => void;
  onReject?: (item: PayrollItem) => void;
}

export default function PayrollDetailDialog({
  open,
  onClose,
  item,
  onApprove,
  onReject,
}: PayrollDetailDialogProps) {
  if (!item) return null;

  const isPending = item.status === "Pending";

  const formatAmount = (amt: number) => {
    if (item.currency === "KHR") {
      return `KHR ${amt.toLocaleString("en-US")}`;
    }
    return `USD ${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
          pb: 1.5,
          pt: 2,
          px: 3,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: "#F0F7FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1B5299",
            }}
          >
            <FileSpreadsheet size={22} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
              {item.referenceNo}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#64748B" }}>
              {item.fileName}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <PayrollStatusChip status={item.status} />
          <IconButton size="small" onClick={onClose} sx={{ color: "#64748B" }}>
            <X size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider sx={{ borderColor: palette.slate[100] }} />

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {/* Summary Details Grid */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: "#F8FAFC",
            borderRadius: "12px",
            border: `1px solid ${palette.slate[100]}`,
            mb: 3,
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Processing Date
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                {item.processingDate}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Source Account
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                {item.sourceAccountName}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#64748B" }}>
                {item.sourceAccountNumber}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Total Amount
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1B5299" }}>
                {formatAmount(item.totalAmount)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Total Records
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                {item.records} Employees
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Uploaded On
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>
                {item.createdAt}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Remarks
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>
                {item.remarks || "—"}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Breakdown Table Header */}
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}
        >
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
            Beneficiary Breakdown ({item.items?.length ?? item.records} items)
          </Typography>
          <Button
            variant="text"
            size="small"
            startIcon={<Download size={14} />}
            sx={{
              textTransform: "none",
              fontSize: 13,
              color: "#1B5299",
              "&:hover": { bgcolor: "#F0F7FF" },
            }}
          >
            Export CSV
          </Button>
        </Stack>

        {/* Breakdown Records Table */}
        <TableContainer
          sx={{
            border: `1px solid ${palette.slate[200]}`,
            borderRadius: "10px",
            maxHeight: 260,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    bgcolor: "#F8FAFC",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#64748B",
                    py: 1.25,
                  },
                }}
              >
                <TableCell>Emp ID</TableCell>
                <TableCell>Beneficiary Name</TableCell>
                <TableCell>Account Number</TableCell>
                <TableCell>Bank</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {item.items && item.items.length > 0 ? (
                item.items.map((emp) => (
                  <TableRow key={emp.id} sx={{ "& td": { py: 1.25, fontSize: 13 } }}>
                    <TableCell sx={{ fontWeight: 600, color: "#64748B" }}>
                      {emp.employeeId}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: "#0F172A" }}>
                      {emp.employeeName}
                    </TableCell>
                    <TableCell sx={{ color: "#334155" }}>
                      {emp.accountNumber}
                    </TableCell>
                    <TableCell sx={{ color: "#64748B" }}>
                      {emp.bankName}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#0F172A" }}>
                      {formatAmount(emp.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 3, textAlign: "center", color: "#64748B" }}>
                    Sample beneficiaries loaded from {item.fileName} ({item.records} records total)
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <Divider sx={{ borderColor: palette.slate[100] }} />

      <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
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
          Close
        </Button>

        {isPending && (
          <>
            <Button
              variant="outlined"
              color="error"
              startIcon={<XCircle size={16} />}
              onClick={() => {
                onReject?.(item);
                onClose();
              }}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 500,
                px: 2.5,
                height: 40,
              }}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              startIcon={<CheckCircle2 size={16} />}
              onClick={() => {
                onApprove?.(item);
                onClose();
              }}
              sx={{
                borderRadius: "10px",
                bgcolor: "#16A34A",
                color: "#FFFFFF",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 500,
                px: 3,
                height: 40,
                boxShadow: "none",
                "&:hover": { bgcolor: "#15803D", boxShadow: "none" },
              }}
            >
              Approve Payroll
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
