export const FaultStatus = { OPEN: "OPEN", MERGED: "MERGED", CLOSED: "CLOSED" } as const;
export type FaultStatus = (typeof FaultStatus)[keyof typeof FaultStatus];
export const FaultStatusText: Record<FaultStatus, string> = {
  OPEN: "未关闭",
  MERGED: "已合并",
  CLOSED: "已关闭"
};
