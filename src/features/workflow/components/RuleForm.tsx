"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import BaseButton from "@core/components/BaseButton";
import BaseCard from "@core/components/BaseCard";
import BaseCheckbox from "@core/form/BaseCheckbox";
import BaseInput from "@core/form/BaseInput";

import RequirementCard from "./RequirementCard";
import RuleSummary from "./RuleSummary";
import { money, rangeWords } from "../rule-words";
import { useListApproverGroupsQuery } from "../workflow.api";
import {
  AMOUNT_ATTRIBUTE,
  CONDITION_OPERATORS,
  groupKeysOf,
  type ApprovalCategory,
  type ApproverQuota,
  type OrgRuleBatchPayload,
  type OrgWorkflowRule,
  type OrgWorkflowRulePayload,
  type RuleChainLevel,
  type RuleCondition,
  type RuleSlab,
  type WorkflowFunction,
} from "../workflow.types";

type Props = {
  /** Null when creating. */
  rule: OrgWorkflowRule | null;
  /** The actions this organization can put behind approval. */
  functions: WorkflowFunction[];
  /** Rules already saved, so a new one can say which actions it would sit beside. */
  existingRules: OrgWorkflowRule[];
  isSaving?: boolean;
  onCancel: () => void;
  /** A new rule: one per chosen action, each holding every slab, saved together. */
  onCreate: (payload: OrgRuleBatchPayload) => void;
  /** An existing rule: one action, every slab of it. */
  onUpdate: (payload: OrgWorkflowRulePayload) => void;
};

/** One amount slab and the chain it demands. A non-financial rule is a single slab with no amount. */
type Band = {
  from: string;
  to: string;
  noUpperLimit: boolean;
  chain: RuleChainLevel[];
};

type Form = {
  category: ApprovalCategory;
  /** ALL covers every action of the category; PICKED only those ticked. */
  target: "ALL" | "PICKED";
  functionCodes: string[];
  /** Financial: one per amount slab. Non-financial: exactly one, whose amounts are not used. */
  bands: Band[];
  /**
   * A non-financial rule saved with amount slabs before slabs became financial-only. It is shown
   * and saved with them rather than squeezed into one chain: dropping them would widen the rule to
   * every amount, handing a chain authority over sums it was never given.
   */
  legacySlabs: boolean;
  otherConditions: RuleCondition[];
};

const CATEGORY_LABEL: Record<ApprovalCategory, string> = { FINANCIAL: "financial", NON_FINANCIAL: "non-financial" };

/**
 * Quotas still carry a capability code, but approving is granted by role, so the value no longer
 * narrows anything. One constant keeps the payload valid without asking about it.
 */
const QUOTA_CAPABILITY = "CHECKER";

const quota = (requiredCount = 1): ApproverQuota => ({
  capability: QUOTA_CAPABILITY,
  specificUserIds: [],
  groupKey: null,
  requiredCount,
});

const level = (n: number): RuleChainLevel => ({ level: n, sequence: "PARALLEL", quotas: [quota()] });

const band = (from = "0", to = "", noUpperLimit = true, chain?: RuleChainLevel[]): Band => ({
  from,
  to,
  noUpperLimit,
  chain: chain ?? [level(1)],
});

const emptyForm = (category: ApprovalCategory): Form => ({
  category,
  // Nothing ticked yet: covering every action is a choice the organization makes, never a default.
  target: "PICKED",
  functionCodes: [],
  bands: [band()],
  legacySlabs: false,
  otherConditions: [],
});

/** What each starting point lays out, so nobody is staring at an empty chain. */
const PRESETS = [
  {
    key: "ONE",
    label: "One approver",
    hint: "One person signs off.",
    financialOnly: false,
    apply: (f: Form): Form => ({ ...f, bands: [band(f.bands[0].from, f.bands[0].to, f.bands[0].noUpperLimit, [level(1)])] }),
  },
  {
    key: "TWO",
    label: "Two approvers",
    hint: "Two people must sign off, one after the other.",
    financialOnly: false,
    apply: (f: Form): Form => ({ ...f, bands: [band(f.bands[0].from, f.bands[0].to, f.bands[0].noUpperLimit, [level(1), level(2)])] }),
  },
  {
    key: "SLABS",
    label: "Amount slabs",
    hint: "Bigger amounts need more approvals.",
    financialOnly: true,
    apply: (f: Form): Form => ({ ...f, bands: [band("0", "10000", false, [level(1)]), band("10000", "", true, [level(1), level(2)])] }),
  },
] as const;

/** A stored slab as the form edits it. Zero is stored as an open floor. */
const bandOf = (slab: RuleSlab): Band =>
  band(String(slab.amountFrom ?? 0), slab.amountTo == null ? "" : String(slab.amountTo), slab.amountTo == null, slab.chain?.length ? slab.chain : [level(1)]);

/** The rule's slabs; a server older than slabs only sends the first one's range and chain. */
const slabsOfRule = (rule: OrgWorkflowRule): RuleSlab[] =>
  rule.slabs?.length ? rule.slabs : [{ amountFrom: rule.amountFrom ?? null, amountTo: rule.amountTo ?? null, chain: rule.chain?.length ? rule.chain : [level(1)] }];

/** Read a stored rule back into the form: one action, every slab of its policy. */
function fromRule(rule: OrgWorkflowRule, fn: WorkflowFunction | undefined): Form {
  const slabs = slabsOfRule(rule);
  const hasAmounts = slabs.length > 1 || slabs.some((s) => Boolean(s.amountFrom) || s.amountTo != null);
  const category: ApprovalCategory = fn?.approvalCategory ?? (hasAmounts ? "FINANCIAL" : "NON_FINANCIAL");
  const financial = category === "FINANCIAL";
  return {
    category,
    target: "PICKED",
    functionCodes: [rule.functionCode],
    bands: financial || hasAmounts ? slabs.map(bandOf) : [band("0", "", true, bandOf(slabs[0]).chain)],
    legacySlabs: !financial && hasAmounts,
    otherConditions: (rule.conditions ?? []).filter((c) => c.attribute !== AMOUNT_ATTRIBUTE),
  };
}

/**
 * Which preset the form currently looks like, or null once it has been changed beyond one.
 * Derived rather than remembered, so a highlight never tells of a chain that has since changed.
 */
function activePreset(form: Form): string | null {
  if (form.bands.length > 1) return "SLABS";
  const chain = form.bands[0]?.chain ?? [];
  const isPlain = chain.every((l) => l.quotas.length === 1 && groupKeysOf(l.quotas[0]).length === 0 && !l.quotas[0].specificUserIds?.length);
  if (!isPlain) return null;
  if (chain.length === 1 && chain[0].quotas[0].requiredCount === 1) return "ONE";
  if (chain.length === 2 && chain.every((l) => l.quotas[0].requiredCount === 1)) return "TWO";
  return null;
}

/** Levels are renumbered from 1 on every structural change; the server rejects gaps. */
const renumber = (chain: RuleChainLevel[]): RuleChainLevel[] => chain.map((l, i) => ({ ...l, level: i + 1 }));

const validAmount = (value: string) => {
  if (!value.trim()) return false;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0;
};

const validBand = (value: Band) => validAmount(value.from) && (value.noUpperLimit || (validAmount(value.to) && Number(value.to) >= Number(value.from)));

const ceilingOf = (value: Band) => (value.noUpperLimit ? Number.POSITIVE_INFINITY : Number(value.to || 0));

/** A slab as it is being typed: an upper amount not entered yet reads as missing, never as unlimited. */
const bandWords = (b: Band) => (!b.noUpperLimit && !b.to.trim() ? `${money(b.from || 0)} – … USD` : rangeWords(Number(b.from) || null, b.noUpperLimit ? null : Number(b.to)));

/**
 * Slabs that share more than a boundary, numbered as they are shown. Every slab an amount falls in
 * is offered, so a request there can be approved by whichever slab's approvers are met first —
 * sometimes the point, more often a typo that hands the cheaper chain bigger sums.
 */
function overlappingPairs(bands: Band[]): { first: number; second: number; from: number; to: number }[] {
  const pairs: { first: number; second: number; from: number; to: number }[] = [];
  for (let i = 0; i < bands.length; i += 1) {
    for (let j = i + 1; j < bands.length; j += 1) {
      if (!validBand(bands[i]) || !validBand(bands[j])) continue;
      const from = Math.max(Number(bands[i].from), Number(bands[j].from));
      const to = Math.min(ceilingOf(bands[i]), ceilingOf(bands[j]));
      if (from < to) pairs.push({ first: i + 1, second: j + 1, from, to });
    }
  }
  return pairs;
}

type Span = { from: number; to: number };

/** Amounts nothing covers, walking the line from zero. A request for one of them is refused. */
function uncovered(spans: Span[]): Span[] {
  const gaps: Span[] = [];
  let reached = 0;
  for (const span of [...spans].sort((a, b) => a.from - b.from)) {
    if (span.from - reached > 0.01) gaps.push({ from: reached, to: span.from });
    reached = Math.max(reached, span.to);
    if (reached === Number.POSITIVE_INFINITY) return gaps;
  }
  return [...gaps, { from: reached, to: Number.POSITIVE_INFINITY }];
}

const gapWords = (gap: Span) => {
  if (gap.to === Number.POSITIVE_INFINITY) return `above ${money(gap.from)} USD`;
  if (gap.from === 0) return `below ${money(gap.to)} USD`;
  return `between ${money(gap.from)} and ${money(gap.to)} USD`;
};

const namesOf = (functions: WorkflowFunction[], max = 3) =>
  functions.length <= max
    ? functions.map((fn) => fn.name).join(", ")
    : `${functions.slice(0, max).map((fn) => fn.name).join(", ")} and ${functions.length - max} more`;

const needsApproval = (fn: WorkflowFunction) => fn.approvalRequired !== false;

const sectionTitle = { fontWeight: 600 } as const;

const outlined = { border: 1, borderColor: "divider", borderRadius: 1 } as const;

const slabChip = (n: number) => <Chip size="small" color="primary" variant="outlined" label={`Slab ${n}`} sx={{ fontWeight: 600 }} />;

/**
 * A rule as the organization writes it: what is approved, for which amounts, and who signs.
 *
 * <p>Laid out like the bank's own rule setup, so the same words mean the same thing on both sides:
 * pick financial or non-financial first, then every action of that kind or a few; a financial rule
 * is split into amount slabs, each with its own approvers.
 */
export default function RuleForm({ rule, functions, existingRules, isSaving, onCancel, onCreate, onUpdate }: Props) {
  const [form, setForm] = useState<Form>(() => {
    if (rule) return fromRule(rule, functions.find((fn) => fn.code === rule.functionCode));
    return emptyForm(functions.some((fn) => fn.active && fn.approvalCategory === "FINANCIAL") ? "FINANCIAL" : "NON_FINANCIAL");
  });
  const [submitted, setSubmitted] = useState(false);
  const groups = useListApproverGroupsQuery();
  const current = activePreset(form);
  const isEdit = rule !== null;
  const financial = form.category === "FINANCIAL";
  /** Split by amount: every financial rule, and a non-financial one saved with slabs before. */
  const slabbed = financial || form.legacySlabs;
  const categoryLabel = CATEGORY_LABEL[form.category];

  const inCategory = useMemo(
    () => functions.filter((fn) => fn.active && fn.approvalCategory === form.category),
    [functions, form.category],
  );

  /** What "all" covers — the same filter the service applies, so the count shown is the count saved. */
  const allTargets = useMemo(() => inCategory.filter(needsApproval), [inCategory]);

  const targets = useMemo(
    () =>
      form.target === "ALL"
        ? allTargets
        : form.functionCodes
            .map((code) => functions.find((fn) => fn.code === code))
            .filter((fn): fn is WorkflowFunction => fn !== undefined),
    [form.target, form.functionCodes, allTargets, functions],
  );

  /**
   * What saving does to each chosen action, worked out the way the service will: one rule per
   * action, so an action with a rule has it rewritten — unless this is "All" and the rule is the
   * action's own, which "All" never touches.
   */
  const plan = useMemo(() => {
    const created: WorkflowFunction[] = [];
    const updated: WorkflowFunction[] = [];
    const kept: WorkflowFunction[] = [];
    if (isEdit) return { created, updated, kept };
    for (const fn of targets) {
      const saved = existingRules.filter((r) => r.functionCode === fn.code);
      if (saved.length === 0) created.push(fn);
      else if (form.target === "ALL" && saved.some((r) => !r.fromAll)) kept.push(fn);
      else updated.push(fn);
    }
    return { created, updated, kept };
  }, [isEdit, targets, existingRules, form.target]);

  /** The actions this saves a rule for — whose approvers the requirement cards look up. */
  const targetCodes = isEdit ? form.functionCodes : [...plan.created, ...plan.updated].map((fn) => fn.code);

  const groupNameByKey = useMemo(
    () => new Map((groups.data ?? []).map((g) => [g.groupKey, g.name])),
    [groups.data],
  );

  /** Slabs are shown tightest ceiling first, whatever order they were typed in — the order they are saved in. */
  const orderedBands = useMemo(
    () => (slabbed ? [...form.bands].sort((a, b) => ceilingOf(a) - ceilingOf(b)) : form.bands),
    [slabbed, form.bands],
  );

  const amountOf = (value: string) => (value.trim() ? Number(value) : null);

  const slabOf = (b: Band): RuleSlab =>
    slabbed
      ? { amountFrom: amountOf(b.from), amountTo: b.noUpperLimit ? null : amountOf(b.to), chain: renumber(b.chain) }
      : { amountFrom: null, amountTo: null, chain: renumber(b.chain) };

  const summaryRange = slabbed
    ? { from: amountOf(orderedBands[0].from), to: orderedBands[0].noUpperLimit ? null : amountOf(orderedBands[0].to) }
    : { from: null, to: null };

  const targetLabel = (() => {
    if (form.target === "ALL") return allTargets.length ? `all ${allTargets.length} ${categoryLabel} actions` : undefined;
    if (targets.length === 0) return isEdit ? form.functionCodes[0] : undefined;
    if (targets.length === 1) return targets[0].name;
    return `${targets[0].name} and ${targets.length - 1} more`;
  })();

  const rulesToSave = plan.created.length + plan.updated.length;

  /** "Each action gets one rule holding all 3 slabs. Saving creates 6 rules, updates 1, leaves 1 unchanged." */
  const planWords = (() => {
    const holding = !slabbed || form.bands.length < 2 ? "" : form.bands.length === 2 ? " holding both slabs" : ` holding all ${form.bands.length} slabs`;
    const done = [
      plan.created.length ? `creates ${plan.created.length} rule${plan.created.length > 1 ? "s" : ""}` : "",
      plan.updated.length ? `updates ${plan.updated.length}` : "",
      plan.kept.length ? `leaves ${plan.kept.length} unchanged` : "",
    ].filter(Boolean);
    return `Each action gets one rule${holding}. Saving ${done.length ? done.join(", ") : "changes nothing"}.`;
  })();

  const targetValid = form.target === "ALL" ? allTargets.length > 0 : form.functionCodes.length > 0;
  const conditionsValid = form.otherConditions.every((c) => c.attribute.trim() && c.operator.trim() && c.value.trim());
  const amountsValid = !slabbed || form.bands.every(validBand);
  const bandOverlaps = useMemo(() => (slabbed ? overlappingPairs(form.bands) : []), [slabbed, form.bands]);

  /** Amounts that would be refused. A rule holds all its action's slabs, so it is judged on its own. */
  const gaps = useMemo(() => {
    if (!slabbed || !form.bands.every(validBand)) return [];
    return uncovered(form.bands.map((b) => ({ from: Number(b.from), to: ceilingOf(b) })));
  }, [slabbed, form.bands]);

  /** With several slabs the summary reads one line per slab, smallest amounts first. */
  const summarySlabs =
    slabbed && form.bands.length > 1
      ? orderedBands.map((b) => ({ amountFrom: amountOf(b.from), amountTo: b.noUpperLimit ? null : amountOf(b.to), chain: renumber(b.chain) }))
      : undefined;
  const chainsValid = form.bands.length > 0 && form.bands.every((b) => b.chain.length > 0 && b.chain.every((l) => l.quotas.length > 0));
  const isValid = targetValid && amountsValid && conditionsValid && chainsValid;

  const patch = (changes: Partial<Form>) => setForm((c) => ({ ...c, ...changes }));

  /**
   * Switching type starts the pick over, since the actions ticked belong to the other one. The
   * approvers carry over as one slab at any amount: a non-financial rule has no slabs to keep.
   */
  const setCategory = (next: ApprovalCategory) => {
    if (next === form.category) return;
    patch({ category: next, functionCodes: [], bands: [band("0", "", true, form.bands[0].chain)] });
  };

  const toggleFunction = (code: string, on: boolean) =>
    patch({ functionCodes: on ? [...form.functionCodes, code] : form.functionCodes.filter((c) => c !== code) });

  const patchBand = (bandIndex: number, changes: Partial<Band>) =>
    patch({ bands: form.bands.map((b, i) => (i === bandIndex ? { ...b, ...changes } : b)) });

  const patchLevel = (bandIndex: number, levelIndex: number, changes: Partial<RuleChainLevel>) =>
    patchBand(bandIndex, {
      chain: form.bands[bandIndex].chain.map((l, i) => (i === levelIndex ? { ...l, ...changes } : l)),
    });

  const patchQuota = (bandIndex: number, levelIndex: number, quotaIndex: number, changes: Partial<ApproverQuota>) =>
    patchLevel(bandIndex, levelIndex, {
      quotas: form.bands[bandIndex].chain[levelIndex].quotas.map((q, i) => (i === quotaIndex ? { ...q, ...changes } : q)),
    });

  /** A new slab starts where the highest capped one stops, which is usually where the next one goes. */
  const addSlab = () => {
    const capped = form.bands.filter((b) => !b.noUpperLimit && validAmount(b.to)).map((b) => Number(b.to));
    patch({ bands: [...form.bands, band(capped.length ? String(Math.max(...capped)) : "0", "", true, [level(1)])] });
  };

  const submit = () => {
    setSubmitted(true);
    if (!isValid) return;
    const slabs = (slabbed ? form.bands : form.bands.slice(0, 1)).map(slabOf);
    if (rule) {
      // Settings the form does not show are kept exactly as they were saved.
      onUpdate({
        functionCode: rule.functionCode,
        conditions: form.otherConditions,
        slabs,
        timeLimitHours: rule.timeLimitHours,
        escalation: rule.escalation,
        overrideAuthority: rule.overrideAuthority,
        derivedFromMandatory: rule.derivedFromMandatory,
        templateRuleId: rule.templateRuleId,
        priority: rule.priority,
      });
      return;
    }
    onCreate({
      category: form.category,
      allFunctions: form.target === "ALL",
      functionCodes: form.target === "ALL" ? [] : form.functionCodes,
      slabs,
      timeLimitHours: null,
      escalation: null,
      priority: 50,
    });
  };

  const whoNumber = slabbed ? 3 : 2;

  const saveLabel = isEdit
    ? "Save rule"
    : rulesToSave > 1
      ? `Save ${rulesToSave} rules`
      : plan.created.length === 1
        ? "Create rule"
        : "Save rule";

  return (
    <Stack spacing={3}>
      <BaseCard sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <RuleSummary
              functionName={targetLabel}
              amountFrom={summaryRange.from}
              amountTo={summaryRange.to}
              chain={renumber(orderedBands[0].chain)}
              slabs={summarySlabs}
              groupNameByKey={groupNameByKey}
            />
            {!isEdit && targets.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                {planWords}
              </Typography>
            )}
          </Box>

          {rule?.derivedFromMandatory && (
            <Alert severity="info" variant="outlined">
              The bank pinned this rule. You can ask for more approvals, but weakening it will be refused.
            </Alert>
          )}

          {!isEdit && (
            <Box>
              {/* Actions, not a mode: they lay out a chain and leave no trace. */}
              <Stack direction="row" alignItems="center" sx={{ gap: 1, flexWrap: "wrap" }}>
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                  Start from
                </Typography>
                {PRESETS.filter((preset) => financial || !preset.financialOnly).map((preset) => (
                  <Button
                    key={preset.key}
                    size="small"
                    title={preset.hint}
                    variant={current === preset.key ? "contained" : "outlined"}
                    onClick={() => setForm(preset.apply)}
                  >
                    {preset.label}
                  </Button>
                ))}
                {current === null && (
                  <Typography variant="caption" color="text.secondary">
                    Custom
                  </Typography>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                Picking one replaces the approvers below with a starting point.
              </Typography>
            </Box>
          )}

          {/* ---------------------------------------------------------- 1 */}
          <Box>
            <Typography variant="subtitle2" sx={{ ...sectionTitle, mb: 1 }}>
              1 · What is being approved
            </Typography>

            {isEdit ? (
              <Box sx={{ ...outlined, bgcolor: "action.hover", px: 2.5, py: 2 }}>
                <Typography variant="body2">
                  <strong>{targets[0]?.name ?? rule.functionCode}</strong>
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    {" "}
                    · {financial ? "Financial" : "Non-financial"}
                  </Box>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", display: "block" }}>
                  {rule.functionCode}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  A saved rule stays on its action. To cover another one, add a new rule.
                </Typography>
                {rule.fromAll && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Set by &ldquo;All {categoryLabel}&rdquo;. Changing its approvers or slabs makes it this
                    action&apos;s own rule, which a later &ldquo;All&rdquo; will not change.
                  </Typography>
                )}
              </Box>
            ) : (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                    Type
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={form.category}
                    onChange={(_event, next: ApprovalCategory | null) => next && setCategory(next)}
                  >
                    <ToggleButton value="FINANCIAL">Financial</ToggleButton>
                    <ToggleButton value="NON_FINANCIAL">Non-financial</ToggleButton>
                  </ToggleButtonGroup>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                    {financial
                      ? "Transactions that move money. Approvers are set per amount slab."
                      : "Everything else — users, roles, limits, settings. One approval chain, whatever the amount."}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Applies to
                  </Typography>
                  <RadioGroup
                    row
                    value={form.target}
                    onChange={(_event, next) => patch({ target: next as Form["target"] })}
                  >
                    <FormControlLabel
                      value="ALL"
                      disabled={allTargets.length === 0}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">All {categoryLabel} actions ({allTargets.length})</Typography>}
                    />
                    <FormControlLabel
                      value="PICKED"
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">Specific actions</Typography>}
                    />
                  </RadioGroup>
                </Box>

                {inCategory.length === 0 ? (
                  <Alert severity="info" variant="outlined">
                    Your organization raises no {categoryLabel} actions, so there is nothing here for a{" "}
                    {categoryLabel} rule to cover.
                  </Alert>
                ) : form.target === "ALL" ? (
                  <Typography variant="caption" color="text.secondary">
                    Covers {allTargets.map((fn) => fn.name).join(", ")}.
                    {inCategory.length > allTargets.length &&
                      ` Leaves out ${namesOf(inCategory.filter((fn) => !needsApproval(fn)))}, which the bank set to need no approval.`}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      ...outlined,
                      p: 2.5,
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      columnGap: 3,
                      rowGap: 1.5,
                    }}
                  >
                    {inCategory.map((fn) => (
                      <BaseCheckbox
                        key={fn.code}
                        checked={form.functionCodes.includes(fn.code)}
                        onChange={(_event, checked) => toggleFunction(fn.code, checked)}
                        labelSx={{ alignItems: "flex-start", m: 0 }}
                        sx={{ pt: 0.25 }}
                        label={
                          <Box sx={{ pt: 0.5 }}>
                            <Typography variant="body2">{fn.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                              {fn.code}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </Box>
                )}

                {submitted && !targetValid && (
                  <Alert severity="error" variant="outlined">
                    Choose at least one action, or apply the rule to all of them.
                  </Alert>
                )}

                {plan.kept.length > 0 && (
                  <Alert severity="info" variant="outlined">
                    {namesOf(plan.kept)}{" "}
                    {plan.kept.length === 1 ? "has its own rule, so it stays as it is" : "have their own rules, so they stay as they are"}.
                    &ldquo;All&rdquo; never changes an action&apos;s own rule.
                  </Alert>
                )}

                {plan.updated.length > 0 && (
                  <Alert severity={form.target === "ALL" ? "info" : "warning"} variant="outlined">
                    {form.target === "ALL"
                      ? `${namesOf(plan.updated)} ${plan.updated.length === 1 ? "has a rule" : "have rules"} from an earlier "All" or the bank's defaults; saving updates ${plan.updated.length === 1 ? "it" : "them"}.`
                      : `${namesOf(plan.updated)} already ${plan.updated.length === 1 ? "has a rule" : "have rules"}. Saving replaces ${plan.updated.length === 1 ? "it" : "them"} with this one.`}
                  </Alert>
                )}
              </Stack>
            )}
          </Box>

          {/* ---------------------------------------------------------- 2 · financial only */}
          {slabbed && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={sectionTitle}>
                  2 · When does it apply?
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  Split requests by amount. Each slab gets its own approvers in step 3. A request uses the
                  slab its amount falls in. Amounts are in USD; other currencies are converted first.
                </Typography>
                {form.legacySlabs && (
                  <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
                    This non-financial rule was saved with amount slabs, before only financial rules used
                    them. They are kept as they are; remove all but one and clear its amounts to make it one
                    chain at any amount.
                  </Alert>
                )}

                <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                  {form.bands.map((b, bandIndex) => (
                    <Stack
                      key={bandIndex}
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ sm: "flex-end" }}
                      sx={{ ...outlined, p: 2, gap: 1.5 }}
                    >
                      {form.bands.length > 1 && <Box sx={{ pb: { sm: 1 } }}>{slabChip(bandIndex + 1)}</Box>}
                      <Box sx={{ width: { xs: "100%", sm: 180 }, flexShrink: 0 }}>
                        <BaseInput
                          label="From"
                          type="number"
                          size="small"
                          value={b.from}
                          error={submitted && !validAmount(b.from)}
                          slotProps={{
                            htmlInput: { min: 0, step: "any" },
                            input: { endAdornment: <InputAdornment position="end">USD</InputAdornment> },
                          }}
                          onChange={(event) => patchBand(bandIndex, { from: event.target.value })}
                        />
                      </Box>
                      <Box sx={{ width: { xs: "100%", sm: 180 }, flexShrink: 0 }}>
                        <BaseInput
                          label="Up to"
                          type="number"
                          size="small"
                          placeholder="No limit"
                          value={b.noUpperLimit ? "" : b.to}
                          disabled={b.noUpperLimit}
                          error={submitted && !b.noUpperLimit && !validBand(b)}
                          slotProps={{
                            htmlInput: { min: 0, step: "any" },
                            input: { endAdornment: <InputAdornment position="end">USD</InputAdornment> },
                          }}
                          onChange={(event) => patchBand(bandIndex, { to: event.target.value })}
                        />
                      </Box>
                      <Box sx={{ pb: { sm: 0.25 } }}>
                        <BaseCheckbox
                          label={<Typography variant="body2">No upper limit</Typography>}
                          checked={b.noUpperLimit}
                          onChange={(_event, checked) => patchBand(bandIndex, { noUpperLimit: checked })}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }} />
                      {form.bands.length > 1 && (
                        <IconButton
                          aria-label={`Remove slab ${bandIndex + 1}`}
                          onClick={() => patch({ bands: form.bands.filter((_, i) => i !== bandIndex) })}
                          sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  ))}
                </Stack>

                <Stack direction="row" alignItems="center" sx={{ gap: 1.5, mt: 1.5, flexWrap: "wrap" }}>
                  <Button size="small" variant="outlined" startIcon={<AddRoundedIcon />} onClick={addSlab}>
                    Add slab
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    From and Up to are both included.
                  </Typography>
                </Stack>

                {submitted && !amountsValid && (
                  <Alert severity="error" variant="outlined" sx={{ mt: 1.5 }}>
                    Enter amounts of 0 or more, and make each Up to at least as big as its From.
                  </Alert>
                )}

                {gaps.length > 0 && (
                  <Alert severity="warning" variant="outlined" sx={{ mt: 1.5 }}>
                    {gaps.map((gap, index) => (
                      <Typography key={index} variant="body2">
                        No slab covers amounts {gapWords(gap)}, so those requests will be refused.
                      </Typography>
                    ))}
                  </Alert>
                )}

                {bandOverlaps.length > 0 && (
                  <Alert severity="warning" variant="outlined" sx={{ mt: 1.5 }}>
                    {bandOverlaps.map(({ first, second, from, to }, index) => (
                      <Typography key={index} variant="body2">
                        Slabs {first} and {second} both cover {rangeWords(from, to)}. For those amounts,
                        either slab&apos;s approvers can approve.
                      </Typography>
                    ))}
                  </Alert>
                )}

                {/* Adding conditions is switched off; a rule that already carries some shows them so they can be removed. */}
                {form.otherConditions.length > 0 && (
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Other conditions (apply to every slab)
                    </Typography>
                    {form.otherConditions.map((condition, index) => (
                      <Stack key={index} direction="row" alignItems="center" sx={{ gap: 1 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {condition.attribute}{" "}
                          {CONDITION_OPERATORS.find((o) => o.value === condition.operator)?.label ?? condition.operator}{" "}
                          <strong>{condition.value}</strong>
                        </Typography>
                        <IconButton
                          size="small"
                          aria-label="Remove condition"
                          onClick={() => patch({ otherConditions: form.otherConditions.filter((_, i) => i !== index) })}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>
            </>
          )}

          <Divider />

          {/* ---------------------------------------------------------- who approves */}
          <Box>
            <Typography variant="subtitle2" sx={sectionTitle}>
              {whoNumber} · Who approves
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              {slabbed && form.bands.length > 1
                ? "Set who approves each slab. Levels are approved in order, level 1 first."
                : "Levels are approved in order, level 1 first."}
            </Typography>

            <Stack spacing={2.5} sx={{ mt: 1.5 }}>
              {form.bands.map((b, bandIndex) => (
                <Box key={bandIndex} sx={slabbed ? { ...outlined, p: 2.5 } : undefined}>
                  {/* The amounts are set in step 2; here they only say which slab these approvers are for. */}
                  {slabbed && (
                    <Stack direction="row" alignItems="center" sx={{ gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                      {form.bands.length > 1 && slabChip(bandIndex + 1)}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {bandWords(b)}
                      </Typography>
                    </Stack>
                  )}

                  <Stack spacing={2.5}>
                    {b.chain.map((lvl, levelIndex) => (
                      <Box key={levelIndex} sx={{ ...outlined, p: 2.5 }}>
                        <Stack direction="row" alignItems="center" sx={{ gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Level {levelIndex + 1}
                          </Typography>
                          <Box sx={{ flex: 1 }} />
                          <ToggleButtonGroup
                            exclusive
                            size="small"
                            value={lvl.sequence}
                            onChange={(_event, next: RuleChainLevel["sequence"] | null) =>
                              next && patchLevel(bandIndex, levelIndex, { sequence: next })
                            }
                          >
                            <ToggleButton value="PARALLEL">All at once</ToggleButton>
                            <ToggleButton value="SEQUENTIAL">In order</ToggleButton>
                          </ToggleButtonGroup>
                          {b.chain.length > 1 && (
                            <IconButton
                              aria-label="Remove level"
                              onClick={() => patchBand(bandIndex, { chain: renumber(b.chain.filter((_, i) => i !== levelIndex)) })}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>

                        <Stack spacing={1.5} alignItems="flex-start">
                          {lvl.quotas.map((q, quotaIndex) => (
                            <RequirementCard
                              key={quotaIndex}
                              index={quotaIndex}
                              quota={q}
                              functionCodes={targetCodes}
                              sequence={lvl.sequence}
                              groups={groups.data ?? []}
                              canRemove={lvl.quotas.length > 1}
                              onChange={(changes) => patchQuota(bandIndex, levelIndex, quotaIndex, changes)}
                              onRemove={() =>
                                patchLevel(bandIndex, levelIndex, { quotas: lvl.quotas.filter((_, i) => i !== quotaIndex) })
                              }
                            />
                          ))}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddRoundedIcon />}
                            onClick={() => patchLevel(bandIndex, levelIndex, { quotas: [...lvl.quotas, quota()] })}
                          >
                            Also require approval from…
                          </Button>
                          {lvl.quotas.length > 1 && (
                            <Typography variant="caption" color="text.secondary">
                              This level passes only when every line above is met — how an authority matrix says
                              &ldquo;one from each side&rdquo;.
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    ))}
                    <Box>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddRoundedIcon />}
                        onClick={() => patchBand(bandIndex, { chain: [...b.chain, level(b.chain.length + 1)] })}
                      >
                        Add level
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </BaseCard>

      <BaseCard sx={{ position: "sticky", bottom: 16, zIndex: 2, py: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ gap: 1.5 }}>
          <BaseButton title="Cancel" variant="outlined" disabled={isSaving} onClick={onCancel} sx={{ minWidth: 120 }} />
          {/* Nothing to write when "All" would only reach actions with their own rule. */}
          <BaseButton
            title={saveLabel}
            variant="contained"
            isLoading={isSaving}
            disabled={!isEdit && targets.length > 0 && rulesToSave === 0}
            onClick={submit}
            sx={{ minWidth: 140 }}
          />
        </Stack>
      </BaseCard>
    </Stack>
  );
}
