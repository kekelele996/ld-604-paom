export const FaultStatus = { OPEN: "OPEN", MERGED: "MERGED", CLOSED: "CLOSED" } as const;
export type FaultStatus = (typeof FaultStatus)[keyof typeof FaultStatus];

export const FaultStatusList: readonly FaultStatus[] = [
  FaultStatus.OPEN,
  FaultStatus.MERGED,
  FaultStatus.CLOSED
];

export const FaultStatusText: Record<FaultStatus, string> = {
  OPEN: "未关闭",
  MERGED: "已合并",
  CLOSED: "已关闭"
};

// 只有未关闭故障才参与 30 分钟重复合并判定。
export const OPEN_FAULT_STATUSES: readonly FaultStatus[] = [FaultStatus.OPEN];
