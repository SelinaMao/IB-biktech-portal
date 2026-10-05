"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Fragment, useMemo, useState } from "react";

import BaseSelect from "@core/form/BaseSelect";

import { useDragReorder } from "../useDragReorder";
import { useListFunctionApproversQuery } from "../workflow.api";
import {
  drawnFrom,
  groupKeysOf,
  type ApprovalSequence,
  type ApproverGroup,
  type ApproverQuota,
  type DrawnFrom,
  type FunctionApprover,
} from "../workflow.types";

type Props = {
  index: number;
  quota: ApproverQuota;
  /** What the rule covers. With several actions, only people who can approve all of them are offered. */
  functionCodes: string[];
  /** The level's sequence. In order, the people named are asked one at a time, 1 first. */
  sequence: ApprovalSequence;
  groups: ApproverGroup[];
  canRemove: boolean;
  onChange: (changes: Partial<ApproverQuota>) => void;
  onRemove: () => void;
};

const nameOf = (person: FunctionApprover) => person.fullName || person.username;

const groupLabel = (group: ApproverGroup) =>
  group.memberIds.length ? `${group.name} (${group.memberIds.length})` : `${group.name} — empty`;

/** "Sokha Chan" → "SC", "dara.kim" → "DK". */
const initialsOf = (name: string) =>
  name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const plural = (n: number, word: string, words: string) => (n === 1 ? word : words);

/** A row of people that wraps, and scrolls once there are more approvers than fit. */
const chipRow = { display: "flex", flexWrap: "wrap", gap: 1, maxHeight: 160, overflowY: "auto" } as const;

const avatar = { width: 24, height: 24, fontSize: 10, fontWeight: 600 } as const;

/** "− 2 +": how many approvals are needed. The number can be typed too; it never goes below 1. */
function CountStepper({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const step = { borderRadius: 0, width: 36, color: "text.secondary" } as const;
  return (
    <Stack
      direction="row"
      sx={{
        height: 36,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        overflow: "hidden",
        "&:focus-within": { borderColor: "primary.main" },
      }}
    >
      <IconButton
        size="small"
        aria-label="One approval fewer"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        sx={step}
      >
        <RemoveRoundedIcon fontSize="small" />
      </IconButton>
      <InputBase
        type="number"
        value={String(value)}
        onChange={(event) => onChange(Math.max(1, Number(event.target.value || 1)))}
        inputProps={{ min: 1, inputMode: "numeric", "aria-label": "Approvals needed" }}
        sx={{
          width: 44,
          borderLeft: 1,
          borderRight: 1,
          borderColor: "divider",
          fontSize: 14,
          fontWeight: 600,
          "& input": { textAlign: "center", p: 0, MozAppearance: "textfield" },
          "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
            WebkitAppearance: "none",
            m: 0,
          },
        }}
      />
      <IconButton size="small" aria-label="One approval more" onClick={() => onChange(value + 1)} sx={step}>
        <AddRoundedIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

function Hint({ icon, children }: { icon?: boolean; children: React.ReactNode }) {
  return (
    <Stack direction="row" alignItems="center" sx={{ gap: 0.75 }}>
      {icon && <PeopleOutlineRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
      <Typography variant="caption" color="text.secondary">
        {children}
      </Typography>
    </Stack>
  );
}

/**
 * One "N approvals from …" requirement, written as the sentence it stands for.
 *
 * <p>Where the people come from is the thing an organization actually argues about, so it is the
 * one choice on the line; the card shows the people instead of asking for a capability, since
 * approving is granted by role. The saved quota is only a hint about the last choice — "specific
 * people, none chosen yet" and "anyone who may approve" are the same data — so the choice lives in
 * state and the quota only seeds it, or follows one replaced from outside.
 */
export default function RequirementCard({
  index,
  quota,
  functionCodes,
  sequence,
  groups,
  canRemove,
  onChange,
  onRemove,
}: Props) {
  const stated = drawnFrom(quota);
  const [mode, setModeState] = useState<DrawnFrom>(stated);
  const [seen, setSeen] = useState<DrawnFrom>(stated);

  // Adjust during render rather than in an effect: follow the quota only when something outside
  // replaced it with a definite choice — a preset, or reopening a saved rule.
  if (stated !== seen) {
    setSeen(stated);
    if (stated !== "POOL") setModeState(stated);
  }

  const inOrder = sequence === "SEQUENTIAL";
  const several = functionCodes.length > 1;
  const chosen = groupKeysOf(quota);

  // Asked of the engine, which resolves people the way it will when a request is raised — and,
  // across several actions, only the people who can sign every one of them.
  const lookup = useListFunctionApproversQuery(
    { functionCodes, groupKeys: mode === "GROUP" ? chosen : [] },
    { skip: functionCodes.length === 0 },
  );

  // Everyone who may sign, whatever the groups: what a group that reaches nobody falls back to.
  const pool = useListFunctionApproversQuery(
    { functionCodes, groupKeys: [] },
    { skip: functionCodes.length !== 1 || mode !== "GROUP" },
  );

  const people = useMemo(
    () => [...(lookup.data ?? [])].sort((a, b) => nameOf(a).localeCompare(nameOf(b))),
    [lookup.data],
  );
  const byId = useMemo(() => new Map(people.map((person) => [person.userId, person])), [people]);
  const loaded = !lookup.isFetching && !lookup.isError && lookup.data !== undefined;

  const picked = quota.specificUserIds ?? [];
  const others = people.filter((person) => !picked.includes(person.userId));
  const labelOf = (userId: string) => {
    const person = byId.get(userId);
    return person ? nameOf(person) : userId;
  };

  const setMode = (next: DrawnFrom) => {
    setModeState(next);
    const first = next === "GROUP" ? groups[0]?.groupKey : undefined;
    onChange({
      groupKey: next === "GROUP" ? (first ?? "") : null,
      groupKeys: first ? [first] : [],
      specificUserIds: next === "NAMED" ? picked : [],
    });
  };

  /** Several groups are an "or": anyone in any of them counts. */
  const setGroups = (keys: string[]) => onChange({ groupKey: keys[0] ?? "", groupKeys: keys });

  /** Anyone, or a group, has no order of its own; this fixes the people listed now as 1, 2, 3… */
  const setOrderFromList = () => {
    setModeState("NAMED");
    onChange({ groupKey: null, groupKeys: [], specificUserIds: people.map((person) => person.userId) });
  };

  const pick = (userId: string) => onChange({ specificUserIds: [...picked, userId] });
  const unpick = (userId: string) => onChange({ specificUserIds: picked.filter((id) => id !== userId) });
  const moveTo = (from: number, to: number) => {
    const next = [...picked];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange({ specificUserIds: next });
  };
  const reorder = useDragReorder(moveTo);

  // Only a list that belongs to one action describes who "anyone" or a group will reach; across
  // several actions each copy of the rule reaches its own action's people.
  const showsPool = mode !== "NAMED" && !several;
  const nobody = loaded && people.length === 0;
  const tooMany = quota.requiredCount > people.length;

  const chosenGroups = chosen.map((key) => ({ key, group: groups.find((g) => g.groupKey === key) }));
  const remainingGroups = groups.filter((g) => !chosen.includes(g.groupKey));
  const groupNames = chosenGroups.map(({ key, group }) => group?.name ?? key).join(" or ");
  const signers = useMemo(() => new Set((pool.data ?? []).map((person) => person.userId)), [pool.data]);

  /**
   * Groups that reach nobody, and so count everyone who may sign — on purpose, so an emptied group
   * never stops approvals, but it must not happen unseen. Whether anyone in a group may sign this
   * action is only known for one action at a time.
   */
  const fallbacks =
    mode !== "GROUP"
      ? []
      : chosenGroups.flatMap(({ key, group }) => {
          if (!group) return [`${key} no longer exists, so anyone who can approve counts.`];
          if (group.memberIds.length === 0) return [`${group.name} has nobody in it yet, so anyone who can approve counts.`];
          if (!several && pool.data && !group.memberIds.some((id) => signers.has(id))) {
            return [`Nobody in ${group.name} can approve this action, so anyone who can approve counts.`];
          }
          return [];
        });
  const fellBack = fallbacks.length > 0;

  /** "Any 1 of these 4 approvers can approve" — the pool, and what the count asks of it. */
  const poolHeading = (() => {
    const n = people.length;
    const inGroups = mode === "GROUP" && !fellBack;
    const noun = !inGroups
      ? plural(n, "approver", "approvers")
      : chosen.length > 1
        ? plural(n, "person", "people")
        : plural(n, "group member", "group members");
    const where = inGroups && chosen.length > 1 ? ` in ${groupNames}` : "";
    if (inOrder || tooMany) return `${n} ${noun}${where} can approve this`;
    if (n === 1) return `Only this ${noun}${where} can approve`;
    return `Any ${quota.requiredCount} of these ${n} ${noun}${where} can approve`;
  })();

  /**
   * Whoever raises a request cannot approve it. When a line has exactly as many people as it needs,
   * a request one of them raises cannot be staffed, and it is refused when raised.
   */
  const lineCandidates =
    mode === "NAMED"
      ? picked.map((id) => byId.get(id)).filter((person): person is FunctionApprover => person !== undefined)
      : showsPool
        ? people
        : [];
  const soleCaution =
    loaded &&
    lineCandidates.length > 0 &&
    lineCandidates.length === quota.requiredCount &&
    !lineCandidates.every((person) => person.selfApproval)
      ? lineCandidates.length === 1
        ? `Only ${nameOf(lineCandidates[0])} can approve this line, so a request ${nameOf(lineCandidates[0])} raises will be refused.`
        : `All ${lineCandidates.length} people who can approve this line are needed, so a request any of them raises will be refused.`
      : null;

  return (
    <Box sx={{ width: "100%", bgcolor: "action.hover", borderRadius: 1, p: 2.5 }}>
      {/* The requirement as a sentence: "Needs 2 approvals from any approver", then "And 1 …". */}
      <Stack direction="row" alignItems="center" sx={{ gap: 1.5, flexWrap: "wrap" }}>
        <Typography variant="body2">{index === 0 ? "Needs" : "And"}</Typography>
        <CountStepper value={quota.requiredCount} onChange={(requiredCount) => onChange({ requiredCount })} />
        <Typography variant="body2">{plural(quota.requiredCount, "approval", "approvals")} from</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_event, next: DrawnFrom | null) => next && setMode(next)}
          sx={{ bgcolor: "background.paper" }}
        >
          <ToggleButton value="POOL">Any approver</ToggleButton>
          <ToggleButton value="GROUP">Approver group</ToggleButton>
          <ToggleButton value="NAMED">Specific people</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ flex: 1 }} />
        {canRemove && (
          <IconButton size="small" aria-label="Remove this requirement" onClick={onRemove}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <Stack spacing={2} sx={{ mt: 2.5 }}>
        {mode === "GROUP" &&
          (groups.length === 0 ? (
            <Alert severity="warning" variant="outlined">
              No approver groups exist yet. Create one under Approver groups, or choose Any approver.
            </Alert>
          ) : (
            // Several groups are an "or": anyone in any of them counts.
            <Stack direction="row" alignItems="center" sx={{ gap: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                {chosen.length > 1 ? "Groups" : "Group"}
              </Typography>
              {chosenGroups.map(({ key, group }, position) => (
                <Fragment key={key}>
                  {position > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                      or
                    </Typography>
                  )}
                  <Chip
                    variant="outlined"
                    label={group ? groupLabel(group) : key}
                    onDelete={chosen.length > 1 ? () => setGroups(chosen.filter((k) => k !== key)) : undefined}
                    sx={{ bgcolor: "background.paper" }}
                  />
                </Fragment>
              ))}
              {remainingGroups.length > 0 && (
                <Box sx={{ width: 240, maxWidth: "100%", bgcolor: "background.paper" }}>
                  <BaseSelect
                    size="small"
                    value=""
                    placeholder={chosen.length ? "Or another group…" : "Choose a group"}
                    options={remainingGroups.map((group) => ({ value: group.groupKey, label: groupLabel(group) }))}
                    onChange={(event) => setGroups([...chosen, String(event.target.value)])}
                    slotProps={{ htmlInput: { "aria-label": "Add a group" } }}
                  />
                </Box>
              )}
            </Stack>
          ))}

        {fallbacks.length > 0 && (
          <Alert severity="warning" variant="outlined">
            {fallbacks.map((line) => (
              <Typography key={line} variant="body2">
                {line}
              </Typography>
            ))}
          </Alert>
        )}

        {functionCodes.length === 0 ? (
          <Hint icon>Pick what is being approved first. The people who can approve it show here.</Hint>
        ) : lookup.isError ? (
          <Alert severity="error" variant="outlined">
            Couldn&apos;t load who can approve this. The list is empty because the lookup failed, not
            because nobody qualifies.
          </Alert>
        ) : lookup.isFetching && !lookup.data ? (
          <Hint icon>Looking up who can approve…</Hint>
        ) : (
          <>
            {/* A blank list is indistinguishable from a broken one, so say which it is and how to fix it. */}
            {nobody && (mode === "NAMED" || !several) && (
              <Alert severity="warning" variant="outlined">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Nobody can approve {several ? `all ${functionCodes.length} of these actions` : "this action"} yet
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                  Mark a role as an approver under <strong>Roles</strong>, and anyone holding it can
                  approve here. Do it for at least two people, since whoever raises a request cannot
                  approve it.
                </Typography>
              </Alert>
            )}

            {showsPool && people.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  {poolHeading}
                </Typography>
                <Box sx={chipRow}>
                  {people.map((person) => (
                    <Chip
                      key={person.userId}
                      variant="outlined"
                      title={person.username}
                      label={nameOf(person)}
                      avatar={<Avatar sx={{ ...avatar, bgcolor: "primary.light" }}>{initialsOf(nameOf(person))}</Avatar>}
                      sx={{ bgcolor: "background.paper" }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {mode !== "NAMED" && several && (
              <Hint icon>
                Who can approve differs per action, so each of the {functionCodes.length} is checked
                when you save.
              </Hint>
            )}

            {mode !== "NAMED" && inOrder && people.length > 0 && (
              <Stack
                direction="row"
                alignItems="center"
                sx={{
                  gap: 1.5,
                  flexWrap: "wrap",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  px: 2,
                  py: 1.5,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 240 }}>
                  In order asks one person at a time, but {mode === "GROUP" ? "a group" : "any approver"}{" "}
                  has no set order. Set one to choose who goes first.
                </Typography>
                <Button size="small" variant="outlined" onClick={setOrderFromList}>
                  Set the order
                </Button>
              </Stack>
            )}

            {mode === "NAMED" && inOrder && (people.length > 0 || picked.length > 0) && (
              <Stack spacing={1.5}>
                {picked.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                      Asked in this order{picked.length > 1 && " — drag a row to change it"}
                    </Typography>
                    <Box
                      data-reorder-list
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        overflow: "hidden",
                        userSelect: reorder.dragging ? "none" : undefined,
                      }}
                    >
                      {picked.map((userId, position) => (
                        <Stack
                          key={userId}
                          data-reorder-row
                          direction="row"
                          alignItems="center"
                          style={reorder.rowStyle(position)}
                          sx={{
                            gap: 1.5,
                            pl: 1,
                            pr: 2,
                            py: 1,
                            bgcolor: "background.paper",
                            borderBottom: position < picked.length - 1 ? 1 : 0,
                            borderColor: "divider",
                          }}
                        >
                          {/* Drag to move; with the handle focused, the arrow keys move it one place. */}
                          <IconButton
                            size="small"
                            aria-label={`Reorder ${labelOf(userId)}: drag, or use the arrow keys`}
                            disabled={picked.length < 2}
                            {...reorder.handleProps(position, picked.length)}
                            sx={{ touchAction: "none", cursor: reorder.dragging ? "grabbing" : "grab" }}
                          >
                            <DragIndicatorRoundedIcon fontSize="small" />
                          </IconButton>
                          <Avatar sx={{ ...avatar, fontSize: 12, bgcolor: "primary.main", color: "primary.contrastText" }}>
                            {reorder.placeOf(position) + 1}
                          </Avatar>
                          <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                            {labelOf(userId)}
                          </Typography>
                          {loaded && !byId.has(userId) && (
                            <Typography variant="caption" color="error">
                              cannot approve this
                            </Typography>
                          )}
                          <IconButton size="small" aria-label={`Remove ${labelOf(userId)}`} onClick={() => unpick(userId)}>
                            <CloseRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                    </Box>
                  </Box>
                )}
                {others.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                      {picked.length ? "Add someone after them" : "Pick people in the order they should be asked"}
                    </Typography>
                    <Box sx={chipRow}>
                      {others.map((person) => (
                        <Chip
                          key={person.userId}
                          variant="outlined"
                          title={person.username}
                          icon={<AddRoundedIcon />}
                          label={nameOf(person)}
                          onClick={() => pick(person.userId)}
                          sx={{ bgcolor: "background.paper", borderStyle: "dashed" }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Stack>
            )}

            {mode === "NAMED" && !inOrder && (people.length > 0 || picked.length > 0) && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Pick who can approve
                </Typography>
                <Box sx={chipRow}>
                  {/* Someone picked earlier who can no longer approve stays visible so they can be removed. */}
                  {[...picked.filter((id) => loaded && !byId.has(id)), ...people.map((p) => p.userId)].map(
                    (userId) => {
                      const on = picked.includes(userId);
                      const stale = loaded && !byId.has(userId);
                      return (
                        <Chip
                          key={userId}
                          aria-pressed={on}
                          title={byId.get(userId)?.username}
                          color={stale ? "error" : on ? "primary" : "default"}
                          variant={on ? "filled" : "outlined"}
                          label={stale ? `${labelOf(userId)} · cannot approve this` : labelOf(userId)}
                          avatar={
                            <Avatar sx={avatar}>{on ? <CheckRoundedIcon sx={{ fontSize: 14 }} /> : initialsOf(labelOf(userId))}</Avatar>
                          }
                          onClick={() => (on ? unpick(userId) : pick(userId))}
                          sx={on ? undefined : { bgcolor: "background.paper" }}
                        />
                      );
                    },
                  )}
                </Box>
              </Box>
            )}

            {mode === "NAMED" ? (
              picked.length === 0 ? (
                <Hint>Nobody picked yet — until you pick, anyone who can approve this counts.</Hint>
              ) : quota.requiredCount > picked.length ? (
                <Alert severity="error" variant="outlined">
                  {quota.requiredCount} approvals are needed but only {picked.length}{" "}
                  {plural(picked.length, "person is", "people are")} picked.
                </Alert>
              ) : (
                <Hint>
                  {inOrder
                    ? `Asked one at a time, 1 first, until ${quota.requiredCount} ${plural(quota.requiredCount, "approves", "approve")}.`
                    : `Any ${quota.requiredCount} of the ${picked.length} picked can approve.`}
                </Hint>
              )
            ) : (
              showsPool &&
              loaded &&
              people.length > 0 &&
              tooMany && (
                <Alert severity="error" variant="outlined">
                  Only {people.length} {plural(people.length, "person", "people")} can approve this —
                  asking for {quota.requiredCount} can never be met.
                </Alert>
              )
            )}

            {soleCaution && (
              <Alert severity="info" variant="outlined">
                {soleCaution}
              </Alert>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
