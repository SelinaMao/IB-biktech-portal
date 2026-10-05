import type React from "react";

export type StatTone = "success" | "warning" | "info" | "purple";

export interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  action?: string;
  icon: React.ReactNode;
  tone: StatTone;
}

export type TxnDirection = "in" | "out";
