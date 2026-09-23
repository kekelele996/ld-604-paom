export const LOG_TEMPLATES = {
  GridAsset: ["配网资产创建", "配网资产更新", "配网资产状态变更", "配网资产导出"],
  FaultReport: [
    "故障报修创建",
    "故障报修更新",
    "故障报修状态变更",
    "故障报修导出",
    "故障报修重复合并",
    "故障严重度升级"
  ],
  RepairTicket: [
    "抢修工单创建",
    "抢修工单更新",
    "抢修工单状态变更",
    "抢修工单导出",
    "工单优先级升级",
    "已复电工单跳过升级"
  ],
  Crew: ["抢修班组创建", "抢修班组更新", "抢修班组状态变更", "抢修班组导出"],
  SparePartUsage: ["备件领用创建", "备件领用更新", "备件领用状态变更", "备件领用导出"]
};

export const renderMergeAudit = (newReportId: number, targetFaultId: number, mergedCount: number): string =>
  `${LOG_TEMPLATES.FaultReport[4]}：报修#${newReportId} 并入故障#${targetFaultId}，累计合并 ${mergedCount} 次`;

export const renderSeverityUpgradeAudit = (faultId: number, before: string, after: string): string =>
  `${LOG_TEMPLATES.FaultReport[5]}：故障#${faultId} ${before} → ${after}`;
