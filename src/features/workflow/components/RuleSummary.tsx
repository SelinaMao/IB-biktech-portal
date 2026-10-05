"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { describeChain, rangeWords } from "../rule-words";
import type { RuleChainLevel, RuleSlab } from "../workflow.types";

type Props = {
  /** What is being approved: one action's name, or a phrase such as "all 11 financial actions". */
  functionName?: string;
  /** The first slab's range. Null ends are open. */
  amountFrom?: number | null;
  amountTo?: number | null;
  chain: RuleChainLevel[];
  /** A rule split by amount: one entry per slab, smallest amounts first. Replaces the single range and chain. */
  slabs?: RuleSlab[];
  groupNameByKey: Map<string, string>;
};

const frame = {
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  bgcolor: "action.hover",
  px: 2,
  py: 1.5,
} as const;

const caption = { color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.6 } as const;

/** "any amount", "amounts up to 10,000 USD", "amounts of 10,000 USD and above" — a range inside a sentence. */
const when = (from: number | null | undefined, to: number | null | undefined) => {
  const words = rangeWords(from, to);
  if (words === "Any amount") return "any amount";
  return words.startsWith("Up to") ? `amounts up to${words.slice("Up to".length)}` : `amounts of ${words}`;
};

/** The whole rule as one sentence, so it can be checked without reading the form back. */
export default function RuleSummary({ functionName, amountFrom, amountTo, chain, slabs, groupNameByKey }: Props) {
  const requirement = (levels: RuleChainLevel[]) =>
    levels.length === 0 ? (
      "nobody has to approve."
    ) : (
      <>
        require <strong>{describeChain(levels, groupNameByKey)}</strong>.
      </>
    );

  // Several slabs read as a list, one line each, rather than a sentence that only tells of the first.
  if (slabs && slabs.length > 1) {
    return (
      <Box sx={frame}>
        <Typography variant="caption" sx={caption}>
          This rule says
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.25 }}>
          {functionName ? (
            <>
              For <strong>{functionName}</strong>:
            </>
          ) : (
            "Depending on the amount:"
          )}
        </Typography>
        <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
          {slabs.map((slab, index) => (
            <Typography key={index} component="li" variant="body2">
              On {when(slab.amountFrom, slab.amountTo)}, {requirement(slab.chain)}
            </Typography>
          ))}
        </Box>
      </Box>
    );
  }

  // Alone, a rule with no range covers every request, amount or not.
  const on = amountFrom || amountTo != null ? when(amountFrom, amountTo) : "every request";

  return (
    <Box sx={frame}>
      <Typography variant="caption" sx={caption}>
        This rule says
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        {functionName ? (
          <>
            For <strong>{functionName}</strong>, on {on},{" "}
          </>
        ) : (
          <>On {on}, </>
        )}
        {requirement(chain)}
      </Typography>
    </Box>
  );
}
