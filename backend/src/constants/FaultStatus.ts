// 故障报修状态
export const FaultStatus = ["OPEN", "MERGED", "CLOSED"] as const;
export type FaultStatus = (typeof FaultStatus)[number];

export const FaultStatusText: Record<FaultStatus, string> = {
  OPEN: "未关闭",
  MERGED: "已合并",
  CLOSED: "已关闭"
};

// 已复电/已关闭等终态：合并升级时这些工单保持原样，不允许再升优先级
export const TICKET_LOCKED_STATUSES = ["RESTORED", "CLOSED"] as const;
export type TicketLockedStatus = (typeof TICKET_LOCKED_STATUSES)[number];
