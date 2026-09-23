export const FaultStatus = ["OPEN", "MERGED", "CLOSED"] as const;
export type FaultStatus = (typeof FaultStatus)[number];

export const FaultStatusText: Record<FaultStatus, string> = {
  OPEN: "未关闭",
  MERGED: "已合并",
  CLOSED: "已关闭"
};

// 已复电/已关闭工单：升级时保持原样
export const TICKET_LOCKED_STATUSES = ["RESTORED", "CLOSED"] as const;
export const MERGE_WINDOW_MINUTES = 30;
