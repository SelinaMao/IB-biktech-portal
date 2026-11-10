"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import BaseButton from "@core/components/BaseButton";
import BaseDialog from "@core/components/BaseDialog";
import { BaseInput } from "@core/form";
import { useDebounce } from "@core/hooks/use-debounce";
import { palette } from "@/theme/palette";
import { showToast } from "@core/components/AppToast";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import {
  RuleTable,
  useCloneTemplateMutation,
  useDeleteOrgRuleMutation,
  useListApproverGroupsQuery,
  useListOrgRulesQuery,
  useListWorkflowFunctionsQuery,
  type OrgWorkflowRule,
} from "@/features/workflow";
import { toToastError } from "@/utils/api-error";

const PAGE_SIZE = 10;

export default function ApprovalWorkflowSetupPage() {
  const router = useRouter();
  const canView = useCan(CLIENT_PERMISSIONS.WORKFLOW.CONFIGURATION_VIEW);
  const canCreate = useCan(CLIENT_PERMISSIONS.WORKFLOW.CONFIGURATION_CREATE);
  const canUpdate = useCan(CLIENT_PERMISSIONS.WORKFLOW.CONFIGURATION_UPDATE);
  const canDelete = useCan(CLIENT_PERMISSIONS.WORKFLOW.CONFIGURATION_DELETE);

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

  const rules = useListOrgRulesQuery(undefined, { skip: !canView });
  const functions = useListWorkflowFunctionsQuery(undefined, { skip: !canView });
  const groups = useListApproverGroupsQuery(undefined, { skip: !canView });

  const [deleteRule, deleteState] = useDeleteOrgRuleMutation();
  const [cloneTemplate, cloneState] = useCloneTemplateMutation();

  const [deleteTarget, setDeleteTarget] = useState<OrgWorkflowRule | null>(null);

  const groupNameByKey = useMemo(
    () => new Map((groups.data ?? []).map((group) => [group.groupKey, group.name])),
    [groups.data],
  );

  // Grouped by what they approve, financial first, then by name — an "All financial" rule arrives
  // as one rule per action, and listed by priority alone those would interleave with everything else.
  const list = useMemo(() => {
    const byCode = new Map((functions.data ?? []).map((fn) => [fn.code, fn]));
    const rank = (code: string) => (byCode.get(code)?.approvalCategory === "FINANCIAL" ? 0 : 1);
    const nameOf = (code: string) => byCode.get(code)?.name ?? code;
    return [...(rules.data ?? [])].sort(
      (a, b) =>
        rank(a.functionCode) - rank(b.functionCode) ||
        nameOf(a.functionCode).localeCompare(nameOf(b.functionCode)) ||
        a.priority - b.priority,
    );
  }, [rules.data, functions.data]);

  const filteredList = useMemo(() => {
    const byCode = new Map((functions.data ?? []).map((fn) => [fn.code, fn]));
    const nameOf = (code: string) => byCode.get(code)?.name ?? code;

    let res = list;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      res = res.filter(
        (rule) =>
          rule.functionCode.toLowerCase().includes(q) ||
          nameOf(rule.functionCode).toLowerCase().includes(q),
      );
    }
    if (sortAsc !== null) {
      res = [...res].sort((a, b) => {
        const cmp = nameOf(a.functionCode).localeCompare(nameOf(b.functionCode));
        return sortAsc ? cmp : -cmp;
      });
    }
    return res;
  }, [list, functions.data, search, sortAsc]);

  const paginatedRules = useMemo(
    () => filteredList.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredList, page],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRule(deleteTarget.id).unwrap();
      showToast("success", {
        title: "Rule deleted",
        message: "Requests for this action now follow the bank's default rule.",
      });
      setDeleteTarget(null);
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't delete the rule"));
    }
  };

  const seedFromTemplate = async () => {
    try {
      await cloneTemplate().unwrap();
      showToast("success", {
        title: "Approval Matrix created",
        message: "Your organization now has a copy of the bank's default rules.",
      });
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't copy the bank's default rules"));
    }
  };

  if (!canView) {
    return (
      <Alert severity="error" variant="outlined">
        You do not have permission to view the approval setup.
      </Alert>
    );
  }

  const noConfigYet = rules.isError && !rules.isLoading;
  const deleteName = deleteTarget
    ? ((functions.data ?? []).find((fn) => fn.code === deleteTarget.functionCode)?.name ??
      deleteTarget.functionCode)
    : "";

  return (
    <>
      <Card
        sx={{
          bgcolor: palette.white,
          borderRadius: "16px",
          border: `1px solid ${palette.slate[200]}`,
          p: { xs: 2.5, sm: 3, md: 3.5 },
          boxShadow: "none",
        }}
      >
        {/* Top Header: Title & Add Rule Button */}
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
              Approval Matrix
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: palette.slate[500], mt: 0.5, maxWidth: "80ch" }}
            >
              Which of your actions need approval, and who must give it. Each action has one rule;
              a financial rule can ask for more approvals as the amount grows. An action with no rule
              of its own here follows the bank&apos;s default rule.
            </Typography>
          </Box>

          {canCreate && (
            <BaseButton
              title="Add Rule"
              variant="contained"
              startIcon={<AddRoundedIcon sx={{ fontSize: 20 }} />}
              disabled={noConfigYet}
              onClick={() => router.push("/approval-workflow/rules/new")}
              sx={{
                bgcolor: "#1B5299",
                color: "#FFFFFF",
                borderRadius: "10px",
                height: 40,
                px: 2.5,
                fontSize: "14px",
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#15427C",
                  boxShadow: "none",
                },
              }}
            />
          )}
        </Stack>

        {noConfigYet && (
          <Alert
            severity="info"
            variant="outlined"
            sx={{ mb: 3 }}
            action={
              canCreate ? (
                <Button
                  size="small"
                  variant="outlined"
                  disabled={cloneState.isLoading}
                  onClick={seedFromTemplate}
                >
                  Copy the bank&apos;s default rules
                </Button>
              ) : undefined
            }
          >
            Your organization has no approval setup of its own yet.
          </Alert>
        )}

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

        {/* Rule Table using BaseTable and BasePagination */}
        <RuleTable
          rules={paginatedRules}
          functions={functions.data ?? []}
          groupNameByKey={groupNameByKey}
          isLoading={rules.isLoading || rules.isFetching}
          canEdit={canUpdate}
          canDelete={canDelete}
          onEdit={(rule) => router.push(`/approval-workflow/rules/${rule.id}`)}
          onDelete={setDeleteTarget}
          onRowClick={(rule) => canUpdate && router.push(`/approval-workflow/rules/${rule.id}`)}
          pagination={{
            count: filteredList.length,
            page,
            rowsPerPage: PAGE_SIZE,
            onPageChange: setPage,
          }}
        />
      </Card>

      {deleteTarget && (
        <BaseDialog
          open
          title="Delete this rule?"
          subtitle={deleteName}
          confirmTitle="Delete"
          confirmColor="error"
          isLoading={deleteState.isLoading}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        >
          <Typography variant="body2">
            Requests for this action will follow the bank&apos;s default rule instead. Requests
            already in flight keep the chain they started with.
          </Typography>
        </BaseDialog>
      )}
    </>
  );
}
