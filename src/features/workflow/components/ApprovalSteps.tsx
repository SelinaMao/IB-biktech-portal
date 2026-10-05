"use client";

import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";

import type { InstanceDetail, InstanceTask, TaskStatus } from "../workflow.types";

type Props = {
  instance: InstanceDetail;
  /** userId → display name, so a step can say who rather than show a uuid. */
  nameByUserId: Map<string, string>;
};

const STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  APPROVED: <CheckCircleRoundedIcon sx={{ fontSize: 16 }} color="success" />,
  REJECTED: <CancelRoundedIcon sx={{ fontSize: 16 }} color="error" />,
  PENDING: <ScheduleRoundedIcon sx={{ fontSize: 16 }} color="disabled" />,
  SKIPPED: <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 16 }} color="disabled" />,
  EXPIRED: <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 16 }} color="warning" />,
};

const SKIPPED_REASON = "quorum was met without them";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/**
 * The chain as a journey: one step per level, in the order they are reached.
 *
 * <p>A level has one task row per entitled person, not per quota — "2 of our 3 checkers" is three
 * rows — so the count beside the step is the quorum and the rows are who can satisfy it.
 *
 * <p>Every step stays expanded rather than only the current one. This is a record of who did what,
 * and a signature already given is as much a part of it as the one still owed.
 */
export default function ApprovalSteps({ instance, nameByUserId }: Props) {
  const levels = useMemo(() => {
    const byLevel = new Map<number, InstanceTask[]>();
    for (const task of instance.tasks) {
      const key = task.overrideAuthority ? 0 : task.level;
      byLevel.set(key, [...(byLevel.get(key) ?? []), task]);
    }
    return [...byLevel.entries()]
      .sort(([a], [b]) => a - b)
      .map(([level, tasks]) => ({
        level,
        isOverride: level === 0,
        tasks: tasks.slice().sort((a, b) => a.approverOrder - b.approverOrder),
      }));
  }, [instance.tasks]);

  const isOpen = instance.status === "PENDING" || instance.status === "IN_PROGRESS";
  const activeIndex = levels.findIndex(
    ({ level, isOverride }) => !isOverride && level === instance.currentLevel,
  );

  return (
    <Stepper
      orientation="vertical"
      activeStep={activeIndex}
      nonLinear
      sx={{
        "& .MuiStepConnector-line": { minHeight: 10 },
        "& .MuiStepContent-root": { pb: 1.5 },
      }}
    >
      {levels.map(({ level, isOverride, tasks }) => {
        // Grouped by quotaIndex: a level asking "1 CHECKER and 1 ADMIN" is two requirements,
        // and reading the count off the first task alone would hide the second.
        const requirements = [
          ...tasks
            .reduce((map, task) => {
              map.set(task.quotaIndex, [...(map.get(task.quotaIndex) ?? []), task]);
              return map;
            }, new Map<number, InstanceTask[]>())
            .entries(),
        ]
          .sort(([a], [b]) => a - b)
          .map(([quotaIndex, quotaTasks]) => ({
            quotaIndex,
            required: quotaTasks[0].requiredCount,
            approved: quotaTasks.filter((task) => task.status === "APPROVED").length,
          }));

        const isCurrent = isOpen && !isOverride && level === instance.currentLevel;
        const satisfied = requirements.every((r) => r.approved >= r.required);
        const rejected = tasks.some((task) => task.status === "REJECTED");
        const sequential = tasks[0]?.sequence === "SEQUENTIAL";
        // Under SEQUENTIAL only the earliest still-pending approver may act right now.
        const nextUp = sequential ? tasks.find((t) => t.status === "PENDING") : undefined;
        const pendingHere = tasks.filter((task) => task.status === "PENDING").length;

        return (
          <Step key={level} active={isCurrent} completed={satisfied && !rejected} expanded>
            <StepLabel
              error={rejected}
              optional={
                <Typography variant="caption" color="text.secondary">
                  {isOverride
                    ? "may approve outright, skipping the chain"
                    : sequential
                      ? "one at a time, in order"
                      : isCurrent && pendingHere > 1
                        ? `any one of these ${pendingHere} can approve`
                        : "anyone may act first"}
                </Typography>
              }
            >
              <Stack direction="row" alignItems="center" sx={{ gap: 1, flexWrap: "wrap" }}>
                {isOverride && <BoltRoundedIcon sx={{ fontSize: 16 }} color="warning" />}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {isOverride ? "Override authority" : `Level ${level}`}
                </Typography>
                {requirements.map((requirement) => (
                  <Chip
                    key={requirement.quotaIndex}
                    size="small"
                    variant="outlined"
                    color={requirement.approved >= requirement.required ? "success" : "default"}
                    label={
                      requirement.approved > 0
                        ? `${requirement.approved} of ${requirement.required} signed`
                        : `Needs ${requirement.required} ${
                            requirement.required === 1 ? "approval" : "approvals"
                          }`
                    }
                  />
                ))}
                {isCurrent && <Chip size="small" color="primary" label="Waiting here" />}
              </Stack>
            </StepLabel>

            <StepContent>
              <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                {tasks.map((task) => {
                  const name = String(nameByUserId.get(task.assignedTo) ?? task.assignedTo);
                  const done = task.status !== "PENDING";
                  const canActNow =
                    isOpen &&
                    task.status === "PENDING" &&
                    (isOverride || level === instance.currentLevel) &&
                    (!sequential || nextUp?.id === task.id);

                  return (
                    <Stack key={task.id} direction="row" alignItems="center" sx={{ gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: 10,
                          fontWeight: 700,
                          bgcolor:
                            task.status === "SKIPPED"
                              ? "action.disabledBackground"
                              : "action.selected",
                          color: task.status === "SKIPPED" ? "text.disabled" : "text.secondary",
                        }}
                      >
                        {initialsOf(name)}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          color: task.status === "SKIPPED" ? "text.disabled" : "text.primary",
                        }}
                      >
                        {name}
                      </Typography>

                      {task.status === "PENDING" &&
                        canActNow &&
                        (sequential || pendingHere === 1) && (
                          <Chip size="small" color="primary" variant="outlined" label="Their turn" />
                        )}
                      {task.status === "PENDING" && canActNow && !sequential && pendingHere > 1 && (
                        <Typography variant="caption" color="text.secondary">
                          can approve
                        </Typography>
                      )}
                      {task.status === "PENDING" && !canActNow && isOpen && (
                        <Typography variant="caption" color="text.secondary">
                          {sequential && level === instance.currentLevel
                            ? "waiting their turn"
                            : "not yet"}
                        </Typography>
                      )}
                      {task.status === "SKIPPED" && (
                        <Typography variant="caption" color="text.secondary">
                          {SKIPPED_REASON}
                        </Typography>
                      )}
                      {done && task.actedAt && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(task.actedAt).toLocaleString()}
                        </Typography>
                      )}
                      <Box sx={{ display: "flex" }}>{STATUS_ICON[task.status]}</Box>
                    </Stack>
                  );
                })}
              </Stack>

              {tasks.some((t) => t.reason) && (
                <Stack spacing={0.25} sx={{ mt: 1 }}>
                  {tasks
                    .filter((t) => t.reason)
                    .map((t) => (
                      <Typography key={t.id} variant="caption" color="text.secondary">
                        &ldquo;{t.reason}&rdquo; — {nameByUserId.get(t.actedBy ?? "") ?? "approver"}
                      </Typography>
                    ))}
                </Stack>
              )}
            </StepContent>
          </Step>
        );
      })}
    </Stepper>
  );
}
