export const LOG_TEMPLATES = {
  GridAsset: ["GridAsset.create", "GridAsset.update", "GridAsset.status", "GridAsset.export"],
  FaultReport: [
    "FaultReport.create",
    "FaultReport.update",
    "FaultReport.status",
    "FaultReport.export",
    "FaultReport.merge",
    "FaultReport.severityUpgrade"
  ],
  RepairTicket: [
    "RepairTicket.create",
    "RepairTicket.update",
    "RepairTicket.status",
    "RepairTicket.export",
    "RepairTicket.priorityUpgrade",
    "RepairTicket.mergeSkipped"
  ],
  Crew: ["Crew.create", "Crew.update", "Crew.status", "Crew.export"],
  SparePartUsage: ["SparePartUsage.create", "SparePartUsage.update", "SparePartUsage.status", "SparePartUsage.export"]
};

export interface FaultMergeLogContext {
  newReportId: number;
  targetFaultId: number;
  assetId: number;
  mergedCount: number;
}

export interface SeverityUpgradeLogContext {
  faultId: number;
  fromSeverity: string;
  toSeverity: string;
  upgradedTicketIds: number[];
  skippedTicketIds: number[];
}

export const renderFaultMergeLog = (ctx: FaultMergeLogContext): string =>
  `FaultReport.merge#${ctx.newReportId}->fault#${ctx.targetFaultId}:asset#${ctx.assetId}:merged_count=${ctx.mergedCount}`;

export const renderSeverityUpgradeLog = (ctx: SeverityUpgradeLogContext): string =>
  `FaultReport.severityUpgrade#fault#${ctx.faultId}:${ctx.fromSeverity}->${ctx.toSeverity}:tickets=[${ctx.upgradedTicketIds.join(",")}]:locked=[${ctx.skippedTicketIds.join(",")}]`;
