// 工单优先级与严重度同序，未复电工单只升不降
export const TicketPriority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type TicketPriority = (typeof TicketPriority)[number];

export const TicketPriorityText: Record<TicketPriority, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "紧急"
};
