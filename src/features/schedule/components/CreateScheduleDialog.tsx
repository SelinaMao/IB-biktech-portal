"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { palette } from "@/theme/palette";
import BaseDialog from "@core/components/BaseDialog";
import { SCHEDULE_FREQUENCIES, SCHEDULE_TRANSACTION_TYPES } from "../schedule.data";
import type {
  CreateScheduleInput,
  ScheduleFrequency,
  ScheduledTransaction,
} from "../schedule.types";

export interface CreateScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateScheduleInput) => void;
  initialData?: ScheduledTransaction | null;
}

export default function CreateScheduleDialog({
  open,
  onClose,
  onSubmit,
  initialData,
}: CreateScheduleDialogProps) {
  const isEditing = Boolean(initialData);

  const [transactionType, setTransactionType] = useState<string>(
    SCHEDULE_TRANSACTION_TYPES[0],
  );
  const [payToName, setPayToName] = useState("");
  const [payToAccount, setPayToAccount] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [currency, setCurrency] = useState<"USD" | "KHR">("USD");
  const [frequency, setFrequency] = useState<ScheduleFrequency>("Monthly");
  const [executionTime, setExecutionTime] = useState("09:00 AM");
  const [startDate, setStartDate] = useState(
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date()),
  );
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (initialData) {
      setTransactionType(initialData.transactionType);
      setPayToName(initialData.payToName);
      setPayToAccount(initialData.payToAccount);
      setAmount(initialData.amount);
      setCurrency(initialData.currency);
      setFrequency(initialData.frequency ?? "Monthly");
      setExecutionTime(initialData.time);
      setStartDate(initialData.date);
      setRemarks(initialData.remarks ?? "");
    } else {
      setTransactionType(SCHEDULE_TRANSACTION_TYPES[0]);
      setPayToName("");
      setPayToAccount("");
      setAmount("");
      setCurrency("USD");
      setFrequency("Monthly");
      setExecutionTime("09:00 AM");
      setStartDate(
        new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date()),
      );
      setRemarks("");
    }
  }, [initialData, open]);

  const handleSubmit = () => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (!payToName.trim() || !payToAccount.trim() || !numAmount || numAmount <= 0) {
      return;
    }

    onSubmit({
      date: startDate,
      time: executionTime,
      transactionType,
      payToName: payToName.trim(),
      payToAccount: payToAccount.trim(),
      amount: numAmount,
      currency,
      frequency,
      remarks: remarks.trim() || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  const isValid =
    Boolean(payToName.trim()) &&
    Boolean(payToAccount.trim()) &&
    Boolean(amount) &&
    Number(amount) > 0;

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title={isEditing ? "Edit schedule" : "Create new schedule"}
      subtitle={
        isEditing
          ? "Update details for this scheduled transaction."
          : "Set up an automated recurring or future transaction."
      }
      confirmTitle={isEditing ? "Save changes" : "Create schedule"}
      onConfirm={handleSubmit}
      confirmDisabled={!isValid}
      cancelTitle="Cancel"
      maxWidth="sm"
    >
      <Stack spacing={2.5} sx={{ mt: 1 }}>
        {/* Transaction Type */}
        <Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: palette.slate[700],
              mb: 0.75,
            }}
          >
            Transaction type
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              sx={{ borderRadius: "10px" }}
            >
              {SCHEDULE_TRANSACTION_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Pay to Name */}
        <Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: palette.slate[700],
              mb: 0.75,
            }}
          >
            Pay to name / Merchant / Bank
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. SOK DARA · ABA Bank"
            value={payToName}
            onChange={(e) => setPayToName(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        </Box>

        {/* Account / Identifier */}
        <Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: palette.slate[700],
              mb: 0.75,
            }}
          >
            Account number / Identifier
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. 001 234 567"
            value={payToAccount}
            onChange={(e) => setPayToAccount(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        </Box>

        {/* Amount & Currency */}
        <Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: palette.slate[700],
              mb: 0.75,
            }}
          >
            Amount & Currency
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
            <FormControl size="small" sx={{ width: 110, flexShrink: 0 }}>
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "USD" | "KHR")}
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="KHR">KHR</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Frequency & Execution Time */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: palette.slate[700],
                mb: 0.75,
              }}
            >
              Frequency
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
                sx={{ borderRadius: "10px" }}
              >
                {SCHEDULE_FREQUENCIES.map((freq) => (
                  <MenuItem key={freq} value={freq}>
                    {freq}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: palette.slate[700],
                mb: 0.75,
              }}
            >
              Execution time
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="09:00 AM"
              value={executionTime}
              onChange={(e) => setExecutionTime(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </Box>
        </Stack>

        {/* Start Date */}
        <Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: palette.slate[700],
              mb: 0.75,
            }}
          >
            Start date
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. 16 Oct 2026"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        </Box>

        {/* Remarks */}
        <Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: palette.slate[700],
              mb: 0.75,
            }}
          >
            Remarks (Optional)
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. Monthly supplier settlement"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        </Box>
      </Stack>
    </BaseDialog>
  );
}
