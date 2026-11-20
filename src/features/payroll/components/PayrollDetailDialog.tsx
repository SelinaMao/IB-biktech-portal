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
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { TransitionProps } from "@mui/material/transitions";
import { CheckCircle2, Download, FileSpreadsheet, X, XCircle } from "lucide-react";

import { palette } from "@/theme/palette";
import type { PayrollItem } from "../payroll.types";
import PayrollStatusChip from "./PayrollStatusChip";

/** Slide in from the right transition matching Account TransactionDetails */
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

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
            width: { xs: "calc(100vw - 16px)", sm: 520, md: 560 },
            maxWidth: 560,
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
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1.5,
          pt: 2.5,
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
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
              {item.referenceNo}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>
              {item.fileName}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <PayrollStatusChip status={item.status} />
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
        </Stack>
      </DialogTitle>

      <Divider sx={{ borderColor: palette.slate[100] }} />

      <DialogContent sx={{ px: 3, py: 2.5, flex: 1 }}>
        {/* Summary Details Grid */}
        <Box
          sx={{
            p: 2.25,
            bgcolor: "#F8FAFC",
            borderRadius: "14px",
            border: `1px solid ${palette.slate[100]}`,
            mb: 3,
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Processing Date
              </Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                {item.processingDate}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Source Account
              </Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                {item.sourceAccountName}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#64748B" }}>
                {item.sourceAccountNumber}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Total Amount
              </Typography>
              <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: "#1B5299" }}>
                {formatAmount(item.totalAmount)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Total Records
              </Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
                {item.records} Employees
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Uploaded On
              </Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: "#0F172A" }}>
                {item.createdAt}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 6 }}>
              <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                Remarks
              </Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: "#0F172A" }}>
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
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
            Beneficiary Breakdown ({item.items?.length ?? item.records} items)
          </Typography>
          <Button
            variant="text"
            size="small"
            startIcon={<Download size={14} />}
            sx={{
              textTransform: "none",
              fontSize: 12.5,
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
            maxHeight: 280,
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
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {item.items && item.items.length > 0 ? (
                item.items.map((emp) => (
                  <TableRow key={emp.id} sx={{ "& td": { py: 1.25, fontSize: 12.5 } }}>
                    <TableCell sx={{ fontWeight: 600, color: "#64748B" }}>
                      {emp.employeeId}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: "#0F172A" }}>
                      {emp.employeeName}
                    </TableCell>
                    <TableCell sx={{ color: "#334155" }}>
                      {emp.accountNumber}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#0F172A" }}>
                      {formatAmount(emp.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 3, textAlign: "center", color: "#64748B", fontSize: 12.5 }}>
                    Loaded from {item.fileName} ({item.records} records total)
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
            borderRadius: "8px",
            borderColor: palette.slate[200],
            color: "#334155",
            textTransform: "none",
            fontSize: 13.5,
            fontWeight: 500,
            px: 2.5,
            height: 38,
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
                borderRadius: "8px",
                textTransform: "none",
                fontSize: 13.5,
                fontWeight: 500,
                px: 2.5,
                height: 38,
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
                borderRadius: "8px",
                bgcolor: "#16A34A",
                color: "#FFFFFF",
                textTransform: "none",
                fontSize: 13.5,
                fontWeight: 500,
                px: 3,
                height: 38,
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
