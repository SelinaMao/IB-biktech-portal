"use client";

import { Check, Minus } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import {
  useBusinessFunctionsQuery,
  usePermissionTreeQuery,
  useRoleGridQuery,
} from "../rbac.api";
import { SHARED_CHANNEL } from "../rbac.types";

export type PermissionChecklistProps = {
  value: string[];
  onChange: (next: string[]) => void;
  roleId?: string;
  channel?: string;
  disabled?: boolean;
};

/** Module -> the category heading its permissions sit under. */
const CATEGORY_LABELS: Record<string, string> = {
  TRANSFER: "Transfers",
  USER: "User Management",
  ORGANIZATION: "Company",
  WORKFLOW: "Approvals",
  LIMIT: "Limits",
  ROLE: "Roles & Access",
  APPROVER_GROUP: "Approver Groups",
  PARAMETER: "Setting",
  SIGNUP: "Sign-ups",
  FEE: "Fees",
  PRODUCT: "Products",
  NOTIFICATION: "Notifications",
  AUDIT: "Audit",
  ACCOUNT: "Accounts",
  PAYMENT: "Payments",
  DASHBOARD: "Dashboard",
  LOAN: "Loans",
  STATEMENT: "Statement",
  TRANSACTION: "Transaction",
  CHEQUE: "Cheque",
  MERCHANT: "Merchant",
  SCHEDULE: "Schedule",
  PAYROLL: "Payroll",
};

const VERB_LABELS: Record<string, string> = {
  VIEW: "View",
  INITIATE: "Initiate",
  CREATE: "Create",
  EDIT: "Edit",
  DISABLE: "Disable",
  DELETE: "Delete",
  CANCEL: "Cancel",
  APPROVE: "Approve",
};
const VERB_ORDER = ["VIEW", "INITIATE", "CREATE", "EDIT", "DISABLE", "DELETE", "CANCEL", "APPROVE"];

const prettify = (segment: string) =>
  segment
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

type Item = { code: string; title: string; object: string; order: number };
type Category = { key: string; label: string; items: Item[] };

type TickState = "all" | "some" | "none";

function stateOf(codes: string[], selected: Set<string>): TickState {
  const on = codes.filter((code) => selected.has(code)).length;
  if (on === 0) return "none";
  return on === codes.length ? "all" : "some";
}

/** A square tick in the design's navy: ticked, part-ticked (a bar) or empty. */
function TickBox({
  state,
  disabled,
  label,
  onToggle,
}: {
  state: TickState;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === "all" ? true : state === "some" ? "mixed" : false}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`grid size-5 shrink-0 place-items-center rounded-[5px] border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2f2b7a]/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
        state === "none"
          ? "border-[#dfdfde] bg-white hover:border-[#b0b0af]"
          : "border-[#2f2b7a] bg-[#2f2b7a] text-white"
      }`}
    >
      {state === "all" && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
      {state === "some" && <Minus className="size-3.5" strokeWidth={3} aria-hidden />}
    </button>
  );
}

function TickRow({
  label,
  state,
  disabled,
  onToggle,
  labelClassName,
}: {
  label: string;
  state: TickState;
  disabled?: boolean;
  onToggle: () => void;
  labelClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <TickBox state={state} disabled={disabled} label={label} onToggle={onToggle} />
      <span
        aria-hidden
        onClick={disabled ? undefined : onToggle}
        className={`cursor-pointer text-sm select-none ${labelClassName ?? ""}`}
      >
        {label}
      </span>
    </span>
  );
}

/**
 * The permission catalogue as a checklist, matching the customer role design:
 * one category per module, each with a tick that sets or clears everything under it,
 * and an "All Permissions" tick above them all.
 *
 * Uses real corporate data from useBusinessFunctionsQuery (scoped to this organization's
 * permission ceiling) and useRoleGridQuery when editing an existing role.
 */
export default function PermissionChecklist({
  value,
  onChange,
  roleId,
  channel = "CORPORATE",
  disabled = false,
}: PermissionChecklistProps) {
  const { data: catalogue, isLoading: isCatalogueLoading } = useBusinessFunctionsQuery();
  const { data: grid, isLoading: isGridLoading } = useRoleGridQuery(roleId ?? "", {
    skip: !roleId,
  });
  const { data: tree, isLoading: isTreeLoading, isError: isTreeError } = usePermissionTreeQuery();

  const isLoading = (isCatalogueLoading || (Boolean(roleId) && isGridLoading)) && isTreeLoading;
  const selected = useMemo(() => new Set(value), [value]);

  const initialSeeded = useRef(false);
  useEffect(() => {
    if (initialSeeded.current) return;
    if (roleId && grid?.functions && value.length === 0) {
      const grantedCodes = grid.functions
        .flatMap((f) => f.verbs ?? [])
        .filter((v) => v.granted && v.permissionCode)
        .map((v) => v.permissionCode as string);
      if (grantedCodes.length > 0) {
        initialSeeded.current = true;
        onChange(grantedCodes);
      }
    }
  }, [roleId, grid, value.length, onChange]);

  const categories = useMemo<Category[]>(() => {
    const byModule = new Map<string, Map<string, Item>>();

    // 1. Role-specific grid if editing an existing role
    if (grid?.functions && grid.functions.length > 0) {
      for (const fn of grid.functions) {
        const moduleCode = fn.moduleCode || fn.code.split(":")[0] || "GENERAL";
        const items = byModule.get(moduleCode) ?? new Map<string, Item>();
        byModule.set(moduleCode, items);
        for (const v of fn.verbs ?? []) {
          if (!v.permissionCode) continue;
          const verbIndex = VERB_ORDER.indexOf(v.verb);
          items.set(v.permissionCode, {
            code: v.permissionCode,
            title: `${VERB_LABELS[v.verb] ?? prettify(v.verb)} ${fn.name}`,
            object: fn.name,
            order: verbIndex === -1 ? VERB_ORDER.length : verbIndex,
          });
        }
      }
    }

    // 2. Real business functions catalogue for the organization
    if (byModule.size === 0 && Array.isArray(catalogue) && catalogue.length > 0) {
      for (const fn of catalogue) {
        if (!fn.active) continue;
        const targetChannel = channel?.toUpperCase();
        const fnChannel = fn.channel?.toUpperCase();
        if (
          targetChannel &&
          fnChannel &&
          fnChannel !== targetChannel &&
          fnChannel !== SHARED_CHANNEL &&
          fnChannel !== "BOTH"
        ) {
          continue;
        }
        const moduleCode = fn.moduleCode || fn.code.split(":")[0] || "GENERAL";
        const items = byModule.get(moduleCode) ?? new Map<string, Item>();
        byModule.set(moduleCode, items);
        for (const v of fn.verbs ?? []) {
          if (!v.permissionCode) continue;
          const verbIndex = VERB_ORDER.indexOf(v.verb);
          items.set(v.permissionCode, {
            code: v.permissionCode,
            title: `${VERB_LABELS[v.verb] ?? prettify(v.verb)} ${fn.name}`,
            object: fn.name,
            order: verbIndex === -1 ? VERB_ORDER.length : verbIndex,
          });
        }
      }
    }

    // 3. Fallback to permission tree if catalogue is empty
    if (byModule.size === 0 && tree?.channels && tree.channels.length > 0) {
      for (const entry of tree.channels) {
        const entryCh = entry.channel?.toUpperCase();
        const targetCh = channel?.toUpperCase();
        if (targetCh && entryCh && entryCh !== targetCh && entryCh !== SHARED_CHANNEL && entryCh !== "BOTH") continue;
        for (const group of entry.modules ?? []) {
          for (const permission of group.permissions ?? []) {
            const parts = permission.code.split(":");
            const moduleCode = parts[0] || group.module || "GENERAL";
            const verb = parts.length === 3 ? parts[2] : "";
            const object = parts.length === 3 ? parts[1] : parts.slice(1).join(" ");
            const items = byModule.get(moduleCode) ?? new Map<string, Item>();
            byModule.set(moduleCode, items);
            const verbIndex = VERB_ORDER.indexOf(verb);
            const described = permission.description?.trim();
            items.set(permission.code, {
              code: permission.code,
              title: described
                ? described.charAt(0).toUpperCase() + described.slice(1)
                : [VERB_LABELS[verb] ?? prettify(verb), prettify(object)].filter(Boolean).join(" "),
              object,
              order: verbIndex === -1 ? VERB_ORDER.length : verbIndex,
            });
          }
        }
      }
    }

    return [...byModule.entries()]
      .map(([key, items]) => ({
        key,
        label: CATEGORY_LABELS[key] ?? prettify(key),
        items: [...items.values()].sort((a, b) => a.object.localeCompare(b.object) || a.order - b.order),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [grid, catalogue, tree, channel]);

  const allCodes = useMemo(
    () => categories.flatMap((category) => category.items.map((item) => item.code)),
    [categories],
  );
  const allState = stateOf(allCodes, selected);

  const setCodes = (codes: string[], on: boolean) => {
    const next = new Set(value);
    for (const code of codes) {
      if (on) next.add(code);
      else next.delete(code);
    }
    onChange([...next]);
  };

  if (isLoading) {
    return <div className="h-80 w-full rounded-xl bg-slate-100 animate-pulse" />;
  }

  if (isTreeError && categories.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        The permission catalogue could not be loaded.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#363635]">Control</p>
        <TickRow
          label="All Permissions"
          state={allState}
          disabled={disabled || allCodes.length === 0}
          onToggle={() => setCodes(allCodes, allState !== "all")}
          labelClassName="text-[#2f2b7a] font-medium"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#ededec]">
        <div className="bg-[#f7f7f7] px-6 py-3.5 text-sm font-medium text-[#676766]">
          Module Category
        </div>
        <ul className="m-0 p-0 list-none">
          {categories.map((category) => {
            const codes = category.items.map((item) => item.code);
            const state = stateOf(codes, selected);
            return (
              <li key={category.key} className="m-0 p-0 list-none">
                <div className="flex items-center justify-between gap-4 border-t border-[#ededec] bg-[#eef2ff]/60 px-6 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#363635]">{category.label}</p>
                    <p className="mt-0.5 text-xs text-[#676766]">
                      {codes.filter((code) => selected.has(code)).length} of {codes.length} permissions
                    </p>
                  </div>
                  <TickBox
                    state={state}
                    disabled={disabled}
                    label={`All ${category.label} permissions`}
                    onToggle={() => setCodes(codes, state !== "all")}
                  />
                </div>
                <ul className="m-0 p-0 list-none">
                  {category.items.map((item) => (
                    <li
                      key={item.code}
                      onClick={() => {
                        if (!disabled) {
                          setCodes([item.code], !selected.has(item.code));
                        }
                      }}
                      className="flex items-center justify-between gap-4 border-t border-[#ededec] bg-white px-6 py-3 hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-normal text-[#363635]">{item.title}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#898987]">{item.code}</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <TickBox
                          state={selected.has(item.code) ? "all" : "none"}
                          disabled={disabled}
                          label={item.title}
                          onToggle={() => setCodes([item.code], !selected.has(item.code))}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
