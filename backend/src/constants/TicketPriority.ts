import type { FaultSeverity } from "./FaultSeverity";

export const TicketPriority = ["ROUTINE", "URGENT", "EXPRESS", "EMERGENCY"] as const;
export type TicketPriority = (typeof TicketPriority)[number];

export const TicketPriorityRank: Record<TicketPriority, number> = {
  ROUTINE: 1,
  URGENT: 2,
  EXPRESS: 3,
  EMERGENCY: 4
};

export const TicketPriorityText: Record<TicketPriority, string> = {
  ROUTINE: "常规",
  URGENT: "加急",
  EXPRESS: "特急",
  EMERGENCY: "紧急"
};

// 故障等级到未复电工单优先级的映射：故障升级时工单优先级随之只升不降。
export const SEVERITY_TO_TICKET_PRIORITY: Record<FaultSeverity, TicketPriority> = {
  LOW: "ROUTINE",
  MEDIUM: "URGENT",
  HIGH: "EXPRESS",
  CRITICAL: "EMERGENCY"
};
