"use client";

import { useMemo, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ChevronsUpDown, Pencil, Plus, Search, SquarePen, Trash2 } from "lucide-react";

import { font, palette } from "@/theme/palette";
import BaseButton from "@core/components/BaseButton";
import BasePagination from "@core/components/BasePagination";
import type { PaymentTemplate } from "../payment.types";

export interface PaymentTemplatesTableProps {
  templates: PaymentTemplate[];
  onAddTemplate?: () => void;
  onEditTemplate?: (template: PaymentTemplate) => void;
  onDeleteTemplate?: (template: PaymentTemplate) => void;
  onSelectTemplate?: (template: PaymentTemplate) => void;
}

export default function PaymentTemplatesTable({
  templates,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onSelectTemplate,
}: PaymentTemplatesTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (tpl) =>
        tpl.name.toLowerCase().includes(q) ||
        tpl.type.toLowerCase().includes(q) ||
        tpl.providerName.toLowerCase().includes(q) ||
        tpl.correspondentId.toLowerCase().includes(q),
    );
  }, [templates, search]);

  const totalCount = filteredTemplates.length;
  const paginatedTemplates = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredTemplates.slice(start, start + rowsPerPage);
  }, [filteredTemplates, page, rowsPerPage]);

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        border: `1px solid ${palette.slate[200]}`,
        borderRadius: "16px",
        p: { xs: 2.5, sm: "20px 24px" },
        boxShadow: "none",
      }}
    >
      {/* Header bar: Title & Subtitle on left, + Template on right */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 18,
              color: palette.slate[900],
              lineHeight: 1.25,
            }}
          >
            Payment templates
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: palette.slate[500],
              mt: 0.5,
            }}
          >
            Click a template to pay with its saved details.
          </Typography>
        </Box>

        <BaseButton
          title="Template"
          startIcon={<Plus size={18} />}
          onClick={onAddTemplate}
          sx={{
            bgcolor: "#2764A5",
            color: "#ffffff",
            borderRadius: "10px",
            px: 3.5,
            py: 1.5,
            fontSize: 14,
            fontWeight: font.weight.regular,
            textTransform: "none",
            "&:hover": {
              bgcolor: "#1E5289",
            },
          }}
        />
      </Stack>

      {/* Search Input */}
      <Box sx={{ mb: 6 ,mt:6}}>
        <TextField
          size="small"
          placeholder="Search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{
            width: { xs: "100%", sm: 220 },
            "& .MuiOutlinedInput-root": {
              height: 40,
              borderRadius: "10px",
              borderColor: palette.slate[200],
              backgroundColor: "#ffffff",
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color={palette.slate[400]} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/* Table (Open, flat modern style without nested box border) */}
      <TableContainer sx={{ border: "none", overflowX: "auto" }}>
        <Table sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow sx={{ borderBottom: `1px solid ${palette.slate[200]}` }}>
              <TableCell
                sx={{
                  bgcolor:"transparent",
                  py: 1.75,
                  px: 2,
                  pl: 2.5,
                  fontSize: 13,
                  fontWeight: 500,
                  color: palette.slate[500],
                  borderBottom: "none",
                }}
              >
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                  <span>Template name</span>
                  <ChevronsUpDown size={14} color={palette.slate[400]} />
                </Stack>
              </TableCell>

              <TableCell
                sx={{
                  bgcolor:"transparent",
                  py: 1.75,
                  px: 2,
                  fontSize: 13,
                  fontWeight: 500,
                  color: palette.slate[500],
                  borderBottom: "none",
                }}
              >
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                  <span>Type</span>
                  <ChevronsUpDown size={14} color={palette.slate[400]} />
                </Stack>
              </TableCell>

              <TableCell
                sx={{
                  bgcolor:"transparent",
                  py: 1.75,
                  px: 2,
                  fontSize: 13,
                  fontWeight: 500,
                  color: palette.slate[500],
                  borderBottom: "none",
                }}
              >
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                  <span>Service provider</span>
                  <ChevronsUpDown size={14} color={palette.slate[400]} />
                </Stack>
              </TableCell>

              <TableCell
                sx={{
                  bgcolor:"transparent",
                  py: 1.75,
                  px: 2,
                  fontSize: 13,
                  fontWeight: 500,
                  color: palette.slate[500],
                  borderBottom: "none",
                }}
              >
                <span>Correspondent ID</span>
              </TableCell>

              <TableCell
                sx={{
                  bgcolor:"transparent",
                  py: 1.75,
                  px: 2,
                  fontSize: 13,
                  fontWeight: 500,
                  color: palette.slate[500],
                  borderBottom: "none",
                }}
              >
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                  <span>Created date</span>
                  <ChevronsUpDown size={14} color={palette.slate[400]} />
                </Stack>
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  bgcolor:"transparent",
                  py: 1.75,
                  pr: 0.5,
                  pl: 2,
                  borderBottom: "none",
                }}
              />
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 6, textAlign: "center", borderBottom: "none" }}>
                  <Typography sx={{ color: palette.slate[500], fontSize: 14 }}>
                    No payment templates found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTemplates.map((template) => (
                <TableRow
                  key={template.id}
                  onClick={() => onSelectTemplate?.(template)}
                  sx={{
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                    "&:hover": {
                      bgcolor: palette.slate[50],
                    },
                  }}
                >
                  {/* Template Name */}
                  <TableCell
                    sx={{
                      py: 2,
                      px: 2,
                      pl: 2,
                      fontSize: 14,
                      fontWeight: 600,
                      color: palette.slate[900],
                      borderBottom: "none",
                    }}
                  >
                    {template.name}
                  </TableCell>

                  {/* Type */}
                  <TableCell
                    sx={{
                      py: 2,
                      px: 2,
                      fontSize: 14,
                      color: palette.slate[700],
                      borderBottom: "none",
                    }}
                  >
                    {template.type}
                  </TableCell>

                  {/* Service Provider */}
                  <TableCell
                    sx={{
                      py: 2,
                      px: 2,
                      borderBottom: "none",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          bgcolor: "#EDF2F7",
                          color: palette.slate[900],
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {template.providerInitials}
                      </Avatar>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: palette.slate[900],
                        }}
                      >
                        {template.providerName}
                      </Typography>
                    </Stack>
                  </TableCell>

                  {/* Correspondent ID */}
                  <TableCell
                    sx={{
                      py: 2,
                      px: 2,
                      fontSize: 14,
                      color: palette.slate[700],
                      borderBottom: "none",
                    }}
                  >
                    {template.correspondentId}
                  </TableCell>

                  {/* Created Date */}
                  <TableCell
                    sx={{
                      py: 2,
                      px: 2,
                      fontSize: 14,
                      color: palette.slate[700],
                      borderBottom: "none",
                    }}
                  >
                    {template.createdAt}
                  </TableCell>

                  {/* Actions */}
                  <TableCell
                    align="right"
                    sx={{
                      py: 2,
                      pr: 0.5,
                      pl: 2,
                      borderBottom: "none",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{ justifyContent: "flex-end", alignItems: "center",pr:2,gap:2 }}
                    >
                      <Tooltip title="Edit template">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTemplate?.(template);
                          }}
                          sx={{
                            color: palette.slate[700],
                            p: 0.5,
                            "&:hover": {
                              color: palette.slate[900],
                              bgcolor: palette.slate[100],
                            },
                          }}
                        >
                          <Pencil size={17} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete template">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTemplate?.(template);
                          }}
                          sx={{
                            color: "#EF4444",
                            p: 0.5,
                            "&:hover": {
                              bgcolor: "rgba(239, 68, 68, 0.08)",
                            },
                          }}
                        >
                          <Trash2 size={17} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Footer only if more than rowsPerPage */}
      {totalCount > rowsPerPage && (
        <Box sx={{ mt: 3 }}>
          <BasePagination
            count={totalCount}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            variant="detailed"
          />
        </Box>
      )}
    </Box>
  );
}
