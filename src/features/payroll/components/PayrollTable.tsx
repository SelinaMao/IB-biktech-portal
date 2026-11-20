"use client";

import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ChevronLeft, ChevronRight, MoreHorizontal, Upload } from "lucide-react";

import BaseButton from "@core/components/BaseButton";
import BaseSearchButton from "@core/components/BaseSearchButton";
import { palette } from "@/theme/palette";
import type { PayrollItem } from "../payroll.types";
import PayrollStatusChip from "./PayrollStatusChip";

export interface PayrollTableProps {
  entries: PayrollItem[];
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  rowsPerPage?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onUploadClick: () => void;
  onRowClick: (item: PayrollItem) => void;
}

const formatCurrencyAmount = (amount: number, currency: "KHR" | "USD") => {
  if (currency === "KHR") {
    return `KHR ${amount.toLocaleString("en-US")}`;
  }
  return `USD ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
};

export default function PayrollTable({
  entries,
  search,
  onSearchChange,
  page,
  rowsPerPage = 5,
  totalPages = 12,
  onPageChange,
  onUploadClick,
  onRowClick,
}: PayrollTableProps) {
  // If we have actual sliced rows or need to paginate client-side:
  const displayedRows = useMemo(() => {
    // If entries are already filtered/sliced, we show them. Otherwise slice by rowsPerPage.
    if (entries.length > rowsPerPage) {
      const start = page * rowsPerPage;
      return entries.slice(start, start + rowsPerPage);
    }
    return entries;
  }, [entries, page, rowsPerPage]);

  const currentPageNumber = page + 1; // 1-based index

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#FFFFFF",
        borderRadius: "20px",
        p: { xs: 2.5, sm: 3.5, md: 4 },
        boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Top Header inside Card */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: 18, sm: 20 },
            fontWeight: 700,
            color: "#0F172A",
            letterSpacing: "-0.2px",
          }}
        >
          Payroll List
        </Typography>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          {/* Search Box */}
          <BaseSearchButton
            placeholder="Search"
            value={search}
            onChange={onSearchChange}
            width={230}
            focusBorderColor="#1B5299"
            sx={{
              width: { xs: "100%", sm: 230 },
            }}
          />

          {/* Upload payroll Button */}
          <BaseButton
            title="Upload payroll"
            variant="contained"
            onClick={onUploadClick}
            startIcon={<Upload size={17} />}
            sx={{
              height: 40,
              px: 4.25,
              borderRadius: "10px",
              bgcolor: "#1B5299",
              backgroundColor: "#1B5299",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 400,
              textTransform: "none",
              boxShadow: "none",
              whiteSpace: "nowrap",
              "&:hover": {
                bgcolor: "#15427C",
                backgroundColor: "#15427C",
                boxShadow: "none",
              },
            }}
          />
        </Stack>
      </Stack>

      {/* Payroll Table */}
      <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
        <Table sx={{ minWidth: 780 }}>
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  borderBottom: `1px solid ${palette.slate[200]}`,
                  py: 1.75,
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "#64748B",
                  bgcolor: "#FFFFFF",
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableCell sx={{ pl: 0.5, width: "16%" }}>Processing date</TableCell>
              <TableCell sx={{ width: "24%" }}>Reference · file</TableCell>
              <TableCell sx={{ width: "22%" }}>Source account</TableCell>
              <TableCell sx={{ width: "10%" }}>Records</TableCell>
              <TableCell sx={{ width: "16%" }}>Total amount</TableCell>
              <TableCell sx={{ width: "10%" }}>Status</TableCell>
              <TableCell sx={{ pr: 0.5, width: "2%" }} align="right" />
            </TableRow>
          </TableHead>

          <TableBody>
            {displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body1" sx={{ color: "#64748B", fontWeight: 500 }}>
                    No payroll records found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick(row)}
                  sx={{
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                    "&:hover": {
                      bgcolor: "#F8FAFC",
                    },
                    "& td": {
                      borderBottom: `1px solid ${palette.slate[100]}`,
                      py: 2.25,
                      verticalAlign: "middle",
                    },
                  }}
                >
                  {/* Processing date */}
                  <TableCell sx={{ pl: 0.5 }}>
                    <Typography sx={{ fontSize: 14, color: "#0F172A", fontWeight: 400 }}>
                      {row.processingDate}
                    </Typography>
                  </TableCell>

                  {/* Reference · file */}
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                        {row.referenceNo}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: "#64748B" }}>
                        {row.fileName}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Source account */}
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>
                        {row.sourceAccountName}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color: "#64748B" }}>
                        {row.sourceAccountNumber}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Records */}
                  <TableCell>
                    <Typography sx={{ fontSize: 14, color: "#0F172A" }}>
                      {row.records}
                    </Typography>
                  </TableCell>

                  {/* Total amount */}
                  <TableCell>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                      {formatCurrencyAmount(row.totalAmount, row.currency)}
                    </Typography>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <PayrollStatusChip status={row.status} />
                  </TableCell>

                  {/* Chevron Right */}
                  <TableCell align="right" sx={{ pr: 0.5 }}>
                    <ChevronRight size={18} color="#64748B" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination matching screenshot: < Previous 1 [2] 3 ... 12 Next > */}
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "flex-end",
          mt: 4,
          gap: 0.5,
        }}
      >
        {/* Previous Button */}
        <Button
          variant="text"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          startIcon={<ChevronLeft size={16} />}
          sx={{
            height: 38,
            px: 1.5,
            mr: 0.5,
            borderRadius: "8px",
            color: "#0F172A",
            fontSize: 14,
            fontWeight: 500,
            textTransform: "none",
            "&:hover": { bgcolor: "#F1F5F9" },
            "&.Mui-disabled": { color: "#94A3B8" },
          }}
        >
          Previous
        </Button>

        {/* Page 1 */}
        <Button
          variant="text"
          onClick={() => onPageChange(0)}
          sx={{
            width: 36,
            height: 36,
            minWidth: 36,
            p: 0,
            borderRadius: "8px",
            fontSize: 14,
            fontWeight: currentPageNumber === 1 ? 600 : 500,
            color: "#0F172A",
            bgcolor: currentPageNumber === 1 ? "#FFFFFF" : "transparent",
            border: "1px solid",
            borderColor: currentPageNumber === 1 ? "#E2E8F0" : "transparent",
            boxShadow:
              currentPageNumber === 1 ? "0px 1px 2px rgba(15, 23, 42, 0.06)" : "none",
            "&:hover": { bgcolor: currentPageNumber === 1 ? "#FFFFFF" : "#F1F5F9" },
          }}
        >
          1
        </Button>

        {/* Page 2 */}
        <Button
          variant="text"
          onClick={() => onPageChange(1)}
          sx={{
            width: 36,
            height: 36,
            minWidth: 36,
            p: 0,
            borderRadius: "8px",
            fontSize: 14,
            fontWeight: currentPageNumber === 2 ? 600 : 500,
            color: "#0F172A",
            bgcolor: currentPageNumber === 2 ? "#FFFFFF" : "transparent",
            border: "1px solid",
            borderColor: currentPageNumber === 2 ? "#E2E8F0" : "transparent",
            boxShadow:
              currentPageNumber === 2 ? "0px 1px 2px rgba(15, 23, 42, 0.06)" : "none",
            "&:hover": { bgcolor: currentPageNumber === 2 ? "#FFFFFF" : "#F1F5F9" },
          }}
        >
          2
        </Button>

        {/* Page 3 */}
        <Button
          variant="text"
          onClick={() => onPageChange(2)}
          sx={{
            width: 36,
            height: 36,
            minWidth: 36,
            p: 0,
            borderRadius: "8px",
            fontSize: 14,
            fontWeight: currentPageNumber === 3 ? 600 : 500,
            color: "#0F172A",
            bgcolor: currentPageNumber === 3 ? "#FFFFFF" : "transparent",
            border: "1px solid",
            borderColor: currentPageNumber === 3 ? "#E2E8F0" : "transparent",
            boxShadow:
              currentPageNumber === 3 ? "0px 1px 2px rgba(15, 23, 42, 0.06)" : "none",
            "&:hover": { bgcolor: currentPageNumber === 3 ? "#FFFFFF" : "#F1F5F9" },
          }}
        >
          3
        </Button>

        {/* Ellipsis */}
        <Box
          sx={{
            width: 32,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748B",
          }}
        >
          <MoreHorizontal size={16} />
        </Box>

        {/* Last Page (12) */}
        <Button
          variant="text"
          onClick={() => onPageChange(totalPages - 1)}
          sx={{
            width: 36,
            height: 36,
            minWidth: 36,
            p: 0,
            borderRadius: "8px",
            fontSize: 14,
            fontWeight: currentPageNumber === totalPages ? 600 : 500,
            color: "#0F172A",
            bgcolor: currentPageNumber === totalPages ? "#FFFFFF" : "transparent",
            border: "1px solid",
            borderColor: currentPageNumber === totalPages ? "#E2E8F0" : "transparent",
            boxShadow:
              currentPageNumber === totalPages ? "0px 1px 2px rgba(15, 23, 42, 0.06)" : "none",
            "&:hover": { bgcolor: currentPageNumber === totalPages ? "#FFFFFF" : "#F1F5F9" },
          }}
        >
          {totalPages}
        </Button>

        {/* Next Button */}
        <Button
          variant="text"
          disabled={currentPageNumber >= totalPages}
          onClick={() => onPageChange(page + 1)}
          endIcon={<ChevronRight size={16} />}
          sx={{
            height: 38,
            px: 1.5,
            ml: 0.5,
            borderRadius: "8px",
            color: "#0F172A",
            fontSize: 14,
            fontWeight: 500,
            textTransform: "none",
            "&:hover": { bgcolor: "#F1F5F9" },
            "&.Mui-disabled": { color: "#94A3B8" },
          }}
        >
          Next
        </Button>
      </Stack>
    </Box>
  );
}
