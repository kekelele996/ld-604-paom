export const LOG_TEMPLATES = {
  GridAsset: ["GridAsset.create", "GridAsset.update", "GridAsset.status", "GridAsset.export"],
  FaultReport: [
    "FaultReport.create",
    "FaultReport.update",
    "FaultReport.status",
    "FaultReport.export",
    "FaultReport.merge",
    "FaultReport.severityEscalate"
  ],
  RepairTicket: [
    "RepairTicket.create",
    "RepairTicket.update",
    "RepairTicket.status",
    "RepairTicket.export",
    "RepairTicket.priorityEscalate"
  ],
  Crew: ["Crew.create", "Crew.update", "Crew.status", "Crew.export"],
  SparePartUsage: ["SparePartUsage.create", "SparePartUsage.update", "SparePartUsage.status", "SparePartUsage.export"]
};
