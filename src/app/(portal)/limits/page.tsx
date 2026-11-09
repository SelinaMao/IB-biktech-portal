"use client";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowUpDown, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import BaseIconButton from "@core/components/BaseIconButton";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import { BaseInput } from "@core/form";
import { useDebounce } from "@core/hooks/use-debounce";
import { font, palette } from "@/theme/palette";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { TransactionLimitsGrid, useGetMyLimitsQuery } from "@/features/transaction-limit";
import { useListUsersQuery, userStatusMeta, type AdminUser } from "@/features/user";

const PAGE_SIZE = 10;

/**
 * Two different jobs behind one route.
 *
 * <p>Someone who can set limits is managing a team, so they get the team listed, and each user
 * is edited on their own page. Someone who cannot is only ever asking "what am I allowed to
 * move?", so they get their own figures directly rather than a list they cannot act on.
 */
export default function LimitsPage() {
  const canView = useCan(CLIENT_PERMISSIONS.TRANSACTION_LIMIT.VIEW);
  const canUpdate = useCan(CLIENT_PERMISSIONS.TRANSACTION_LIMIT.UPDATE);

  if (!canView) {
    return (
      <Alert severity="error">You do not have permission to view transaction limits.</Alert>
    );
  }

  return canUpdate ? <TeamLimits /> : <OwnLimits />;
}

/**
 * What this user may move. Read-only, and deliberately just the figures — where they came
 * from is a company-level question they cannot act on.
 */
function OwnLimits() {
  const { data, isLoading } = useGetMyLimitsQuery();

  return (
    <Card
      sx={{
        bgcolor: palette.white,
        borderRadius: "16px",
        border: `1px solid ${palette.slate[200]}`,
        p: { xs: 2.5, sm: 3, md: 3.5 },
        boxShadow: "none",
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "20px", sm: "22px" },
              color: "#0F172A",
              lineHeight: 1.3,
              mb: 0.5,
            }}
          >
            My Transaction Limits
          </Typography>
          <Typography variant="body2" sx={{ color: palette.slate[500] }}>
            What you are allowed to move, and where each figure comes from.
          </Typography>
        </Box>

        <Alert severity="info" variant="outlined">
          These are set for you by someone who manages limits at your company. Ask them if you need
          more.
        </Alert>

        <TransactionLimitsGrid limits={data} isLoading={isLoading} readOnly />
      </Stack>
    </Card>
  );
}

/** Everyone in the company. Picking someone opens their own page. */
function TeamLimits() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const search = useDebounce(searchInput, 400);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(0);
  };

  const handleToggleSort = () => {
    setSortAsc((prev) => (prev === null ? true : prev ? false : null));
    setPage(0);
  };

  const { data, isLoading, isFetching } = useListUsersQuery({ page: 0, size: 200 });

  const rawUsers = useMemo(() => (data?.content ?? []).map((entry) => entry.user), [data]);

  const filteredUsers = useMemo(() => {
    let list = rawUsers;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.roles.some((r) => r.name.toLowerCase().includes(q)),
      );
    }
    if (sortAsc !== null) {
      list = [...list].sort((a, b) => {
        const nameA = a.fullName || a.username;
        const nameB = b.fullName || b.username;
        const cmp = nameA.localeCompare(nameB);
        return sortAsc ? cmp : -cmp;
      });
    }
    return list;
  }, [rawUsers, search, sortAsc]);

  const paginatedUsers = useMemo(
    () => filteredUsers.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredUsers, page],
  );

  const open = (userId: string) => router.push(`/limits/${userId}`);

  const headSx = {
    color: palette.slate[400],
    fontWeight: 400,
    fontSize: "14px",
  };

  const columns: BaseTableColumn<AdminUser>[] = [
    {
      key: "user",
      header: "User",
      width: "30%",
      headSx: { ...headSx, pl: { xs: 2, sm: 2.5 } },
      cellSx: { pl: { xs: 2, sm: 2.5 }, py: 2.2 },
      render: (user) => (
        <Stack spacing={0.25}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, fontSize: "14px", color: "#0F172A" }}
          >
            {user.fullName || user.username}
          </Typography>
          {user.fullName && user.username && (
            <Typography
              variant="caption"
              sx={{ fontWeight: 400, fontSize: "13px", color: palette.slate[400] }}
            >
              {user.username}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      width: "35%",
      headSx,
      cellSx: { py: 2.2 },
      render: (user) =>
        user.roles.length === 0 ? (
          <Typography variant="caption" sx={{ color: palette.slate[400], fontSize: "13px" }}>
            —
          </Typography>
        ) : (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            {user.roles.map((role) => (
              <Box
                key={role.id ?? role.name}
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "6px",
                  bgcolor: palette.slate[100],
                  color: palette.slate[700],
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {role.name}
              </Box>
            ))}
          </Stack>
        ),
    },
    {
      key: "status",
      header: "Status",
      width: "20%",
      headSx,
      cellSx: { py: 2.2 },
      render: (user) => {
        const isActive = user.status === "ACTIVE";
        const meta = userStatusMeta(user.status);
        return (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              px: 1.5,
              py: 0.5,
              borderRadius: "6px",
              bgcolor: isActive
                ? "#0E7054"
                : user.status === "PENDING_ACTIVATION"
                  ? "#FEF3C7"
                  : user.status === "DEACTIVATED" || user.status === "LOCKED"
                    ? "#FEE2E2"
                    : "#F1F5F9",
              color: isActive
                ? "#FFFFFF"
                : user.status === "PENDING_ACTIVATION"
                  ? "#92400E"
                  : user.status === "DEACTIVATED" || user.status === "LOCKED"
                    ? "#991B1B"
                    : "#475569",
              fontSize: "13px",
              fontWeight: 600,
              lineHeight: 1.4,
              whiteSpace: "nowrap",
            }}
          >
            {meta.label}
          </Box>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      width: "15%",
      align: "right",
      headSx: { ...headSx, pr: { xs: 2, sm: 2.5 } },
      cellSx: { pr: { xs: 2, sm: 2.5 }, py: 2.2 },
      render: (user) => (
        <Stack
          direction="row"
          spacing={1.5}
          onClick={(e) => e.stopPropagation()}
          sx={{ justifyContent: "flex-end", alignItems: "center" }}
        >
          <BaseIconButton
            isBorder
            icon={<Pencil size={font.size.md} color={palette.icon.default} />}
            tooltip="Set limits"
            onClick={(e) => {
              e?.stopPropagation?.();
              open(user.id);
            }}
            aria-label={`Set limits for ${user.fullName || user.username}`}
          />
        </Stack>
      ),
    },
  ];

  return (
    <Card
      sx={{
        bgcolor: palette.white,
        borderRadius: "16px",
        border: `1px solid ${palette.slate[200]}`,
        p: { xs: 2.5, sm: 3, md: 3.5 },
        boxShadow: "none",
      }}
    >
      {/* Top Header: Title & Subtitle */}
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "20px", sm: "22px" },
              color: "#0F172A",
              lineHeight: 1.3,
            }}
          >
            Limits
          </Typography>
          <Typography variant="body2" sx={{ color: palette.slate[500], mt: 0.5 }}>
            How you divide what your bank allows the company between your users.
          </Typography>
        </Box>
      </Stack>

      {/* Filter and Action Bar: Search & Sort Button */}
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <BaseInput
          placeholder="Search"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          size="small"
          fullWidth={false}
          sx={{
            width: { xs: "100%", sm: 260 },
            "& .MuiOutlinedInput-root": {
              height: 40,
              borderRadius: "10px",
              bgcolor: palette.white,
              fontSize: "14px",
              "& fieldset": {
                borderColor: palette.slate[200],
              },
              "&:hover fieldset": {
                borderColor: palette.slate[300],
              },
              "&.Mui-focused fieldset": {
                borderColor: "#1B5299",
              },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ color: palette.slate[400], ml: 0.5 }}>
                  <SearchRoundedIcon sx={{ fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          variant="outlined"
          onClick={handleToggleSort}
          endIcon={<ArrowUpDown size={15} />}
          sx={{
            height: 40,
            px: 2,
            borderRadius: "10px",
            borderColor: palette.slate[200],
            color: palette.slate[700],
            bgcolor: palette.white,
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 500,
            "&:hover": {
              borderColor: palette.slate[300],
              bgcolor: palette.slate[50],
            },
          }}
        >
          Sort
        </Button>
      </Stack>

      {/* Limits Table using BaseTable and BasePagination */}
      <BaseTable
        columns={columns}
        rows={paginatedUsers}
        getRowKey={(user) => user.id}
        isLoading={isLoading || isFetching}
        minWidth={720}
        emptyTitle="No users found"
        emptyDescription="Try a different search, or wait for users to be added."
        pagination={{
          count: filteredUsers.length,
          page,
          rowsPerPage: PAGE_SIZE,
          onPageChange: setPage,
        }}
        paginationVariant="compact"
        onRowClick={(user) => open(user.id)}
        rounded={false}
        headerBgColor="transparent"
        headerBorderColor={palette.slate[200]}
        headerTextColor={palette.slate[400]}
        headerBorderTop={false}
      />
    </Card>
  );
}
