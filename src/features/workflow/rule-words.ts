/**
 * Rules read back as words — the same phrases on the rule table, the form's summary and its slab
 * headings, so a rule never reads one way in one place and another way elsewhere.
 */

import { groupKeysOf, type RuleChainLevel } from "./workflow.types";

export const money = (value: number | string) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString() : String(value);
};

/** "Up to 10,000 USD", "10,000 – 50,000 USD", "50,000 USD and above" — a range in words. Zero and null are open. */
export const rangeWords = (from: number | null | undefined, to: number | null | undefined) => {
  if (to == null || to === Number.POSITIVE_INFINITY) return from ? `${money(from)} USD and above` : "Any amount";
  return from ? `${money(from)} – ${money(to)} USD` : `Up to ${money(to)} USD`;
};

/** "2 of any approver" / "1 from Finance or Operations" / "2 of 3 named people (in order)" — how a level reads out loud. */
export function describeLevel(level: RuleChainLevel, groupNameByKey: Map<string, string>): string {
  const quotas = level.quotas.map((quota) => {
    const named = quota.specificUserIds?.length ?? 0;
    const groups = groupKeysOf(quota);
    const who = named
      ? `of ${named} named ${named === 1 ? "person" : "people"}`
      : groups.length
        ? `from ${groups.map((key) => groupNameByKey.get(key) ?? key).join(" or ")}`
        : "of any approver";
    return `${quota.requiredCount} ${who}`;
  });
  const joined = quotas.join(" and ");
  return level.sequence === "SEQUENTIAL" ? `${joined} (in order)` : joined;
}

/** Every level of a chain, level 1 first: "1 of any approver, then 1 from Directors". */
export const describeChain = (chain: RuleChainLevel[], groupNameByKey: Map<string, string>) =>
  chain.map((level, index) => `${index === 0 ? "" : "then "}${describeLevel(level, groupNameByKey)}`).join(", ");
