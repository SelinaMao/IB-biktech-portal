/**
 * Approval workflow contracts for the corporate side — mirrors workflow-service's DTOs.
 *
 * The bank authors one template; a corporate's own matrix is a copy of it that the
 * organization then edits. Everything here is ORGANIZATION scope.
 */

export type WorkflowScope = "BANK" | "ORGANIZATION";

export type ApprovalSequence = "PARALLEL" | "SEQUENTIAL";

/**
 * What a user may do in an approval chain, for one action.
 *
 * The bank owns the catalogue (GET /capabilities), so a deployment that runs more ranks than
 * maker-checker adds a row instead of waiting for a release. Never hardcode the codes.
 */
export type Capability = string;

export type ApprovalCapability = {
  code: Capability;
  label: string;
  description: string | null;
  /** Whether holding it can satisfy an approval step. A maker or viewer cannot. */
  approves: boolean;
  systemDefined: boolean;
  active: boolean;
  sortOrder: number;
};

/** Money movement, split by amount; or everything else, one chain at any amount. */
export type ApprovalCategory = "FINANCIAL" | "NON_FINANCIAL";

export type WorkflowFunction = {
  code: string;
  moduleCode: string;
  action: string;
  name: string;
  description: string | null;
  amountable: boolean;
  approvalCategory: ApprovalCategory;
  /** False when the bank switched the action to need no approval; "All" leaves it out. */
  approvalRequired: boolean;
  active: boolean;
  scope: "BANK" | "ORGANIZATION" | "BOTH";
  /**
   * What to ask auth for when looking up who may sign this.
   *
   * The engine names the action (LIMIT:UPDATE); a role is granted verbs on an object
   * (LIMIT:USER). Asking by the engine's name finds nobody.
   */
  approverLookupCode?: string | null;
};

export type RuleCondition = {
  attribute: string;
  operator: string;
  value: string;
};

/**
 * One "N approvals from this set of people" requirement. The set is drawn one of three ways
 * and never two at once: everyone who may approve, one or more approver groups, or the users named.
 */
export type ApproverQuota = {
  capability: Capability | string;
  specificUserIds: string[];
  /** The first group; every group is in `groupKeys`. Kept for rules saved before there could be several. */
  groupKey?: string | null;
  /** Every group drawn on — an "or": anyone in any of them counts. */
  groupKeys?: string[];
  requiredCount: number;
};

/** The groups a requirement draws on, whichever shape it was saved in. */
export const groupKeysOf = (quota: ApproverQuota): string[] =>
  quota.groupKeys?.length ? quota.groupKeys : quota.groupKey ? [quota.groupKey] : [];

export type DrawnFrom = "POOL" | "GROUP" | "NAMED";

export const drawnFrom = (quota: ApproverQuota): DrawnFrom => {
  if (groupKeysOf(quota).length) return "GROUP";
  if (quota.specificUserIds?.length) return "NAMED";
  return "POOL";
};

/** A level is satisfied only when every one of its quotas is met. */
export type RuleChainLevel = {
  level: number;
  sequence: ApprovalSequence;
  quotas: ApproverQuota[];
};

/** One amount slab and the chain it demands. Null ends are open; a slab with neither covers every amount. */
export type RuleSlab = {
  amountFrom: number | null;
  amountTo: number | null;
  chain: RuleChainLevel[];
};

/**
 * The organization's own rule for one action: every amount slab and the chain each needs.
 * `derivedFromMandatory` marks one the bank pinned.
 */
export type OrgWorkflowRule = {
  id: string;
  functionCode: string;
  conditions: RuleCondition[];
  /** The first slab's range and chain; `slabs` holds all of them. */
  amountFrom?: number | null;
  amountTo?: number | null;
  chain: RuleChainLevel[];
  /** Tightest ceiling first. Absent only from a server older than slabs. */
  slabs?: RuleSlab[];
  timeLimitHours: number | null;
  escalation: string | null;
  /** Approvers who may satisfy the rule outright, bypassing the chain. Null = none. */
  overrideAuthority: ApproverQuota | null;
  derivedFromMandatory: boolean;
  templateRuleId: string | null;
  priority: number;
  /** Written by an "All" save, or copied from a bank rule that was; a later "All" may rewrite it. */
  fromAll?: boolean | null;
};

/** An existing rule, saved whole: every slab of the action's policy. */
export type OrgWorkflowRulePayload = {
  functionCode: string;
  conditions: RuleCondition[];
  slabs: RuleSlab[];
  timeLimitHours: number | null;
  escalation: string | null;
  overrideAuthority: ApproverQuota | null;
  derivedFromMandatory: boolean;
  templateRuleId: string | null;
  priority: number;
};

/**
 * One policy for many actions. Each action gets a rule of its own holding every slab; "All" leaves
 * an action's own rule alone, and naming an action replaces what it had.
 */
export type OrgRuleBatchPayload = {
  category: ApprovalCategory;
  allFunctions: boolean;
  functionCodes: string[];
  slabs: RuleSlab[];
  timeLimitHours: number | null;
  escalation: string | null;
  priority: number;
};

/** What a batch did: rules created, rules rewritten, and actions left with their own rule. */
export type OrgRuleBatchResult = {
  created: OrgWorkflowRule[];
  updated: OrgWorkflowRule[];
  kept: string[];
};

/** Someone in the organization who could sign an action, as the engine resolves them. */
export type FunctionApprover = {
  userId: string;
  username: string;
  fullName: string;
  /** Whether a role of theirs lets them approve a request they raised themselves. */
  selfApproval?: boolean;
};

export const CONDITION_OPERATORS = [
  { value: "=", label: "is" },
  { value: "!=", label: "is not" },
  { value: ">", label: "greater than" },
  { value: ">=", label: "at least" },
  { value: "<", label: "less than" },
  { value: "<=", label: "at most" },
  { value: "contains", label: "contains" },
  { value: "in", label: "one of" },
] as const;

/**
 * The attribute an amount-banded rule matches on. Must stay exactly `amount`:
 * workflow-service recognises the amount condition by this literal name, and it is
 * also the key the calling module must put in the request context.
 */
export const AMOUNT_ATTRIBUTE = "amount";

// ---------------------------------------------------------------- people

/**
 * A named set of people a rule can ask for. The bank owns the key; the org owns the members.
 *
 * <p>Shape follows workflow-service's ApproverGroupDto: members are ids, and the names come from
 * whichever user list the screen already has. It used to declare a richer `members` array the
 * server has never returned, so every screen reading it crashed on undefined.
 */
export type ApproverGroup = {
  id: string;
  groupKey: string;
  name: string;
  scope: "BANK" | "ORGANIZATION";
  /** Null for the bank's own groups, which define the keys corporates fill. */
  orgId: string | null;
  active: boolean;
  /** Ids only; the order is the order approvers are asked in. */
  memberIds: string[];
};

export type EligibleApprover = {
  userId: string;
  username: string;
  fullName: string;
  /** Whether the role granting the signature also lets them sign their own request. */
  selfApproval: boolean;
};

export type Entitlement = {
  id: string;
  userId: string;
  organizationId: string;
  function: string;
  accountScope: string | null;
  capability: Capability;
};

export type AssignEntitlementPayload = {
  function: string;
  accountScope?: string | null;
  capability: Capability;
};

export type SaveApproverGroupPayload = {
  groupKey: string;
  name: string;
};

// ---------------------------------------------------------------- runtime

export type InstanceStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "APPROVED"
  | "REJECTED"
  | "ESCALATED"
  | "CANCELLED";

export type TaskStatus = "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED" | "EXPIRED";

export type TaskDecision = "APPROVE" | "REJECT";

export type InstanceSummary = {
  id: string;
  functionCode: string;
  functionName: string;
  moduleCode: string;
  referenceId: string;
  scope: WorkflowScope;
  organizationId: string | null;
  status: InstanceStatus;
  currentLevel: number;
  totalLevels: number;
  /** Capabilities the instance is waiting on right now. */
  awaitingCapabilities: string[];
  initiatedBy: string;
  dueAt: string | null;
  overdue: boolean;
  completedAt: string | null;
  createdAt: string;
};

export type InstanceTask = {
  id: string;
  level: number;
  requiredCapability: string;
  requiredCount: number;
  sequence: ApprovalSequence;
  approverOrder: number;
  quotaIndex: number;
  overrideAuthority: boolean;
  status: TaskStatus;
  assignedTo: string;
  actedBy: string | null;
  actedAt: string | null;
  decision: TaskDecision | null;
  reason: string | null;
};

export type InstanceDetail = Omit<InstanceSummary, "awaitingCapabilities"> & {
  context: Record<string, unknown>;
  tasks: InstanceTask[];
};

export type TaskInboxRow = {
  taskId: string;
  instanceId: string;
  functionCode: string;
  functionName: string;
  referenceId: string;
  scope: WorkflowScope;
  organizationId: string | null;
  level: number;
  requiredCapability: string;
  requiredCount: number;
  sequence: ApprovalSequence;
  overrideAuthority: boolean;
  /** PENDING, at the instance's current level, and the instance is still open. */
  actionable: boolean;
  status: TaskStatus;
  initiatedBy: string;
  dueAt: string | null;
  overdue: boolean;
  createdAt: string;
};
