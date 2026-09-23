import type { FaultReport } from "../models/FaultReport";
import type { RepairTicket } from "../models/RepairTicket";
import type { GridAsset } from "../models/GridAsset";

export const createFaultReportDto = (overrides = {}): FaultReport => ({
  id: 1,
  reporter_name: "reporter name 1",
  phone: "13800000001",
  asset_id: 1,
  fault_type: "VOLTAGE_LOW",
  address_desc: "address desc 1",
  severity: "MEDIUM",
  previous_severity: "",
  report_channel: "report channel 1",
  status: "OPEN",
  reported_at: new Date().toISOString(),
  merged_count: 0,
  merged_into_id: null,
  ...overrides
});

// 故障页响应视图：按资产带出合并次数、升级前后等级与已关联工单。
export interface FaultReportView extends FaultReport {
  asset_code: string;
  location_desc: string;
  previous_severity: string;
  escalated: boolean;
  linked_ticket_ids: number[];
}

export const createFaultReportView = (
  row: FaultReport,
  assets: GridAsset[],
  tickets: RepairTicket[]
): FaultReportView => {
  const asset = assets.find((item) => item.id === row.asset_id);
  // 合并记录的工单归属于主故障；主故障直接按 fault_report_id 关联。
  const rootId = row.merged_into_id ?? row.id;
  return {
    ...row,
    asset_code: asset?.asset_code ?? `asset#${row.asset_id}`,
    location_desc: asset?.location_desc ?? "",
    escalated: Boolean(row.previous_severity && row.previous_severity !== row.severity),
    linked_ticket_ids: tickets
      .filter((ticket) => ticket.fault_report_id === rootId)
      .map((ticket) => ticket.id)
  };
};
