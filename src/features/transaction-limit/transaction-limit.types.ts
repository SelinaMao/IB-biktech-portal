/** Which tier a set of limit rows belongs to. The corporate side only ever sees these two. */
export type LimitOwnerType = "GLOBAL" | "GROUP" | "CORPORATE" | "USER";

/** Whether a field was set on this tier or still tracks the tier above it. */
/**
 * Where a field's figure comes from. Three states, not two.
 *
 * "No ceiling" used to be written as a zero, which made it indistinguishable from "blocked".
 * INHERITED takes the level above, UNLIMITED imposes no ceiling, OWN sets this figure — and a
 * zero under OWN is a real figure meaning blocked.
 */
export type LimitValueSource = "INHERITED" | "UNLIMITED" | "OWN";

/** What one field is being set to. `value` is required for OWN and ignored otherwise. */
export type LimitFieldSetting = { source: LimitValueSource; value: number | null };

/** A limit row is identified by its catalogue function and method, e.g. TRANSFER:OWN_ACCOUNT + KHQR. */
export type LimitRowIdentity = {
  functionCode: string;
  /** "MANUAL" or "KHQR". */
  method: string;
};

/** One string per row, for React keys, drafts and selection. */
export const limitRowKey = (row: LimitRowIdentity) => `${row.functionCode}|${row.method}`;

export type TransactionLimitRow = LimitRowIdentity & {
  /** The bank's product code, for display only. */
  code: string;
  name: string;
  sequence: number | null;

  maxAmountPerTransaction: number | null;
  srcMaxAmountPerTransaction: LimitValueSource;
  parentMaxAmountPerTransaction: number | null;

  maxAmountPerDay: number | null;
  srcMaxAmountPerDay: LimitValueSource;
  parentMaxAmountPerDay: number | null;

  maxNumberTransactionPerDay: number | null;
  srcMaxNumberTransactionPerDay: LimitValueSource;
  parentMaxNumberTransactionPerDay: number | null;

  minTransactionAmount: number | null;
  minTransactionAmountKhr: number | null;

  /** Absolute ceilings the bank sets per type. Null or 0 means unbounded. */
  hardMaxAmountPerTransaction: number | null;
  hardMaxAmountPerDay: number | null;
  hardMaxNumberTransactionPerDay: number | null;

  validatePerTransactionType: boolean;
};

/** How a company's limits are governed. Read-only here — only the bank changes it. */
export type LimitManagementMode = "BANK_DEFAULT" | "GROUP_MANAGED" | "INDIVIDUAL";

export type OwnerLimits = {
  ownerType: LimitOwnerType;
  ownerId: string | null;
  parentOwnerType: LimitOwnerType | null;
  parentOwnerId: string | null;
  parentLabel: string | null;

  /** Set for the company view only. */
  managementMode: LimitManagementMode | null;
  /** False when the service forbids writing here. The company grid is never editable. */
  editable: boolean;
  readOnlyReason: string | null;

  rows: TransactionLimitRow[];
};

/** One row of the bulk save. A value that differs from the stored one becomes that user's own. */
export type UpdateLimitRow = LimitRowIdentity & {
  /** A field left null is not being changed, which is different from being cleared. */
  maxAmountPerTransaction: LimitFieldSetting | null;
  maxAmountPerDay: LimitFieldSetting | null;
  maxNumberTransactionPerDay: LimitFieldSetting | null;
};

export type LimitField =
  | "maxAmountPerTransaction"
  | "maxAmountPerDay"
  | "maxNumberTransactionPerDay";
