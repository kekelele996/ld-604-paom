import type { Severity } from "../constants/Severity";

// 工单优先级与故障严重度同序，升级时只升不降
export const TicketPriority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type TicketPriority = (typeof TicketPriority)[number];

export const PriorityRank: Record<TicketPriority, number> = TicketPriority.reduce(
  (acc, value, index) => ({ ...acc, [value]: index }),
  {} as Record<TicketPriority, number>
);

export const TicketPriorityText: Record<TicketPriority, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "紧急"
};

export const isMorePriority = (next: string, current: string): boolean =>
  TicketPriority.includes(next as TicketPriority) &&
  TicketPriority.includes(current as TicketPriority) &&
  PriorityRank[next as TicketPriority] > PriorityRank[current as TicketPriority];

// 故障严重度 -> 未复电工单优先级
export const priorityFromSeverity = (severity: string): TicketPriority =>
  TicketPriority.includes(severity as TicketPriority) ? (severity as TicketPriority) : "MEDIUM";
