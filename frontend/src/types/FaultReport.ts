export type FaultStatusValue = "OPEN" | "MERGED" | "CLOSED";

export interface FaultReport {
  id: number;
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: string;
  address_desc: string;
  severity: string;
  report_channel: string;
  status: FaultStatusValue | string;
  reported_at: string;
  /** 本故障并入的主故障 id；未合并为 null */
  merged_into_id: number | null;
  /** 主故障累计被并入的报修次数（主故障自身记 1 次） */
  merged_count: number;
  /** 严重度升级前等级 */
  severity_before: string | null;
  /** 严重度升级后等级 */
  severity_upgraded_to: string | null;
}

export interface FaultReportDetail extends FaultReport {
  /** 并入本主故障的重复报修列表 */
  merged_reports: FaultReport[];
  /** 已关联工单 */
  tickets: import("./RepairTicket").RepairTicket[];
}

export interface CreateFaultReportPayload {
  reporter_name: string;
  phone: string;
  asset_id: number;
  fault_type: string;
  address_desc: string;
  severity: string;
  report_channel: string;
  client_request_id?: string;
}
